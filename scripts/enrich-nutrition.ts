// scripts/enrich-nutrition.ts
// One-time (re-runnable) script: enriches every ingredients library row with
// per-100g nutrition data.
//
// Priority:
//   1. IFCT 2017 (npm package, 528 Indian foods, no API calls, no rate limits)
//   2. USDA FoodData Central (everything else)
//   3. Local fallback table (for gaps neither source covers)
//
// Run:
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... USDA_API_KEY=... \
//   npx tsx scripts/enrich-nutrition.ts
//
//   Re-running skips already-enriched rows. Use --force to re-enrich all.

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const USDA_KEY = process.env.USDA_API_KEY ?? 'DEMO_KEY';
const FORCE    = process.argv.includes('--force');

// ── IFCT 2017 CSV parser ──────────────────────────────────────────────────────

type IFCTRow = {
  code: string;
  name: string;
  lang: string;  // local language names (all Indian languages)
  grup: string;
  tags: string;
  // raw numeric fields (units explained below)
  enerc:     number;  // kJ/100g  → ÷4.184 = kcal
  protcnt:   number;  // g/100g
  fatce:     number;  // g/100g
  cholc:     number;  // g/100g  → ×1000 = mg
  choavldf:  number;  // g/100g
  fibtg:     number;  // g/100g
  water:     number;  // g/100g
  na:        number;  // g/100g  → ×1000 = mg
  k:         number;  // g/100g  → ×1000 = mg
  ca:        number;  // g/100g  → ×1000 = mg
  fe:        number;  // g/100g  → ×1000 = mg
  mg:        number;  // g/100g  → ×1000 = mg
  p:         number;  // g/100g  → ×1000 = mg
  zn:        number;  // g/100g  → ×1000 = mg
  vita:      number;  // µg RAE/100g (already mcg)
  vitc:      number;  // g/100g  → ×1000 = mg
  vitd:      number;  // µg/100g (already mcg)
  tocpha:    number;  // mg/100g (already mg)
  vitk1:     number;  // µg/100g (already mcg)
  vitb6c:    number;  // mg/100g (already mg)
  folsum:    number;  // µg/100g (already mcg)
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += ch; }
  }
  result.push(current);
  return result;
}

function loadIFCT(): IFCTRow[] {
  const csvPath = path.join(
    path.dirname(require.resolve('ifct2017')),
    '../@ifct2017/compositions/index.csv'
  );
  if (!fs.existsSync(csvPath)) {
    console.warn('IFCT CSV not found at', csvPath);
    return [];
  }

  const lines = fs.readFileSync(csvPath, 'utf8').split('\n').filter(l => l.trim());
  const headerRaw = parseCSVLine(lines[0]);

  // Map short column codes → array index
  const colIdx: Record<string, number> = {};
  headerRaw.forEach((h, i) => {
    const code = h.split('; ')[1];
    if (code) colIdx[code] = i;
  });

  // Also find vitb6 and folate by scanning header text
  const vitb6Idx  = headerRaw.findIndex(h => /total b6/i.test(h));
  const folIdx    = headerRaw.findIndex(h => /folate/i.test(h));
  if (vitb6Idx > 0) colIdx['vitb6c'] = vitb6Idx;
  if (folIdx > 0)   colIdx['folsum'] = folIdx;

  const num = (row: string[], key: string): number => {
    const v = parseFloat(row[colIdx[key]] ?? '');
    return isNaN(v) ? 0 : v;
  };

  return lines.slice(1).map(line => {
    const r = parseCSVLine(line);
    return {
      code:    r[0] ?? '',
      name:    r[1] ?? '',
      lang:    r[3] ?? '',
      grup:    r[4] ?? '',
      tags:    r[6] ?? '',
      enerc:   num(r, 'enerc'),
      protcnt: num(r, 'protcnt'),
      fatce:   num(r, 'fatce'),
      cholc:   num(r, 'cholc'),
      choavldf:num(r, 'choavldf'),
      fibtg:   num(r, 'fibtg'),
      water:   num(r, 'water'),
      na:      num(r, 'na'),
      k:       num(r, 'k'),
      ca:      num(r, 'ca'),
      fe:      num(r, 'fe'),
      mg:      num(r, 'mg'),
      p:       num(r, 'p'),
      zn:      num(r, 'zn'),
      vita:    num(r, 'vita'),
      vitc:    num(r, 'vitc'),
      vitd:    num(r, 'vitd'),
      tocpha:  num(r, 'tocpha'),
      vitk1:   num(r, 'vitk1'),
      vitb6c:  num(r, 'vitb6c'),
      folsum:  num(r, 'folsum'),
    };
  });
}

