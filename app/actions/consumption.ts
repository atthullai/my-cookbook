"use server";

/**
 * Server actions for "eat events" — logging a snack / ad-hoc combo that deducts
 * several pantry items at once and optionally logs supplement servings.
 *
 * Deduction is done deterministically here (not via deduct_pantry_fifo) so it is
 * unit-aware: eating "2 slices (60 g)" of a brioche works whether the loaf is
 * stored in grams, in slices, or as a whole count (using the item's unit_profile
 * to bridge count↔grams). FIFO over rows of the same name; incompatible rows are
 * skipped rather than mis-deducted.
 */
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { resolvePantryQty } from "@/lib/conversion";
import { UNIT_CONVERSIONS } from "@/lib/pantry-items";

type BaseUnit = "g" | "ml" | "whole";

/** Convert a value in one base family to another using grams-per-whole from a profile. */
function bridgeBase(value: number, from: BaseUnit, to: BaseUnit, profile?: Record<string, number> | null): number | null {
  if (from === to) return value;
  const gramsPerWhole = profile?.whole;
  if (from === "whole" && to === "g" && gramsPerWhole) return value * gramsPerWhole;
  if (from === "g" && to === "whole" && gramsPerWhole) return value / gramsPerWhole;
  return null; // e.g. ml↔whole with no profile — not reconcilable
}

/** Convert a base amount back into a row's display unit (g/kg/ml/L/whole/portion). */
function baseToDisplay(base: number, baseUnit: BaseUnit, displayUnit: string, profile?: Record<string, number> | null): number {
  const du = displayUnit.toLowerCase().replace(/s$/, "");
  // Profile-defined unit (e.g. a "whole" loaf weighing 500 g): invert the grams.
  if (profile && typeof profile[du] === "number" && baseUnit === "g") return base / (profile[du] as number);
  const conv = UNIT_CONVERSIONS[displayUnit as keyof typeof UNIT_CONVERSIONS];
  if (conv && conv.baseUnit === baseUnit) return base / conv.toBase;
  if (baseUnit === "whole" && (du === "portion" || du === "whole")) return base;
  return base;
}

export interface SnackItemInput {
  ref: string;                 // pantry name used for FIFO deduction
  name: string;                // display name
  qty: number;
  unit: string;
  unitProfile?: Record<string, number> | null;
}

export interface SnackSupplementInput {
  id: string;
  name: string;
  servings: number;
}

export interface LogSnackInput {
  label?: string;
  comboId?: string | null;
  items: SnackItemInput[];
  supplements: SnackSupplementInput[];
}

export async function logSnack(
  input: LogSnackInput,
): Promise<{ ok: boolean; pfandCreated: { name: string; amount: number }[] }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const label = input.label?.trim() || "Snack";
  const loggedItems = [];

  // 1) Deduct each food item from the pantry (FIFO by expiry, unit-aware).
  for (const item of input.items) {
    if (!item.ref || !(item.qty > 0)) continue;
    const eaten = resolvePantryQty(item.qty, item.unit, item.name, item.unitProfile);
    loggedItems.push({ ref: item.ref, name: item.name, qty: item.qty, unit: item.unit, base: eaten.base, baseUnit: eaten.baseUnit });
    if (eaten.tier === 3 || eaten.base <= 0) continue; // non-deductible (e.g. "to taste") — still logged

    const { data: rows } = await supabase
      .from("pantry_items")
      .select("id, quantity, unit, unit_profile")
      .eq("user_id", user.id)
      .ilike("name", item.ref)
      .order("expiry_date", { ascending: true, nullsFirst: false });

    let remaining = eaten.base; // tracked in the eaten base family
    for (const row of (rows ?? []) as { id: string; quantity: number | null; unit: string | null; unit_profile: Record<string, number> | null }[]) {
      if (remaining <= 0) break;
      const rowUnit = row.unit || "whole";
      const profile = row.unit_profile ?? item.unitProfile ?? null;
      const rowConv = resolvePantryQty(Number(row.quantity) || 0, rowUnit, item.name, profile);
      if (rowConv.base <= 0) continue;

      const needInRow = bridgeBase(remaining, eaten.baseUnit as BaseUnit, rowConv.baseUnit as BaseUnit, profile);
      if (needInRow == null) continue; // incompatible unit family — skip this row

      const takeInRow = Math.min(needInRow, rowConv.base);
      const newQty = baseToDisplay(rowConv.base - takeInRow, rowConv.baseUnit as BaseUnit, rowUnit, profile);
      await supabase.from("pantry_items").update({ quantity: Number(newQty.toFixed(3)) }).eq("id", row.id);

      const takenInEaten = bridgeBase(takeInRow, rowConv.baseUnit as BaseUnit, eaten.baseUnit as BaseUnit, profile) ?? takeInRow;
      remaining -= takenInEaten;
    }
  }

  // 2) Decrement supplement servings + stamp last_taken_on.
  const loggedSupps = [];
  const today = new Date().toISOString().slice(0, 10);
  for (const s of input.supplements) {
    if (!s.id || !(s.servings > 0)) continue;
    const { data: row } = await supabase
      .from("supplements")
      .select("servings_remaining")
      .eq("id", s.id)
      .eq("user_id", user.id)
      .single();
    const update: Record<string, unknown> = { last_taken_on: today };
    // Only count down a tracked supply; leave an unknown (null) count alone.
    if (row?.servings_remaining != null) {
      update.servings_remaining = Math.max(0, Number(row.servings_remaining) - s.servings);
    }
    await supabase
      .from("supplements")
      .update(update)
      .eq("id", s.id)
      .eq("user_id", user.id);
    loggedSupps.push({ id: s.id, name: s.name, servings: s.servings });
  }

  // 3) Write the eat-event to the consumption log.
  await supabase.from("consumption_log").insert({
    user_id:     user.id,
    label,
    combo_id:    input.comboId ?? null,
    items:       loggedItems,
    supplements: loggedSupps,
  });

  revalidatePath("/pantry");
  return { ok: true, pfandCreated: [] };
}
