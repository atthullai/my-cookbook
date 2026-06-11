// Client-side CRUD + helpers for supplements (serving-based, parallel to food).
import { supabase } from "@/lib/supabase";
import type { Supplement } from "@/types";

type Row = {
  id: string;
  name: string;
  brand: string | null;
  servings_per_container: number | null;
  servings_remaining: number | null;
  daily_servings: number | null;
  reorder_at_days: number | null;
  last_taken_on: string | null;
  notes: string | null;
  updated_at: string | null;
};

function fromRow(r: Row): Supplement {
  return {
    id: r.id,
    name: r.name,
    brand: r.brand ?? undefined,
    servingsPerContainer: r.servings_per_container,
    servingsRemaining: r.servings_remaining,
    dailyServings: Number(r.daily_servings ?? 1),
    reorderAtDays: Number(r.reorder_at_days ?? 7),
    lastTakenOn: r.last_taken_on,
    notes: r.notes ?? undefined,
    updatedAt: r.updated_at ?? undefined,
  };
}

export async function getSupplements(): Promise<Supplement[]> {
  const { data, error } = await supabase
    .from("supplements")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data as Row[]).map(fromRow);
}

export async function addSupplement(input: Omit<Supplement, "id" | "updatedAt">): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in");
  const { error } = await supabase.from("supplements").insert({
    user_id:                user.id,
    name:                   input.name,
    brand:                  input.brand ?? null,
    servings_per_container: input.servingsPerContainer ?? null,
    servings_remaining:     input.servingsRemaining ?? input.servingsPerContainer ?? null,
    daily_servings:         input.dailyServings ?? 1,
    reorder_at_days:        input.reorderAtDays ?? 7,
    notes:                  input.notes ?? null,
  });
  if (error) throw error;
}

export async function updateSupplement(id: string, patch: Partial<Supplement>): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.brand !== undefined) payload.brand = patch.brand ?? null;
  if (patch.servingsPerContainer !== undefined) payload.servings_per_container = patch.servingsPerContainer;
  if (patch.servingsRemaining !== undefined) payload.servings_remaining = patch.servingsRemaining;
  if (patch.dailyServings !== undefined) payload.daily_servings = patch.dailyServings;
  if (patch.reorderAtDays !== undefined) payload.reorder_at_days = patch.reorderAtDays;
  if (patch.notes !== undefined) payload.notes = patch.notes ?? null;
  const { error } = await supabase.from("supplements").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteSupplement(id: string): Promise<void> {
  const { error } = await supabase.from("supplements").delete().eq("id", id);
  if (error) throw error;
}

/** Mark a supplement as taken today — decrements by its daily dose. */
export async function takeSupplement(id: string): Promise<void> {
  const { data: row } = await supabase
    .from("supplements")
    .select("servings_remaining, daily_servings")
    .eq("id", id)
    .single();
  const remaining = Number(row?.servings_remaining ?? 0);
  const daily = Number(row?.daily_servings ?? 1);
  const { error } = await supabase
    .from("supplements")
    .update({ servings_remaining: Math.max(0, remaining - daily), last_taken_on: new Date().toISOString().slice(0, 10) })
    .eq("id", id);
  if (error) throw error;
}

/** Estimated days of supply left at the daily dose. */
export function supplementDaysLeft(s: Supplement): number | null {
  if (s.servingsRemaining == null || !s.dailyServings) return null;
  return Math.floor(s.servingsRemaining / s.dailyServings);
}

/** True when it's time to reorder (supply at/under the reorder threshold). */
export function supplementNeedsReorder(s: Supplement): boolean {
  const days = supplementDaysLeft(s);
  return days != null && days <= s.reorderAtDays;
}

/** True if already taken today. */
export function takenToday(s: Supplement): boolean {
  return s.lastTakenOn === new Date().toISOString().slice(0, 10);
}
