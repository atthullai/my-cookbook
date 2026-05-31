// scripts/seed-ingredients.ts
// Run once: npx ts-node scripts/seed-ingredients.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const INGREDIENTS: Array<{
  name_en: string;
  name_de?: string;
  synonyms?: string[];
  category?: string;
  default_unit?: string;
  density?: number;
  weight_per_tsp?: number;
  weight_per_tbsp?: number;
  weight_per_cup?: number;
  weight_per_piece?: number;
  weight_per_sprig?: number;
  edible_portion?: number;
  weight_confidence?: 'exact' | 'measured' | 'estimated' | 'unknown';
}> = [
  // Add ingredients here before running
];

async function seed() {
  if (INGREDIENTS.length === 0) {
    console.log('No ingredients to seed. Add entries to the INGREDIENTS array first.');
    return;
  }

  console.log(`Seeding ${INGREDIENTS.length} ingredients...`);
  const { error } = await supabase
    .from('ingredients')
    .upsert(INGREDIENTS, { onConflict: 'name_en' });

  if (error) {
    console.error('Seed error:', error);
  } else {
    console.log('Seed complete.');
  }
}

seed().catch(console.error);
