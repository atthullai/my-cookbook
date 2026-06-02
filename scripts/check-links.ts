import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data } = await sb.from('recipes').select('id, title_en, ingredients').limit(3);
  for (const r of data ?? []) {
    console.log('\nRecipe:', r.title_en);
    const groups = (r.ingredients ?? []) as Array<{items?: Array<{name_en?: string; libraryId?: string}>}>;
    for (const g of groups) {
      for (const item of g.items ?? []) {
        console.log('  ', JSON.stringify(item.name_en), '| libraryId:', item.libraryId ?? 'NULL');
      }
    }
  }
}
main();
