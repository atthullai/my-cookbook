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

// Canonical name aliases: our library name_en → exact IFCT food name.
// Use ONLY verified matches — wrong matches give worse data than "not found".
// Ingredients not listed here fall through to fuzzy search, then USDA.
const IFCT_ALIASES: Record<string, string> = {
  // ── Oils & Fats ────────────────────────────────────────────────────────────
  'sesame oil':           'gingelly oil',           // T004
  'sesame seed oil':      'gingelly oil',           // T004
  'gingelly oil':         'gingelly oil',           // T004
  'til oil':              'gingelly oil',           // T004
  'coconut oil':          'coconut oil',            // T001
  'groundnut oil':        'groundnut oil',          // T005
  'peanut oil':           'groundnut oil',          // T005
  'mustard oil':          'mustard oil',            // T006
  'rice bran oil':        'rice bran oil',          // T008
  'sunflower oil':        'sunflower oil',          // T012
  'corn oil':             'corn oil',               // T002
  'safflower oil':        'safflower oil',          // T009
  'soyabean oil':         'soyabean oil',           // T011
  'palm oil':             'palm oil',               // T007
  'ghee':                 'ghee',                   // T013
  // walnut oil, olive oil, rapeseed oil, avocado oil, flaxseed oil → USDA

  // ── Whole Spices ───────────────────────────────────────────────────────────
  'mustard seeds':        'mustard seeds',          // H013
  'rai':                  'mustard seeds',          // H013
  'kadugu':               'mustard seeds',          // H013
  'cumin seeds':          'cumin seeds',            // G025
  'jeera':                'cumin seeds',            // G025
  'jeeragam':             'cumin seeds',            // G025
  'fenugreek seeds':      'fenugreek seeds',        // G026
  'methi seeds':          'fenugreek seeds',        // G026
  'vendhayam':            'fenugreek seeds',        // G026
  'coriander seeds':      'coriander seeds',        // G024
  'dhania':               'coriander seeds',        // G024
  'peppercorns':          'pepper, black',          // G031
  'black peppercorns':    'pepper, black',          // G031
  'cardamom':             'cardamom, green',        // G020
  'green cardamom':       'cardamom, green',        // G020
  'elaichi':              'cardamom, green',        // G020
  'black cardamom':       'cardamom, black',        // G021
  'badi elaichi':         'cardamom, black',        // G021
  'cloves':               'cloves',                 // G023
  'laung':                'cloves',                 // G023
  'nutmeg':               'nutmeg',                 // G028
  'jaiphal':              'nutmeg',                 // G028
  'mace':                 'mace',                   // G027
  'ajwain':               'omum',                   // G029 (omum = ajwain)
  'carom seeds':          'omum',                   // G029
  'omam':                 'omum',                   // G029
  'poppy seeds':          'poppy seeds',            // G032
  'khus khus':            'poppy seeds',            // G032
  // fennel seeds, star anise, cinnamon, bay leaf → USDA (not in IFCT)

  // ── Ground Spices ──────────────────────────────────────────────────────────
  'turmeric powder':      'turmeric powder',        // G033
  'turmeric':             'turmeric powder',        // G033
  'haldi':                'turmeric powder',        // G033
  'manjal':               'turmeric powder',        // G033
  'red chilli powder':    'chillies, red',          // G022
  'lal mirch':            'chillies, red',          // G022
  'dried red chillies':   'chillies, red',          // G022
  'dry red chillies':     'chillies, red',          // G022
  'asafoetida':           'asafoetida',             // G019
  'hing':                 'asafoetida',             // G019
  'perungayam':           'asafoetida',             // G019
  // garam masala, sambar powder, rasam powder → USDA (blends, not in IFCT)
  // coriander powder, cumin powder → USDA (IFCT only has whole seeds)

  // ── Herbs ──────────────────────────────────────────────────────────────────
  'curry leaves':         'curry leaves',           // G010
  'karivepilai':          'curry leaves',           // G010
  'kadi patta':           'curry leaves',           // G010
  'coriander leaves':     'coriander leaves',       // G009
  'cilantro':             'coriander leaves',       // G009
  'mint leaves':          'mint leaves',            // G016
  'pudina':               'mint leaves',            // G016
  'fenugreek leaves':     'fenugreek leaves',       // C020
  'methi leaves':         'fenugreek leaves',       // C020
  'dried fenugreek leaves': 'fenugreek leaves',     // C020
  'kasuri methi':         'fenugreek leaves',       // C020
  'kasoori methi':        'fenugreek leaves',       // C020
  'parsley':              'parsley',                // C028
  'drumstick leaves':     'drumstick leaves',       // C019
  // basil, rosemary, thyme → USDA

  // ── Dals & Legumes ─────────────────────────────────────────────────────────
  'toor dal':             'red gram, dal',          // B021
  'arhar dal':            'red gram, dal',          // B021
  'tuvar dal':            'red gram, dal',          // B021
  'pigeon peas':          'red gram, dal',          // B021
  'urad dal':             'black gram, dal',        // B003
  'ulutham paruppu':      'black gram, dal',        // B003
  'chana dal':            'bengal gram, dal',       // B001
  'kadalai paruppu':      'bengal gram, dal',       // B001
  'moong dal':            'green gram, dal',        // B010
  'paasi paruppu':        'green gram, dal',        // B010
  'mung beans':           'green gram, whole',      // B011
  'green gram':           'green gram, whole',      // B011
  'masoor dal':           'lentil dal',             // B013
  'red lentils':          'lentil dal',             // B013
  'rajma':                'rajmah, red',            // B020
  'kidney beans':         'rajmah, red',            // B020
  'black eyed peas':      'cowpea, white',          // B006
  'lobia':                'cowpea, white',          // B006
  'chickpeas':            'bengal gram, whole',     // B002
  'kabuli chana':         'bengal gram, whole',     // B002
  'horse gram':           'horse gram, whole',      // B012
  'kollu':                'horse gram, whole',      // B012
  'soya bean':            'soya bean, white',       // B025
  'green peas':           'peas, dry',              // B017 (closest; fresh = D061)
  'dry peas':             'peas, dry',              // B017
  'moth bean':            'moth bean',              // B016

  // ── Rice & Grains ──────────────────────────────────────────────────────────
  'basmati rice':         'rice, raw, milled',      // A015
  'rice':                 'rice, raw, milled',      // A015
  'idli rice':            'rice, raw, milled',      // A015
  'parboiled rice':       'rice, parboiled, milled',// A014
  'brown rice':           'rice, raw, brown',       // A013
  'poha':                 'rice flakes',            // A011
  'aval':                 'rice flakes',            // A011
  'puffed rice':          'rice puffed',            // A012
  'wheat flour':          'wheat flour, atta',      // A019
  'atta':                 'wheat flour, atta',      // A019
  'whole wheat flour':    'wheat flour, atta',      // A019
  'all-purpose flour':    'wheat flour, refined',   // A018
  'maida':                'wheat flour, refined',   // A018
  'refined flour':        'wheat flour, refined',   // A018
  'semolina':             'wheat, semolina',        // A022
  'rava':                 'wheat, semolina',        // A022
  'sooji':                'wheat, semolina',        // A022
  'suji':                 'wheat, semolina',        // A022
  'ragi':                 'ragi',                   // A010
  'finger millet':        'ragi',                   // A010
  'bajra':                'bajra',                  // A003
  'pearl millet':         'bajra',                  // A003
  'jowar':                'jowar',                  // A005
  'sorghum':              'jowar',                  // A005
  'quinoa':               'quinoa',                 // A009
  'amaranth':             'amaranth seed, pale brown', // A002
  'vermicelli':           'wheat, vermicelli',      // A023
  // besan → USDA (IFCT has chana dal but not besan flour specifically)
  // oats → USDA

  // ── Vegetables ─────────────────────────────────────────────────────────────
  'onion':                'onion, big',             // G017
  'big onion':            'onion, big',             // G017
  'small onion':          'onion, small',           // G018
  'shallots':             'onion, small',           // G018
  'spring onion':         'onion, stalk',           // D058
  'tomato':               'tomato, ripe, local',    // D076
  'ripe tomato':          'tomato, ripe, hybrid',   // D075
  'green tomato':         'tomato, green',          // D074
  'potato':               'potato, brown skin, big',// F006
  'brinjal':              'brinjal - all varieties',// D031
  'eggplant':             'brinjal - all varieties',// D031
  'aubergine':            'brinjal - all varieties',// D031
  'capsicum':             'capsicum, green',        // D033
  'green capsicum':       'capsicum, green',        // D033
  'red capsicum':         'capsicum, red',          // D034
  'yellow capsicum':      'capsicum, yellow',       // D035
  'bell pepper':          'capsicum, green',        // D033
  'carrot':               'carrot, orange',         // F002
  'cauliflower':          'cauliflower',            // D036
  'cabbage':              'cabbage, green',         // C015
  'spinach':              'spinach',                // C033
  'palak':                'spinach',                // C033
  'drumstick':            'drumstick',              // D046
  'moringa':              'drumstick',              // D046
  'murungakkai':          'drumstick',              // D046
  'ladies finger':        'ladies finger',          // D056
  'okra':                 'ladies finger',          // D056
  'bhindi':               'ladies finger',          // D056
  'bitter gourd':         'bitter gourd, jagged, teeth ridges, elongate', // D004
  'karela':               'bitter gourd, jagged, teeth ridges, elongate', // D004
  'bottle gourd':         'bottle gourd, elongate, pale green', // D007
  'lauki':                'bottle gourd, elongate, pale green', // D007
  'dudhi':                'bottle gourd, elongate, pale green', // D007
  'ridge gourd':          'ridge gourd',            // D068
  'turai':                'ridge gourd',            // D068
  'snake gourd':          'snake gourd, long, pale green', // D070
  'ash gourd':            'ash gourd',              // D001
  'pumpkin':              'pumpkin, orange, round', // D066
  'raw banana':           'plantain, green',        // D063
  'green banana':         'plantain, green',        // D063
  'raw mango':            'mango, green, raw',      // D057
  'raw papaya':           'papaya, raw',            // D059
  'colocasia':            'colocasia',              // F004
  'arbi':                 'colocasia',              // F004
  'taro':                 'colocasia',              // F004
  'sweet potato':         'sweet potato, brown skin', // F013
  'shakarkandi':          'sweet potato, brown skin', // F013
  'tapioca':              'tapioca',                // F015
  'cassava':              'tapioca',                // F015
  'yam':                  'yam, elephant',          // F017
  'elephant yam':         'yam, elephant',          // F017
  'suran':                'yam, elephant',          // F017
  'beetroot':             'beet root',              // F001
  'radish':               'radish, elongate, white skin', // F010
  'mooli':                'radish, elongate, white skin', // F010
  'peas':                 'peas, dry',              // B017
  'french beans':         'french beans, country',  // D049
  'broad beans':          'broad beans',            // D032
  'cluster beans':        'cluster beans',          // D039
  'gavar':                'cluster beans',          // D039
  'green chilli':         'chillies, green - all varieties', // G008
  'hari mirch':           'chillies, green - all varieties', // G008
  'ginger':               'ginger, fresh',          // G014
  'adrak':                'ginger, fresh',          // G014
  'garlic':               'garlic, big clove',      // G011
  'lahsun':               'garlic, big clove',      // G011
  'jackfruit':            'jack fruit, raw',        // D051
  'bamboo shoot':         'bamboo shoot, tender',   // D002

  // ── Fruits ─────────────────────────────────────────────────────────────────
  'lemon':                'lemon, juice',           // E033
  'lime':                 'lime, sweet, pulp',      // E034
  'mango':                'mango, ripe, totapari',  // E042 (generic ripe mango)
  'ripe mango':           'mango, ripe, totapari',  // E042
  'banana':               'banana, ripe, robusta',  // E012 (most common variety)
  'apple':                'apple, big',             // E001
  'orange':               'orange, pulp',           // E047
  'pomegranate':          'pomegranate, maroon seeds', // E055
  'guava':                'guava, white flesh',     // E028
  'papaya':               'papaya, ripe',           // E049
  'watermelon':           'water melon, dark green (sugar baby)', // E065
  'grapes':               'grapes, seeded, round, black', // E022
  'pineapple':            'pineapple',              // E053
  'coconut':              'coconut, kernel, fresh', // H007
  'dates':                'dates, dry, dark brown', // E018
  'tamarind':             'tamarind, pulp',         // E064
  'amla':                 'goosberry',              // E021 (Indian gooseberry)
  'indian gooseberry':    'goosberry',              // E021
  'custard apple':        'custard apple',          // E016
  'sapota':               'sapota',                 // E060
  'chikoo':               'sapota',                 // E060
  'jamun':                'jambu fruit, ripe',      // E031

  // ── Nuts & Seeds ───────────────────────────────────────────────────────────
  'peanuts':              'ground nut',             // H012
  'groundnuts':           'ground nut',             // H012
  'roasted peanuts':      'ground nut',             // H012 (closest available)
  'moongphali':           'ground nut',             // H012
  'cashew':               'cashew nut',             // H005
  'kaju':                 'cashew nut',             // H005
  'almond':               'almond',                 // H001
  'badam':                'almond',                 // H001
  'walnut':               'walnut',                 // H021
  'akhrot':               'walnut',                 // H021
  'pistachio':            'pistachio nuts',         // H018
  'pista':                'pistachio nuts',         // H018
  'sesame seeds':         'gingelly seeds, white',  // H011
  'white sesame':         'gingelly seeds, white',  // H011
  'til':                  'gingelly seeds, white',  // H011
  'ellu':                 'gingelly seeds, white',  // H011
  'black sesame seeds':   'gingelly seeds, black',  // H009
  'kola til':             'gingelly seeds, black',  // H009
  'sunflower seeds':      'sunflower seeds',        // H020
  'coconut dry':          'coconut, kernal, dry',   // H006
  'desiccated coconut':   'coconut, kernal, dry',   // H006
  'linseeds':             'linseeds',               // H014
  'flaxseeds':            'linseeds',               // H014

  // ── Dairy ──────────────────────────────────────────────────────────────────
  'milk':                 'milk, whole, cow',       // L002
  'cow milk':             'milk, whole, cow',       // L002
  'buffalo milk':         'milk, whole, buffalo',   // L001
  'paneer':               'paneer',                 // L003
  'khoa':                 'khoa',                   // L004
  'mawa':                 'khoa',                   // L004
  // yogurt, cream, cheese, butter → USDA

  // ── Eggs & Meat ────────────────────────────────────────────────────────────
  'egg':                  'egg, poultry, whole, raw',   // M001
  'chicken':              'chicken, poultry, breast, skinless', // N003
  'chicken breast':       'chicken, poultry, breast, skinless', // N003
  'chicken thigh':        'chicken, poultry, thigh, skinless',  // N002
  'chicken leg':          'chicken, poultry, leg, skinless',    // N001
  'mutton':               'goat, shoulder, meat',   // O001
  'goat meat':            'goat, shoulder, meat',   // O001
  'lamb':                 'goat, shoulder, meat',   // O001 (closest)
  'beef':                 'beef, shoulder',         // O025
  'pork':                 'pork, shoulder',         // O048
  'prawn':                'tiger prawns, brown',    // Q007
  'shrimp':               'tiger prawns, brown',    // Q007
  'fish':                 'mackerel',               // P034 (generic fallback)
  // specific fish use USDA

  // ── Sugars ─────────────────────────────────────────────────────────────────
  'jaggery':              'jaggery, cane',          // I001
  'vellam':               'jaggery, cane',          // I001
  'gur':                  'jaggery, cane',          // I001
  // sugar, honey → USDA (IFCT sugar entry is only sugarcane juice)

  // ── Other ──────────────────────────────────────────────────────────────────
  'coconut water':        'coconut water',          // K002
  'tender coconut water': 'coconut water',          // K002
  // coconut milk → USDA (IFCT only has coconut water K002, not milk)
};

