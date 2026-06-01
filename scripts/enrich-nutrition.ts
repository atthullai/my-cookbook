// scripts/enrich-nutrition.ts
// One-time (and re-runnable) script: fetches per-100g nutrition from USDA
// for every row in the ingredients library and caches it in the DB.
//
// Run:
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... USDA_API_KEY=... \
//   npx tsx scripts/enrich-nutrition.ts
//
// Re-running is safe — already-enriched rows are skipped unless --force is passed.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const USDA_KEY = process.env.USDA_API_KEY ?? 'DEMO_KEY';
const FORCE = process.argv.includes('--force');

// ── USDA helpers ──────────────────────────────────────────────────────────────

const SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const FOOD_URL   = 'https://api.nal.usda.gov/fdc/v1/food';

async function searchUSDA(query: string): Promise<number | null> {
  const params = new URLSearchParams({
    api_key: USDA_KEY,
    query,
    pageSize: '6',
    requireAllWords: 'false',
  });
  ['Foundation', 'SR Legacy'].forEach(t => params.append('dataType', t));

  const res = await fetch(`${SEARCH_URL}?${params}`);
  if (!res.ok) return null;
  const data = await res.json() as { foods?: Array<{ fdcId: number; description: string; dataType: string }> };

  const foods = data.foods ?? [];
  if (foods.length === 0) return null;

  // Score: prefer Foundation > SR Legacy, boost exact/prefix matches
  const q = query.toLowerCase();
  const scored = foods.map(f => {
    const desc = f.description.toLowerCase();
    const typeBoost = f.dataType === 'Foundation' ? 30 : 15;
    const nameBoost = desc === q ? 50 : desc.startsWith(q) ? 25 : desc.includes(q) ? 10 : 0;
    return { fdcId: f.fdcId, score: typeBoost + nameBoost };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].fdcId;
}

type NutrientRow = { nutrient?: { name?: string; number?: string }; nutrientName?: string; nutrientNumber?: string; amount?: number; value?: number };

function get(nutrients: NutrientRow[], ...names: string[]): number | null {
  for (const n of nutrients) {
    const name   = n.nutrient?.name ?? n.nutrientName ?? '';
    const amount = typeof n.amount === 'number' ? n.amount : typeof n.value === 'number' ? n.value : null;
    if (names.some(nm => name.toLowerCase().includes(nm.toLowerCase())) && amount !== null) {
      return amount;
    }
  }
  return null;
}

async function fetchNutrition(fdcId: number) {
  const res = await fetch(`${FOOD_URL}/${fdcId}?api_key=${USDA_KEY}`);
  if (!res.ok) return null;
  const food = await res.json() as { foodNutrients?: NutrientRow[] };
  const n = food.foodNutrients ?? [];

  return {
    usda_fdc_id:          fdcId,
    kcal_per_100g:        get(n, 'Energy') ?? get(n, 'energy'),
    protein_per_100g:     get(n, 'Protein'),
    fat_per_100g:         get(n, 'Total lipid (fat)', 'Total Fat'),
    sat_fat_per_100g:     get(n, 'Fatty acids, total saturated'),
    carbs_per_100g:       get(n, 'Carbohydrate, by difference'),
    fiber_per_100g:       get(n, 'Fiber, total dietary'),
    sugar_per_100g:       get(n, 'Sugars, total'),
    sodium_per_100g:      get(n, 'Sodium, Na'),
    cholesterol_per_100g: get(n, 'Cholesterol'),
    potassium_per_100g:   get(n, 'Potassium, K'),
    calcium_per_100g:     get(n, 'Calcium, Ca'),
    iron_per_100g:        get(n, 'Iron, Fe'),
    magnesium_per_100g:   get(n, 'Magnesium, Mg'),
    phosphorus_per_100g:  get(n, 'Phosphorus, P'),
    zinc_per_100g:        get(n, 'Zinc, Zn'),
    vitamin_a_per_100g:   get(n, 'Vitamin A, RAE'),
    vitamin_c_per_100g:   get(n, 'Vitamin C'),
    vitamin_d_per_100g:   get(n, 'Vitamin D (D2 + D3)'),
    vitamin_e_per_100g:   get(n, 'Vitamin E (alpha-tocopherol)'),
    vitamin_k_per_100g:   get(n, 'Vitamin K (phylloquinone)'),
    vitamin_b6_per_100g:  get(n, 'Vitamin B-6'),
    vitamin_b12_per_100g: get(n, 'Vitamin B-12'),
    folate_per_100g:      get(n, 'Folate, DFE', 'Folate, total'),
    nutrition_source:     'usda' as const,
    nutrition_verified:   false,
    nutrition_updated_at: new Date().toISOString(),
  };
}

// ── Local fallback nutrition (for Indian ingredients USDA doesn't cover) ─────

const LOCAL_NUTRITION: Record<string, ReturnType<typeof localEntry>> = {};

function localEntry(name: string, data: Record<string, number>) {
  return {
    usda_fdc_id:          null as number | null,
    kcal_per_100g:        data.kcal        ?? null,
    protein_per_100g:     data.protein     ?? null,
    fat_per_100g:         data.fat         ?? null,
    sat_fat_per_100g:     data.sat_fat     ?? null,
    carbs_per_100g:       data.carbs       ?? null,
    fiber_per_100g:       data.fiber       ?? null,
    sugar_per_100g:       data.sugar       ?? null,
    sodium_per_100g:      data.sodium      ?? null,
    cholesterol_per_100g: data.cholesterol ?? null,
    potassium_per_100g:   data.potassium   ?? null,
    calcium_per_100g:     data.calcium     ?? null,
    iron_per_100g:        data.iron        ?? null,
    magnesium_per_100g:   data.magnesium   ?? null,
    phosphorus_per_100g:  data.phosphorus  ?? null,
    zinc_per_100g:        data.zinc        ?? null,
    vitamin_a_per_100g:   data.vitamin_a   ?? null,
    vitamin_c_per_100g:   data.vitamin_c   ?? null,
    vitamin_d_per_100g:   data.vitamin_d   ?? null,
    vitamin_e_per_100g:   data.vitamin_e   ?? null,
    vitamin_k_per_100g:   data.vitamin_k   ?? null,
    vitamin_b6_per_100g:  data.vitamin_b6  ?? null,
    vitamin_b12_per_100g: data.vitamin_b12 ?? null,
    folate_per_100g:      data.folate      ?? null,
    nutrition_source:     'local_fallback' as const,
    nutrition_verified:   false,
    nutrition_updated_at: new Date().toISOString(),
    _name: name,
  };
}

// Indian ingredients that USDA doesn't reliably carry
[
  localEntry('curry leaves',          { kcal: 108, protein: 6,    fat: 1,   carbs: 19,  fiber: 7,  calcium: 810, iron: 7,    magnesium: 44,  potassium: 535,  vitamin_a: 7000, vitamin_c: 4,   folate: 57 }),
  localEntry('asafoetida',            { kcal: 297, protein: 4,    fat: 1,   carbs: 68,  fiber: 4,  calcium: 690, iron: 39,   phosphorus: 50, potassium: 1060 }),
  localEntry('toor dal',              { kcal: 343, protein: 22,   fat: 1.5, carbs: 63,  fiber: 15, calcium: 130, iron: 5.2,  magnesium: 183, phosphorus: 367, zinc: 2.8, potassium: 1392, folate: 456 }),
  localEntry('urad dal',              { kcal: 341, protein: 25,   fat: 1.6, carbs: 59,  fiber: 18, calcium: 138, iron: 7.6,  magnesium: 267, phosphorus: 379, zinc: 3.4, potassium: 983,  folate: 216 }),
  localEntry('pottukadalai',          { kcal: 372, protein: 22,   fat: 5.5, carbs: 59,  fiber: 17, calcium: 120, iron: 5.5,  magnesium: 170, phosphorus: 350, zinc: 3.2, potassium: 800 }),
  localEntry('idli rice',             { kcal: 356, protein: 6.5,  fat: 0.5, carbs: 79,  fiber: 0.6, calcium: 10, iron: 0.7, magnesium: 25,  phosphorus: 98,  potassium: 115 }),
  localEntry('jaggery',               { kcal: 383, protein: 0.4,  fat: 0.1, carbs: 98,  sugar: 97, calcium: 80,  iron: 11,   magnesium: 70,  potassium: 1050 }),
  localEntry('tamarind',              { kcal: 239, protein: 2.8,  fat: 0.6, carbs: 63,  fiber: 5,  sugar: 38, calcium: 74,  iron: 2.8,  magnesium: 92,  phosphorus: 113, potassium: 628, vitamin_c: 3.5, folate: 14 }),
  localEntry('kokum',                 { kcal: 50,  protein: 1,    fat: 0.2, carbs: 13,  fiber: 2,  calcium: 40,  iron: 1.5,  vitamin_c: 12,  potassium: 300 }),
  localEntry('drumstick',             { kcal: 64,  protein: 9.4,  fat: 1.4, carbs: 8.3, fiber: 2,  calcium: 185, iron: 5.3,  magnesium: 147, potassium: 337, vitamin_a: 378, vitamin_c: 51, folate: 40 }),
  localEntry('raw banana',            { kcal: 89,  protein: 1.1,  fat: 0.3, carbs: 23,  fiber: 2.6, sugar: 12, calcium: 5, iron: 0.3,  potassium: 358, vitamin_b6: 0.4, folate: 20 }),
  localEntry('gingelly oil',          { kcal: 884, protein: 0,    fat: 100, sat_fat: 14, carbs: 0, vitamin_e: 1.4, vitamin_k: 13.6 }),
  localEntry('coconut oil',           { kcal: 862, protein: 0,    fat: 100, sat_fat: 87, carbs: 0 }),
].forEach(e => { LOCAL_NUTRITION[e._name] = e; });

// ── Main ──────────────────────────────────────────────────────────────────────

async function enrich() {
  const { data: rows, error } = await supabase
    .from('ingredients')
    .select('id, name_en, synonyms, usda_fdc_id, nutrition_source');

  if (error) { console.error('Fetch error:', error.message); return; }
  if (!rows) return;

  const toEnrich = FORCE
    ? rows
    : rows.filter(r => !r.nutrition_source);

  console.log(`Enriching ${toEnrich.length} of ${rows.length} ingredients…`);

  let usda = 0, local = 0, missed = 0;

  for (const row of toEnrich) {
    // 1. Check local fallback first for ingredients USDA doesn't cover
    const localKey = Object.keys(LOCAL_NUTRITION).find(k =>
      row.name_en.toLowerCase().includes(k) || k.includes(row.name_en.toLowerCase())
    );
    if (localKey) {
      const { _name, ...data } = LOCAL_NUTRITION[localKey];
      void _name;
      const { error: e } = await supabase.from('ingredients').update(data).eq('id', row.id);
      if (e) console.error(`  ✗ ${row.name_en}:`, e.message);
      else { console.log(`  📦 ${row.name_en} (local fallback)`); local++; }
      continue;
    }

    // 2. If already has FDC ID, fetch direct (most accurate)
    let fdcId: number | null = row.usda_fdc_id ?? null;

    // 3. Otherwise search by canonical name
    if (!fdcId) {
      fdcId = await searchUSDA(row.name_en);
      if (!fdcId && Array.isArray(row.synonyms) && row.synonyms.length > 0) {
        // Try first synonym if name search fails
        fdcId = await searchUSDA(row.synonyms[0]);
      }
    }

    if (!fdcId) {
      console.log(`  ⚠️  ${row.name_en} — not found in USDA`);
      missed++;
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 120));
      continue;
    }

    const nutrition = await fetchNutrition(fdcId);
    if (!nutrition) {
      console.log(`  ⚠️  ${row.name_en} (fdcId ${fdcId}) — nutrition fetch failed`);
      missed++;
      await new Promise(r => setTimeout(r, 120));
      continue;
    }

    const { error: e } = await supabase.from('ingredients').update(nutrition).eq('id', row.id);
    if (e) console.error(`  ✗ ${row.name_en}:`, e.message);
    else { console.log(`  ✓ ${row.name_en} (fdcId ${fdcId})`); usda++; }

    // Respect USDA rate limits: ~4 requests/sec max
    await new Promise(r => setTimeout(r, 260));
  }

  console.log(`\nDone. USDA: ${usda} | Local: ${local} | Missed: ${missed}`);
  if (missed > 0) console.log('Tip: manually set usda_fdc_id for missed rows or add to LOCAL_NUTRITION.');
}

enrich().catch(console.error);
