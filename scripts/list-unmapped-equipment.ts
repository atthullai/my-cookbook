// Lists equipment labels used in recipes that do NOT resolve to a library icon.
// Run: npx tsx scripts/list-unmapped-equipment.ts
import { createClient } from "@supabase/supabase-js";
import { findEquipmentItem } from "../lib/equipment-library";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  const { data, error } = await supabase.from("recipes").select("id, title_en, equipment");
  if (error) throw error;

  const unmapped = new Map<string, { count: number; recipes: Set<string> }>();
  const mapped = new Set<string>();

  for (const row of data ?? []) {
    const eq = (row.equipment as Array<{ label_en?: string }> | null) ?? [];
    for (const item of eq) {
      const label = item?.label_en?.trim();
      if (!label) continue;
      if (findEquipmentItem(label)) {
        mapped.add(label.toLowerCase());
      } else {
        const e = unmapped.get(label) ?? { count: 0, recipes: new Set<string>() };
        e.count++;
        e.recipes.add(row.title_en ?? `#${row.id}`);
        unmapped.set(label, e);
      }
    }
  }

  console.log(`\nMapped distinct labels: ${mapped.size}`);
  console.log(`Unmapped distinct labels: ${unmapped.size}\n`);
  if (unmapped.size === 0) { console.log("✅ Every equipment label resolves to an icon."); return; }

  const sorted = [...unmapped.entries()].sort((a, b) => b[1].count - a[1].count);
  for (const [label, info] of sorted) {
    console.log(`🔧 "${label}"  ×${info.count}  — ${[...info.recipes].slice(0, 4).join(", ")}${info.recipes.size > 4 ? "…" : ""}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
