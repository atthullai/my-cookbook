"use server";

/**
 * Server actions for "eat events" — logging a snack / ad-hoc combo that deducts
 * several pantry items at once (FIFO, reusing deduct_pantry_fifo) and optionally
 * logs supplement servings. Mirrors the planner's markMealCooked deduction.
 */
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { resolvePantryQty } from "@/lib/conversion";

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
  const pfandCreated: { name: string; amount: number }[] = [];
  const loggedItems = [];

  // 1) Deduct each food item from the pantry (FIFO by expiry).
  for (const item of input.items) {
    if (!item.ref || !(item.qty > 0)) continue;
    const { base, baseUnit, tier } = resolvePantryQty(item.qty, item.unit, item.name, item.unitProfile);
    loggedItems.push({ ref: item.ref, name: item.name, qty: item.qty, unit: item.unit, base, baseUnit });

    if (tier === 3 || base <= 0) continue; // non-deductible (e.g. "to taste") — still logged
    const { data: rpcResult } = await supabase.rpc("deduct_pantry_fifo", {
      p_user_id:     user.id,
      p_pantry_ref:  item.ref,
      p_needed_base: base,
      p_meal_name:   label,
    });
    if (rpcResult?.pfand_created?.length) {
      pfandCreated.push(...(rpcResult.pfand_created as { name: string; amount: number }[]));
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
    const remaining = Number(row?.servings_remaining ?? 0);
    const next = Math.max(0, remaining - s.servings);
    await supabase
      .from("supplements")
      .update({ servings_remaining: next, last_taken_on: today })
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
  return { ok: true, pfandCreated };
}
