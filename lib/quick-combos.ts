// Client-side CRUD for saved "quick combos" — a snack you can re-log in one tap.
import { supabase } from "@/lib/supabase";
import type { QuickCombo, ConsumptionItem, ConsumptionSupplement } from "@/types";

type Row = {
  id: string;
  name: string;
  items: ConsumptionItem[] | null;
  supplements: ConsumptionSupplement[] | null;
  created_at: string | null;
};

function fromRow(r: Row): QuickCombo {
  return {
    id: r.id,
    name: r.name,
    items: r.items ?? [],
    supplements: r.supplements ?? [],
    createdAt: r.created_at ?? undefined,
  };
}

export async function getQuickCombos(): Promise<QuickCombo[]> {
  const { data, error } = await supabase
    .from("quick_combos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Row[]).map(fromRow);
}

export async function saveQuickCombo(
  name: string,
  items: ConsumptionItem[],
  supplements: ConsumptionSupplement[],
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in");
  const { error } = await supabase.from("quick_combos").insert({
    user_id: user.id,
    name,
    items,
    supplements,
  });
  if (error) throw error;
}

export async function deleteQuickCombo(id: string): Promise<void> {
  const { error } = await supabase.from("quick_combos").delete().eq("id", id);
  if (error) throw error;
}
