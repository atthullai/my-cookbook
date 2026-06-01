// scripts/backfill-equipment-images.ts
// Scans every recipe in the DB, matches each equipment item to the canonical
// equipment library, and writes back the image path + proper label_de.
//
// Run once:
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx ts-node -r tsconfig-paths/register scripts/backfill-equipment-images.ts

import { createClient } from '@supabase/supabase-js';
import { matchEquipment } from '../lib/equipment-matcher';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type EquipmentRow = { label_en: string; label_de?: string; image?: string };

async function backfill() {
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, equipment');

  if (error) { console.error('Fetch error:', error.message); return; }
  if (!recipes) return;

  console.log(`Backfilling equipment images for ${recipes.length} recipes…`);
  let updatedCount = 0;

  for (const recipe of recipes) {
    const rows = (recipe.equipment as EquipmentRow[] | null) ?? [];
    if (rows.length === 0) continue;

    let changed = false;
    const updated = rows.map((eq) => {
      // Already has an image? Skip.
      if (eq.image) return eq;

      const match = matchEquipment(eq.label_en);
      if (!match) return eq;

      changed = true;
      return {
        ...eq,
        label_de: eq.label_de && eq.label_de !== eq.label_en ? eq.label_de : match.name_de,
        image: match.image,
      };
    });

    if (!changed) continue;

    const { error: updateErr } = await supabase
      .from('recipes')
      .update({ equipment: updated })
      .eq('id', recipe.id);

    if (updateErr) {
      console.error(`  ✗ recipe ${recipe.id}:`, updateErr.message);
    } else {
      console.log(`  ✓ recipe ${recipe.id} — enriched ${updated.filter((e) => e.image).length} items`);
      updatedCount++;
    }
  }

  console.log(`Done. Updated ${updatedCount} recipe(s).`);
}

backfill().catch(console.error);