function ifctToNutrition(row: IFCTRow) {
  return {
    kcal_per_100g:        row.enerc / 4.184,
    protein_per_100g:     row.protcnt,
    fat_per_100g:         row.fatce,
    sat_fat_per_100g:     null as number | null,  // IFCT doesn't break out sat fat
    carbs_per_100g:       row.choavldf,
    fiber_per_100g:       row.fibtg,
    sugar_per_100g:       null as number | null,
    sodium_per_100g:      row.na    * 1000,
    cholesterol_per_100g: row.cholc * 1000,
    potassium_per_100g:   row.k     * 1000,
    calcium_per_100g:     row.ca    * 1000,
    iron_per_100g:        row.fe    * 1000,
    magnesium_per_100g:   row.mg    * 1000,
    phosphorus_per_100g:  row.p     * 1000,
    zinc_per_100g:        row.zn    * 1000,
    vitamin_a_per_100g:   row.vita,           // already µg RAE
    vitamin_c_per_100g:   row.vitc  * 1000,
    vitamin_d_per_100g:   row.vitd,           // already µg
    vitamin_e_per_100g:   row.tocpha,         // already mg
    vitamin_k_per_100g:   row.vitk1,          // already µg
    vitamin_b6_per_100g:  row.vitb6c,         // already mg
    vitamin_b12_per_100g: null as number | null,
    folate_per_100g:      row.folsum,         // already µg
    nutrition_source:     'ifct' as const,
    nutrition_verified:   false,
    nutrition_updated_at: new Date().toISOString(),
  };
}

// Canonical name aliases: our library name → IFCT food name
// Needed when our name_en differs from IFCT's English name.
const IFCT_ALIASES: Record<string, string> = {
  'sesame oil':          'gingelly oil',
  'sesame seed oil':     'gingelly oil',
  'sesame seeds':        'gingelly seeds, white',
  'black sesame seeds':  'gingelly seeds, black',
  'toor dal':            'red gram, dal',
  'arhar dal':           'red gram, dal',
  'pigeon peas':         'red gram, dal',
  'urad dal':            'black gram, dal',
  'black gram':          'black gram, dal',
  'chana dal':           'bengal gram, dal',
  'chickpeas':           'bengal gram, whole',
  'moong dal':           'green gram, dal',
  'mung beans':          'green gram, whole',
  'masoor dal':          'lentil dal',
  'red lentils':         'lentil dal',
  'turmeric powder':     'turmeric powder',
  'turmeric':            'turmeric powder',
  'curry leaves':        'curry leaf',
  'mustard seeds':       'mustard seeds',
  'cumin seeds':         'cumin seeds',
  'fenugreek seeds':     'fenugreek seeds',
  'coriander seeds':     'coriander seeds',
  'groundnut oil':       'groundnut oil',
  'peanut oil':          'groundnut oil',
  'coconut oil':         'coconut oil',
  'mustard oil':         'mustard oil',
  'rice bran oil':       'rice bran oil',
  'jaggery':             'jaggery, cane',
  'tamarind':            'tamarind, dry',
  'peanuts':             'groundnuts, roasted',
  'roasted peanuts':     'groundnuts, roasted',
  'groundnuts':          'groundnuts, roasted',
  'asafoetida':          'asafoetida',
  'hing':                'asafoetida',
  'idli rice':           'rice, raw milled',
  'poha':                'rice flakes',
  'rice flakes':         'rice flakes',
  'semolina':            'wheat semolina',
  'rava':                'wheat semolina',
  'besan':               'bengal gram flour',
  'gram flour':          'bengal gram flour',
  'coconut milk':        'coconut milk',
  'drumstick':           'drumstick, pods',
  'raw banana':          'plantain, raw',
  'raw mango':           'mango, raw',
  'amla':                'indian gooseberry',
  'indian gooseberry':   'indian gooseberry',
};

// Simple fuzzy search against IFCT rows
function searchIFCT(ifctRows: IFCTRow[], query: string): IFCTRow | null {
  const q = query.toLowerCase().trim();

  // 0. Check alias map first — maps our canonical names to IFCT names
  const aliased = IFCT_ALIASES[q];
  if (aliased) {
    const aliasMatch = ifctRows.find(r => r.name.toLowerCase() === aliased.toLowerCase());
    if (aliasMatch) return aliasMatch;
    // Also try prefix/contains with the alias
    const aliasFuzzy = ifctRows.find(r => r.name.toLowerCase().includes(aliased.toLowerCase()));
    if (aliasFuzzy) return aliasFuzzy;
  }

  // 1. Exact name match
  const exact = ifctRows.find(r => r.name.toLowerCase() === q);
  if (exact) return exact;

  // 2. Name starts with query
  const prefix = ifctRows.find(r => r.name.toLowerCase().startsWith(q));
  if (prefix) return prefix;

  // 3. Query is contained in name
  const contains = ifctRows.find(r => r.name.toLowerCase().includes(q));
  if (contains) return contains;

  // 4. Name is contained in query (e.g. query="toor dal" matches "Red gram, dal")
  const reverse = ifctRows.find(r => q.includes(r.name.toLowerCase().split(',')[0].trim()));
  if (reverse) return reverse;

  // 5. Check local language names (handles: jeera, methi, dal names, etc.)
  const localMatch = ifctRows.find(r =>
    r.lang.toLowerCase().split(/[;.,]+/).some(token => {
      const t = token.trim().replace(/\w+\.\s/g, '').trim();
      return t.length > 2 && (t === q || q.includes(t) || t.includes(q));
    })
  );
  if (localMatch) return localMatch;

  // 6. Tags match
  const tagMatch = ifctRows.find(r => r.tags.toLowerCase().includes(q));
  return tagMatch ?? null;
}