// These go straight to USDA — either not in IFCT, or IFCT fuzzy-matches them
// to something completely wrong (verified by running the script and checking output).
const SKIP_IFCT = new Set([
  // Generic / no IFCT equivalent
  'oil', 'water', 'salt', 'sugar',
  // Oils IFCT stores fat=100 but enerc=0 (no energy measured) → USDA better
  'sesame oil', 'gingelly oil', 'coconut oil', 'groundnut oil', 'mustard oil',
  'rice bran oil', 'sunflower oil', 'corn oil', 'safflower oil', 'soyabean oil',
  'palm oil', 'ghee', 'butter', 'vanaspati',
  'olive oil', 'extra virgin olive oil', 'rapeseed oil', 'flaxseed oil',
  'avocado oil', 'walnut oil', 'grapeseed oil', 'til oil', 'sesame seed oil',
  // Spices not in IFCT — fuzzy hits wrong foods
  'cinnamon stick', 'cinnamon powder', 'cinnamon',
  'bay leaf', 'star anise', 'fennel seeds',
  'saffron',                          // IFCT "kesar" = mango variety, not spice
  'dried kashmiri chilli', 'kashmiri chilli powder',
  'fenugreek powder',                 // → ricebean (wrong)
  'fennel powder',                    // → rohu fish (wrong)
  'curry powder',                     // blend, not in IFCT
  'sambar powder', 'rasam powder', 'garam masala', 'biryani masala',
  'chat masala', 'amchur powder', 'paprika', 'paprika powder',
  'ajwain powder', 'caraway seeds',
  // Herbs fuzzy-matching wrong IFCT entries
  'dill',           // → sapota (wrong)
  'rosemary',       // → amaranth seed (wrong)
  'chives',         // → bottle gourd (wrong)
  'lemongrass',     // → lemon juice (wrong)
  'kaffir lime leaves', // → lime pulp (wrong)
  'basil', 'thyme',
  // Vegetables with wrong fuzzy hits
  'jalapeño',       // → pepper, black (wrong)
  'taro root',      // → palm fruit (wrong)
  'asparagus',      // → kiriyan fish (wrong)
  'leek',           // → bottle gourd (wrong)
  'bean sprouts',   // → rohu fish (wrong)
  'corn', 'cornstarch', // → corn, baby (wrong for starch)
  // Fruits with wrong hits
  'mango',          // IFCT "kesar" is a mango variety — too ambiguous
  'orange',         // → cucumber orange (wrong)
  'watermelon',
  'blueberry',      // → zizyphus (wrong)
  'apple cider vinegar', // → apple (wrong)
  // Dairy / proteins with wrong hits
  'buttermilk', 'condensed milk',
  'parmigiano reggiano', 'cheese', 'cream', 'heavy cream', 'sour cream',
  'yogurt', 'curd', 'cream cheese',
  'butter',
  // Pantry / sauces with wrong hits
  'coconut milk',   // → coconut dry (wrong — different product)
  'tomato paste', 'tomato passata', 'canned tomatoes',
  'tahini',         // → mango ripe (wrong)
  'vegetable stock', 'chicken stock',
  'rose water',     // → jaggery (wrong)
  'apple cider vinegar', 'vinegar', 'soy sauce', 'fish sauce',
  'miso paste', 'thai red curry paste',
  // Processed / baked goods
  'oats', 'breadcrumbs', 'pasta',
  'dark brown sugar', 'powdered sugar',
  'mixed vegetables',
  // Misc
  'soya chunks', 'chironji', 'tofu',
  // kasoori methi has explicit alias → fenugreek leaves (C020) in IFCT_ALIASES
]);

// Simple fuzzy search against IFCT rows
function searchIFCT(ifctRows: IFCTRow[], query: string): IFCTRow | null {
  const q = query.toLowerCase().trim();

  // Skip ingredients that should always go to USDA
  if (SKIP_IFCT.has(q)) return null;

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
