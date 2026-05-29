/**
 * Helper to add an item to the Pfand tracker (pfand_items table).
 * Used from pantry when an item is discarded and Pfand is detected.
 */
import { supabase } from "@/lib/supabase";
import type { PfandResult } from "@/lib/pfand";

function parseSizeMl(name: string): number | null {
  const m = name.match(/(\d+(?:[.,]\d+)?)\s*(ml|mL|l|L|cl)/i);
  if (!m) return null;
  const val = parseFloat(m[1].replace(",", "."));
  const unit = m[2].toLowerCase();
  if (unit === "l") return Math.round(val * 1000);
  if (unit === "cl") return Math.round(val * 10);
  return Math.round(val);
}

export async function addPfandEntry(
  name: string,
  pfand: PfandResult
): Promise<boolean> {
  if (pfand.pfandType === "none") return false;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase.from("pfand_items").insert({
    user_id: user.id,
    name,
    container_type: pfand.containerType,
    size_ml: parseSizeMl(name),
    deposit: pfand.deposit,
    pfand_type: pfand.pfandType,
    returned: false,
  });

  return !error;
}