// ── USDA helpers ──────────────────────────────────────────────────────────────

const SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const FOOD_URL   = 'https://api.nal.usda.gov/fdc/v1/food';

async function searchUSDA(query: string): Promise<number | null> {
  const params = new URLSearchParams({ api_key: USDA_KEY, query, pageSize: '6', requireAllWords: 'false' });
  ['Foundation', 'SR Legacy'].forEach(t => params.append('dataType', t));
  const res = await fetch(`${SEARCH_URL}?${params}`);
  if (!res.ok) return null;
  const data = await res.json() as { foods?: Array<{ fdcId: number; description: string; dataType: string }> };
  const foods = data.foods ?? [];
  if (!foods.length) return null;
  const q = query.toLowerCase();
  const scored = foods.map(f => {
    const d = f.description.toLowerCase();
    return { fdcId: f.fdcId, score: (f.dataType === 'Foundation' ? 30 : 15) + (d === q ? 50 : d.startsWith(q) ? 25 : d.includes(q) ? 10 : 0) };
  });
  return scored.sort((a, b) => b.score - a.score)[0].fdcId;
}

type NRow = { nutrient?: { name?: string }; nutrientName?: string; amount?: number; value?: number };

function get(nutrients: NRow[], ...names: string[]): number | null {
  for (const n of nutrients) {
    const name   = (n.nutrient?.name ?? n.nutrientName ?? '').toLowerCase();
    const amount = typeof n.amount === 'number' ? n.amount : typeof n.value === 'number' ? n.value : null;
    if (names.some(nm => name.includes(nm.toLowerCase())) && amount !== null) return amount;
  }
  return null;
}

async function fetchUSDANutrition(fdcId: number) {
  const res = await fetch(`${FOOD_URL}/${fdcId}?api_key=${USDA_KEY}`);
  if (!res.ok) return null;
  const food = await res.json() as { foodNutrients?: NRow[] };
  const n = food.foodNutrients ?? [];
  return {
    usda_fdc_id:          fdcId,
    kcal_per_100g:        get(n, 'energy'),
    protein_per_100g:     get(n, 'protein'),
    fat_per_100g:         get(n, 'total lipid', 'total fat'),
    sat_fat_per_100g:     get(n, 'fatty acids, total saturated'),
    carbs_per_100g:       get(n, 'carbohydrate, by difference'),
    fiber_per_100g:       get(n, 'fiber, total dietary'),
    sugar_per_100g:       get(n, 'sugars, total'),
    sodium_per_100g:      get(n, 'sodium, na'),
    cholesterol_per_100g: get(n, 'cholesterol'),
    potassium_per_100g:   get(n, 'potassium, k'),
    calcium_per_100g:     get(n, 'calcium, ca'),
    iron_per_100g:        get(n, 'iron, fe'),
    magnesium_per_100g:   get(n, 'magnesium, mg'),
    phosphorus_per_100g:  get(n, 'phosphorus, p'),
    zinc_per_100g:        get(n, 'zinc, zn'),
    vitamin_a_per_100g:   get(n, 'vitamin a, rae'),
    vitamin_c_per_100g:   get(n, 'vitamin c'),
    vitamin_d_per_100g:   get(n, 'vitamin d (d2 + d3)'),
    vitamin_e_per_100g:   get(n, 'vitamin e (alpha-tocopherol)'),
    vitamin_k_per_100g:   get(n, 'vitamin k (phylloquinone)'),
    vitamin_b6_per_100g:  get(n, 'vitamin b-6'),
    vitamin_b12_per_100g: get(n, 'vitamin b-12'),
    folate_per_100g:      get(n, 'folate, dfe') ?? get(n, 'folate, total'),
    nutrition_source:     'usda' as const,
    nutrition_verified:   false,
    nutrition_updated_at: new Date().toISOString(),
  };
}

// ── Local fallback for gaps neither IFCT nor USDA covers ─────────────────────

