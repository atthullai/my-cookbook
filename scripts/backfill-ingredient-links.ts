// scripts/backfill-ingredient-links.ts
// Run once after seeding: npx ts-node scripts/backfill-ingredient-links.ts
import { createClient } from '@supabase/supabase-js';
import { matchToLibrary } from '../lib/ingredient-matcher';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function backfill() {
  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, ingredients');

  if (error) { console.error(error); return; }
  if (!recipes) return;
  console.log(`Backfilling ${recipes.length} recipes...`);

  for (const recipe of recipes) {
    let changed = false;
    const groups = (recipe.ingredients as Array<{ group_en: string; items: Array<Record<string, unknown>> }>) ?? [];

    for (const group of groups) {
      for (const item of group.items ?? []) {
        if (item.libraryId) continue; // already matched

        const nameEn = (item.name_en as string) ?? '';
        const { libraryId, confidence } = await matchToLibrary(nameEn, supabase);

        if (libraryId) {
          item.libraryId = libraryId;
          item.weightConfidence = confidence;
          changed = true;
        }
      }
    }

    if (changed) {
      const { error: updateErr } = await supabase
        .from('recipes')
        .update({ ingredients: groups })
        .eq('id', recipe.id);
      if (updateErr) console.error(`Recipe ${recipe.id}:`, updateErr);
      else console.log(`Updated recipe ${recipe.id}`);
    }
  }

  console.log('Backfill complete.');
}

backfill().catch(console.error);
