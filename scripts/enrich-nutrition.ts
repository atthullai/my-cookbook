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
  // IFCT stores enerc=0 for pure oils (measured fat but not energy).
  // Fall back to Atwater calculation: fat×9 + protein×4 + carbs×4
  const kcal = row.enerc > 0
    ? row.enerc / 4.184
    : row.fatce * 9 + row.protcnt * 4 + row.choavldf * 4;
  return {
    kcal_per_100g:        kcal,
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

// ════════════════════════════════════════════════════════════════════════════
// MATCHING ARCHITECTURE (5 steps, per ingredient)
//
// 1. IFCT_MANUAL_MAP  — explicit name overrides, highest priority
// 2. SKIP_IFCT        — non-Indian / no IFCT equivalent → jump straight to USDA
// 3. Category-filtered fuzzy IFCT (Dice bigram similarity ≥ 0.65)
// 4. USDA API (with USDA_MANUAL_FDC for known IDs)
// 5. Mark nutrition_source = 'none' — never store wrong data
// ════════════════════════════════════════════════════════════════════════════

// ── Step 1: Manual IFCT name map ────────────────────────────────────────────
// Maps our ingredient name_en → exact IFCT food name.
// Use for Indian ingredients where names differ (toor dal ≠ Red gram, dal).
const IFCT_MANUAL_MAP: Record<string, string> = {
  // Cereals & Grains
  'basmati rice':         'Rice, raw, milled',
  'raw rice':             'Rice, raw, milled',
  'idli rice':            'Rice, raw, milled',
  'sona masuri rice':     'Rice, raw, milled',
  'cooked rice':          'Rice, raw, milled',
  'brown rice':           'Rice, raw, brown',
  'parboiled rice':       'Rice, parboiled, milled',
  'ponni boiled rice':    'Rice, parboiled, milled',
  'poha':                 'Rice flakes',
  'aval':                 'Rice flakes',
  'idli rava':            'Rice flakes',
  'rice flour':           'Rice, raw, milled',
  'rice noodles':         'Rice, raw, milled',
  'wheat flour':          'Wheat flour, atta',
  'whole wheat flour':    'Wheat flour, atta',
  'atta':                 'Wheat flour, atta',
  'all-purpose flour':    'Wheat flour, refined',
  'maida':                'Wheat flour, refined',
  'semolina':             'Wheat, semolina',
  'rava':                 'Wheat, semolina',
  'vermicelli':           'Wheat, vermicelli',
  'bulgur':               'Wheat, bulgur',
  'ragi':                 'Ragi',
  'bajra':                'Bajra',
  'jowar':                'Jowar',
  'quinoa':               'Quinoa',
  // Dals & Legumes
  'toor dal':             'Red gram, dal',
  'arhar dal':            'Red gram, dal',
  'urad dal':             'Black gram, dal',
  'black urad dal':       'Black gram, whole',
  'chana dal':            'Bengal gram, dal',
  'moong dal':            'Green gram, dal',
  'split green moong':    'Green gram, dal',
  'whole moong':          'Green gram, whole',
  'masoor dal':           'Lentil dal',
  'chickpea':             'Bengal gram, whole',
  'black chickpea':       'Bengal gram, whole',
  'pottukadalai':         'Bengal gram, whole',
  'kidney beans':         'Rajmah, red',
  'rajma':                'Rajmah, red',
  'black eyed peas':      'Cowpea, white',
  'horse gram':           'Horse gram, whole',
  'moth bean':            'Moth bean',
  'green peas':           'Peas, dry',
  // Oils (IFCT has fat=100, enerc=0 → Atwater calc gives correct kcal)
  'sesame oil':           'Gingelly oil',
  'gingelly oil':         'Gingelly oil',
  'til oil':              'Gingelly oil',
  'sesame seed oil':      'Gingelly oil',
  'coconut oil':          'Coconut oil',
  'groundnut oil':        'Groundnut oil',
  'mustard oil':          'Mustard oil',
  'rice bran oil':        'Rice bran oil',
  'sunflower oil':        'Sunflower oil',
  'corn oil':             'Corn oil',
  'ghee':                 'Ghee',
  // Spices (verified)
  'turmeric powder':      'Turmeric powder',
  'red chilli powder':    'Chillies, red',
  'dried red chilli':     'Chillies, red',
  'dried chilli flakes':  'Chillies, red',
  'green chilli':         'Chillies, green - all varieties',
  'asafoetida':           'Asafoetida',
  'hing':                 'Asafoetida',
  'ajwain':               'Omum',
  'carom seeds':          'Omum',
  'sesame seeds':         'Gingelly seeds, white',
  'til':                  'Gingelly seeds, white',
  'black sesame seeds':   'Gingelly seeds, black',
  'cumin powder':         'Cumin seeds',
  'coriander powder':     'Coriander seeds',
  'black pepper powder':  'Pepper, black',
  // Herbs
  'curry leaves':         'Curry leaves',
  'karivepilai':          'Curry leaves',
  'kasoori methi':        'Fenugreek leaves',
  'kasuri methi':         'Fenugreek leaves',
  'dried fenugreek leaves': 'Fenugreek leaves',
  'spring onion':         'Onion, stalk',
  // Aromatics
  'onion':                'Onion, big',
  'shallots':             'Onion, small',
  'ginger-garlic paste':  'Ginger, fresh',
  // Vegetables
  'brinjal':              'Brinjal - all varieties',
  'eggplant':             'Brinjal - all varieties',
  'ladies finger':        'Ladies finger',
  'okra':                 'Ladies finger',
  'bitter gourd':         'Bitter gourd, jagged, teeth ridges, elongate',
  'bottle gourd':         'Bottle gourd, elongate, pale green',
  'raw banana':           'Plantain, green',
  'taro root':            'Colocasia',
  'ivy gourd':            'Kovai, big',
  'drumstick':            'Drumstick',
  'raw mango':            'Mango, green, raw',
  'bok choy':             'Pak Choi leaves',
  // Fruits
  'mango':                'Mango, ripe, totapari',
  'banana':               'Banana, ripe, robusta',
  'dry grapes':           'Raisins, dried, black',
  'amla':                 'Goosberry',
  'coconut cream':        'Coconut, kernel, fresh',
  // Nuts & Seeds
  'peanuts':              'Ground nut',
  'groundnuts':           'Ground nut',
  'roasted peanuts':      'Ground nut',
  'cashew nuts':          'Cashew nut',
  'flaxseeds':            'Linseeds',
  // Dairy
  'cow milk':             'Milk, whole, Cow',
  'buffalo milk':         'Milk, whole, Buffalo',
  'khoa':                 'Khoa',
  'mawa':                 'Khoa',
  // Proteins
  'chicken breast':       'Chicken, poultry, breast, skinless',
  'chicken thigh':        'Chicken, poultry, thigh, skinless',
  'chicken leg':          'Chicken, poultry, leg, skinless',
  'mutton':               'Goat, shoulder, meat',
  'goat meat':            'Goat, shoulder, meat',
  'prawn':                'Tiger prawns, brown',
  'shrimp':               'Tiger prawns, brown',
  // Sugars
  'jaggery':              'Jaggery, cane',
  'vellam':               'Jaggery, cane',
  'gur':                  'Jaggery, cane',
  'tamarind':             'Tamarind, pulp',
};

// ── Step 2: SKIP_IFCT — go straight to USDA ─────────────────────────────────
// Non-Indian ingredients, or ingredients with no reliable IFCT entry.
const SKIP_IFCT = new Set([
  // Western / non-Indian herbs & spices
  'rosemary', 'thyme', 'basil', 'dill', 'chives', 'lemongrass',
  'kaffir lime leaves', 'caraway seeds', 'fennel seeds', 'star anise',
  'bay leaf', 'cinnamon stick', 'cinnamon powder', 'saffron',
  'jalapeño', 'dried kashmiri chilli', 'kashmiri chilli powder',
  'paprika powder', 'paprika', 'amchur powder',
  'garlic powder', 'onion powder', 'fenugreek powder', 'fennel powder',
  'ajwain powder',
  // Spice blends (not in IFCT)
  'garam masala', 'sambar powder', 'rasam powder', 'biryani masala',
  'chat masala', 'curry powder',
  // Western oils
  'olive oil', 'extra virgin olive oil', 'rapeseed oil', 'flaxseed oil',
  'avocado oil', 'walnut oil', 'grapeseed oil', 'butter',
  // Dairy not in IFCT
  'yogurt', 'buttermilk', 'cream', 'heavy cream', 'sour cream',
  'condensed milk', 'cream cheese', 'mozzarella', 'feta',
  'parmigiano reggiano', 'cheddar',
  // Proteins with no IFCT match
  'minced meat', 'tofu', 'soya chunks',
  // Pantry / sauces
  'coconut milk', 'tomato paste', 'tomato passata', 'canned tomatoes',
  'tahini', 'miso paste', 'soy sauce', 'fish sauce', 'vinegar',
  'apple cider vinegar', 'vegetable stock', 'chicken stock', 'beef stock',
  'rose water', 'thai red curry paste',
  // Non-Indian fruits
  'blueberry', 'raspberry', 'strawberry', 'orange', 'watermelon',
  // Baking & processed
  'oats', 'pasta', 'spaghetti', 'penne', 'fettuccine', 'rigatoni',
  'fusilli', 'breadcrumbs', 'panko', 'cornstarch',
  'baking powder', 'baking soda', 'yeast', 'dark chocolate', 'cocoa powder',
  'maple syrup', 'honey', 'sugar', 'dark brown sugar', 'powdered sugar',
  'vanilla extract', 'vanilla bean',
  // Generic / no meaning
  'oil', 'water', 'salt', 'mixed vegetables',
]);

// ── Step 3a: Category → allowed IFCT food groups ────────────────────────────
// Maps our DB ingredient categories to IFCT's food group strings.
// Empty array means "never try IFCT for this category".
const IFCT_CATEGORY_FILTER: Record<string, string[]> = {
  oils:          ['Edible Oils and Fats'],
  spices_whole:  ['Condiments and Spices', 'Nuts and Oil Seeds'],
  spices_powder: ['Condiments and Spices'],
  herbs:         ['Condiments and Spices', 'Green Leafy Vegetables'],
  dals:          ['Grain Legumes'],
  grains:        ['Cereals and Millets'],
  vegetables:    ['Other Vegetables', 'Roots and Tubers', 'Green Leafy Vegetables', 'Mushrooms'],
  fruits:        ['Fruits'],
  nuts:          ['Nuts and Oil Seeds'],
  proteins:      ['Poultry', 'Animal Meat', 'Marine Fish', 'Fresh Water Fish and Shellfish',
                  'Egg and Egg Products', 'Marine Shellfish', 'Marine Mollusks'],
  dairy:         ['Milk and Milk Products'],
  sweet:         ['Sugars'],
  aromatics:     ['Condiments and Spices', 'Other Vegetables'],
  // These categories should always go to USDA
  cheese:        [],
  pantry:        [],
  baking:        [],
  flour:         ['Cereals and Millets', 'Grain Legumes'],
  flavouring:    [],
  other:         [],
};

// ── Step 3b: Bigram Dice similarity ─────────────────────────────────────────
function bigrams(s: string): Set<string> {
  const result = new Set<string>();
  const clean = s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  for (let i = 0; i < clean.length - 1; i++) result.add(clean.slice(i, i + 2));
  return result;
}

function diceSimilarity(a: string, b: string): number {
  const ba = bigrams(a);
  const bb = bigrams(b);
  if (ba.size === 0 || bb.size === 0) return 0;
  let intersection = 0;
  for (const bg of ba) { if (bb.has(bg)) intersection++; }
  return (2 * intersection) / (ba.size + bb.size);
}

// ── Step 4: Manual USDA FDC IDs ─────────────────────────────────────────────
// For ingredients that need a specific FDC ID (not found by search).
const USDA_MANUAL_FDC: Record<string, number> = {
  'parmigiano reggiano': 173414,   // Cheese, parmesan, hard — SR Legacy
  'black stone flower':  169270,
  'fennel seeds':        2747655,
  'fennel bulb':         2747655,
  'star anise':          171316,
};

// ── Main IFCT lookup ─────────────────────────────────────────────────────────
function searchIFCT(ifctRows: IFCTRow[], query: string, category: string): IFCTRow | null {
  const q = query.toLowerCase().trim();

  // Step 1: Manual map — exact IFCT name override
  const manualName = IFCT_MANUAL_MAP[q];
  if (manualName) {
    const exact = ifctRows.find(r => r.name.toLowerCase() === manualName.toLowerCase());
    if (exact) return exact;
    // Prefix fallback (e.g. "Gingelly seeds, white" starts with "gingelly seeds")
    const prefix = ifctRows.find(r => r.name.toLowerCase().startsWith(manualName.toLowerCase().split(',')[0]));
    if (prefix) return prefix;
    return null; // manual map specified but IFCT food not found — fall through to USDA
  }

  // Step 2: Skip non-Indian / no IFCT equivalent
  if (SKIP_IFCT.has(q)) return null;

  // Step 3: Category-filtered fuzzy match (Dice ≥ 0.65)
  const allowedGroups = IFCT_CATEGORY_FILTER[category] ?? [];
  if (allowedGroups.length === 0) return null; // category has no IFCT equivalent

  const candidates = ifctRows.filter(r => allowedGroups.includes(r.grup));
  const best = candidates
    .map(r => ({ row: r, score: diceSimilarity(q, r.name.toLowerCase()) }))
    .filter(x => x.score >= 0.65)
    .sort((a, b) => b.score - a.score)[0];

  return best?.row ?? null;
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

// ── Local fallback ────────────────────────────────────────────────────────────

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
    .select('id, name_en, synonyms, usda_fdc_id, nutrition_source, category');

  if (error) { console.error('Supabase fetch error:', error.message); return; }
  if (!rows) return;

  const toEnrich = FORCE ? rows : rows.filter(r => !r.nutrition_source);
  console.log(`Enriching ${toEnrich.length} of ${rows.length} ingredients…\n`);

  let ifct = 0, usda = 0, local = 0, missed = 0;

  for (const row of toEnrich) {
    const category = (row.category as string) ?? '';
    const names = [row.name_en, ...(Array.isArray(row.synonyms) ? row.synonyms.slice(0, 2) : [])];

    // ── Step 1 + 2 + 3: IFCT lookup (manual → skip → category fuzzy) ────────
    let ifctMatch: IFCTRow | null = null;
    for (const name of names) {
      ifctMatch = searchIFCT(ifctRows, name, category);
      if (ifctMatch) break;
    }

    if (ifctMatch) {
      const data = ifctToNutrition(ifctMatch);
      const { error: e } = await supabase.from('ingredients').update(data).eq('id', row.id);
      if (e) console.error(`  ✗ ${row.name_en}:`, e.message);
      else { console.log(`  🌿 ${row.name_en} → IFCT: ${ifctMatch.name} (${(data.kcal_per_100g ?? 0).toFixed(0)} kcal)`); ifct++; }
      continue;
    }

    // ── Step 4: USDA (manual FDC ID → stored ID → API search) ───────────────
    // Check manual FDC map first (for ingredients with known IDs)
    let fdcId: number | null =
      USDA_MANUAL_FDC[row.name_en.toLowerCase()] ??
      row.usda_fdc_id ??
      null;

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
        await new Promise(r => setTimeout(r, 260));
        continue;
      }
    }

    // ── Step 3 (local fallback) ───────────────────────────────────────────────
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

    // ── Step 5: Mark as 'none' — never store wrong data ──────────────────────
    const { error: e } = await supabase.from('ingredients')
      .update({ nutrition_source: 'none' as unknown as string, nutrition_updated_at: new Date().toISOString() })
      .eq('id', row.id);
    if (!e) console.log(`  ⚠️  ${row.name_en} — flagged as 'none' (no match found)`);
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