// Only for ingredients genuinely absent from both IFCT and USDA.
// asafoetida → IFCT G019, gingelly oil → IFCT T004 (removed from here).
const LOCAL_FALLBACK: Array<{ patterns: RegExp[]; data: Record<string, number | null> }> = [
  { patterns: [/pottukadalai|roasted gram|fried gram/i],
    data: { kcal_per_100g: 372, protein_per_100g: 22, fat_per_100g: 5.5, carbs_per_100g: 59, fiber_per_100g: 17, calcium_per_100g: 120, iron_per_100g: 5.5, magnesium_per_100g: 170, phosphorus_per_100g: 350, potassium_per_100g: 800 } },
  { patterns: [/kokum/i],
    data: { kcal_per_100g: 50, protein_per_100g: 1, fat_per_100g: 0.2, carbs_per_100g: 13, fiber_per_100g: 2, calcium_per_100g: 40, iron_per_100g: 1.5, vitamin_c_per_100g: 12, potassium_per_100g: 300 } },
];

function findLocalFallback(name: string) {
  const q = name.toLowerCase();
  return LOCAL_FALLBACK.find(f => f.patterns.some(p => p.test(q)));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function enrich() {
  console.log('Loading IFCT 2017 data…');
  const ifctRows = loadIFCT();
  console.log(`IFCT loaded: ${ifctRows.length} foods`);

  const { data: rows, error } = await supabase
    .from('ingredients')
    .select('id, name_en, synonyms, usda_fdc_id, nutrition_source');

  if (error) { console.error('Supabase fetch error:', error.message); return; }
  if (!rows) return;

  const toEnrich = FORCE ? rows : rows.filter(r => !r.nutrition_source);
  console.log(`Enriching ${toEnrich.length} of ${rows.length} ingredients…\n`);

  let ifct = 0, usda = 0, local = 0, missed = 0;

  for (const row of toEnrich) {
    const names = [row.name_en, ...(Array.isArray(row.synonyms) ? row.synonyms.slice(0, 2) : [])];

    // ── 1. Try IFCT first ────────────────────────────────────────────────────
    let ifctMatch: IFCTRow | null = null;
    for (const name of names) {
      ifctMatch = searchIFCT(ifctRows, name);
      if (ifctMatch) break;
    }

    if (ifctMatch) {
      const data = ifctToNutrition(ifctMatch);
      const { error: e } = await supabase.from('ingredients').update(data).eq('id', row.id);
      if (e) console.error(`  ✗ ${row.name_en}:`, e.message);
      else { console.log(`  🌿 ${row.name_en} → IFCT: ${ifctMatch.name} (${(data.kcal_per_100g ?? 0).toFixed(0)} kcal)`); ifct++; }
      continue;
    }

    // ── 2. Try USDA ──────────────────────────────────────────────────────────
    let fdcId: number | null = row.usda_fdc_id ?? null;
    if (!fdcId) {
      for (const name of names) {
        fdcId = await searchUSDA(name);
        if (fdcId) break;
        await new Promise(r => setTimeout(r, 120));
      }
    }

    if (fdcId) {
      const nutrition = await fetchUSDANutrition(fdcId);
      if (nutrition) {
        const { error: e } = await supabase.from('ingredients').update(nutrition).eq('id', row.id);
        if (e) console.error(`  ✗ ${row.name_en}:`, e.message);
        else { console.log(`  ✓ ${row.name_en} → USDA fdcId ${fdcId} (${(nutrition.kcal_per_100g ?? 0).toFixed(0)} kcal)`); usda++; }
        await new Promise(r => setTimeout(r, 260)); // respect rate limit
        continue;
      }
    }

    // ── 3. Local fallback ────────────────────────────────────────────────────
    const fallback = findLocalFallback(row.name_en);
    if (fallback) {
      const data = {
        ...Object.fromEntries(Object.entries(fallback.data).map(([k, v]) => [k, v ?? null])),
        nutrition_source: 'local_fallback' as const,
        nutrition_verified: false,
        nutrition_updated_at: new Date().toISOString(),
      };
      const { error: e } = await supabase.from('ingredients').update(data).eq('id', row.id);
      if (e) console.error(`  ✗ ${row.name_en}:`, e.message);
      else { console.log(`  📦 ${row.name_en} → local fallback`); local++; }
      continue;
    }

    console.log(`  ⚠️  ${row.name_en} — not found in IFCT, USDA, or local fallback`);
    missed++;
    await new Promise(r => setTimeout(r, 120));
  }

  console.log(`
Done.
  🌿 IFCT 2017:     ${ifct}
  ✓  USDA:          ${usda}
  📦 Local fallback: ${local}
  ⚠️  Missed:        ${missed}
  `);

  if (missed > 0) {
    console.log('For missed items: either add to LOCAL_FALLBACK in this script,');
    console.log('or manually set usda_fdc_id in Supabase and re-run with --force.');
  }
}

enrich().catch(console.error);
