// lib/ingredient-resolver.ts
//
// ── Order of operations per segment ────────────────────────────────────────
//   1. strip note phrases / parentheticals   ("for garnish", "to taste")
//   2. pull quantity (anywhere)              ("200g", "1/2", "2-3")
//   3. pull an explicit MEASUREMENT unit     (g, mL, tsp, cup, pinch, dash…)
//   4. strip "of" connector                  ("dash of coconut oil" → "coconut oil")
//   5. extract SIZE modifier                 (small/medium/large/big)
//   6. resolve the ingredient NAME           (longest name/synonym match)
//   7. read LEFTOVER words: a count unit if known (stick, can…), else a note
//   8. final unit = explicit measure > leftover count unit > default_unit
//   9. unit normalisation: l→L, ml→mL always
//  10. display: hide the unit when it is in SUPPRESSED_UNITS or qty is absent

export type IngredientRecord = {
  id?: string;
  name_en: string;
  name_de?: string;
  synonyms: string[];
  category?: string;
  default_unit?: string;
};

export type ParsedEntry = {
  raw: string;
  quantity: string | null;
  unit: string | null;
  unitSource: "explicit" | "count" | "default" | null;
  ingredient: string;
  nameDe: string | null;
  category: string | null;
  size: string | null;        // small / medium / large / big extracted from text
  note: string;
  garnish: boolean;
  optional: boolean;
  approximate: boolean;
  match: "exact" | "fuzzy" | "none";
  suggestions: string[];
  libraryId: string | null;
};

// ── Measurement units — extracted early, never part of an ingredient name ──
// Canonical values: mL and L (always — we normalise on the way out too).
const MEASURE_UNITS: Record<string, string> = {
  ml: "mL", milliliter: "mL", milliliters: "mL", millilitre: "mL", millilitres: "mL",
  l: "L",  liter: "L",  liters: "L",  litre: "L",  litres: "L",
  tsp: "tsp", teaspoon: "tsp", teaspoons: "tsp",
  tbsp: "tbsp", tablespoon: "tbsp", tablespoons: "tbsp",
  cup: "cup", cups: "cup",
  "fl oz": "fl oz", floz: "fl oz",
  g: "g", gm: "g", gram: "g", grams: "g",
  kg: "kg", kilogram: "kg", kilograms: "kg",
  oz: "oz", ounce: "oz", ounces: "oz",
  lb: "lb", lbs: "lb", pound: "lb", pounds: "lb",
  // Pinch & dash are unambiguous — never ingredient names, safe to extract early
  pinch: "pinch", pinches: "pinch",
  dash: "dash", dashes: "dash",
};

// ── Count / piece units — recognised ONLY from leftover words after name ────
// resolution, so "cinnamon stick" stays whole but "butter stick" yields unit=stick.
const COUNT_UNITS: Record<string, string> = {
  whole: "whole", wholes: "whole",
  clove: "clove", cloves: "clove",   // "1 garlic clove" → clove leftover → suppressed → "1 garlic"
  stick: "stick", sticks: "stick",
  sprig: "sprig", sprigs: "sprig",
  leaf: "leaf",   leaves: "leaf",
  sheet: "sheet", sheets: "sheet",
  can: "can",     cans: "can",
  packet: "packet", packets: "packet",
  sachet: "sachet", sachets: "sachet",
  head: "head",   heads: "head",
  stalk: "stalk", stalks: "stalk",
  bunch: "bunch", bunches: "bunch",
  handful: "handful", handfuls: "handful",
  slice: "slice", slices: "slice",
  piece: "piece", pieces: "piece",
  inch: "inch",   inches: "inch",
};

// ── Units hidden in display (shown as bare number) ──────────────────────────
// "whole" → "2 onion" not "2 whole onion"
// "clove" → "1 garlic" not "1 clove garlic"
export const SUPPRESSED_UNITS = new Set<string>(["whole", "clove"]);

// ── Size modifiers — extracted before name resolution ───────────────────────
const SIZE_WORDS = new Set(["small", "medium", "large", "big", "tiny", "huge", "xl"]);

// ── Note/flag phrases ────────────────────────────────────────────────────────
const GARNISH_PHRASES    = ["for garnish", "to garnish", "as garnish", "garnish"];
const OPTIONAL_PHRASES   = ["optional", "if available", "if needed", "if required"];
const APPROXIMATE_PHRASES= ["approx", "approximate", "approximately", "about", "around"];
const NOTE_PHRASES = [
  ...GARNISH_PHRASES,
  ...OPTIONAL_PHRASES,
  ...APPROXIMATE_PHRASES,
  "to taste", "to serve", "for serving", "as required", "as needed",
  "finely chopped", "roughly chopped", "thinly sliced", "coarsely ground",
  "required",
];

// ── Size → default weight in grams (for pantry conversion) ──────────────────
// Used by weight estimation when an ingredient is measured by count + size.
export const SIZE_WEIGHTS: Record<string, Record<string, number>> = {
  onion:      { small: 70,  medium: 110, large: 150, big: 150 },
  tomato:     { small: 80,  medium: 120, large: 160, big: 160 },
  egg:        { small: 45,  medium: 55,  large: 65,  xl: 75,  huge: 75 },
  potato:     { small: 100, medium: 170, large: 250, big: 250 },
  "sweet potato": { small: 100, medium: 180, large: 280 },
  carrot:     { small: 50,  medium: 80,  large: 120 },
  lemon:      { small: 80,  medium: 100, large: 130 },
  lime:       { small: 50,  medium: 67,  large: 90  },
  apple:      { small: 130, medium: 180, large: 240 },
  banana:     { small: 90,  medium: 120, large: 150 },
  mango:      { small: 200, medium: 320, large: 450 },
  avocado:    { small: 120, medium: 170, large: 220 },
  garlic:     { small: 3,   medium: 5,   large: 7   },
  cucumber:   { small: 200, medium: 300, large: 400 },
  eggplant:   { small: 200, medium: 350, large: 500 },
  zucchini:   { small: 150, medium: 200, large: 300 },
  "bell pepper": { small: 110, medium: 160, large: 220 },
};

const norm     = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Normalise units to canonical display form (mL, L). */
function normaliseUnit(u: string): string {
  if (u === "ml") return "mL";
  if (u === "l")  return "L";
  return u;
}

export type ResolverIndex = { alias: Map<string, IngredientRecord>; records: IngredientRecord[] };

export function buildIndex(records: IngredientRecord[]): ResolverIndex {
  const alias = new Map<string, IngredientRecord>();
  const add = (key: string, rec: IngredientRecord) => {
    const k = norm(key);
    if (!k) return;
    if (!alias.has(k)) alias.set(k, rec);
    const alt = k.endsWith("s") ? k.slice(0, -1) : k + "s";
    if (alt && !alias.has(alt)) alias.set(alt, rec);
  };
  for (const rec of records) {
    add(rec.name_en, rec);
    if (rec.name_de) add(rec.name_de, rec);
    for (const s of rec.synonyms ?? []) add(s, rec);
  }
  return { alias, records };
}

function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[n];
}

function suggest(tokens: string[], index: ResolverIndex): string[] {
  const scored: { name: string; score: number }[] = [];
  const seen = new Set<string>();
  for (const rec of index.records) {
    if (seen.has(rec.name_en)) continue;
    const hay = norm([rec.name_en, ...(rec.synonyms ?? [])].join(" "));
    let score = 0;
    for (const t of tokens) {
      if (hay.includes(t)) score += 2;
      else if (hay.split(" ").some((w) => w.startsWith(t.slice(0, Math.max(3, t.length - 1))))) score += 1;
    }
    if (score > 0) { scored.push({ name: rec.name_en, score }); seen.add(rec.name_en); }
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 4).map((s) => s.name);
}

type NameMatch = {
  rec: IngredientRecord | null;
  leftover: string[];
  match: "exact" | "fuzzy" | "none";
  suggestions: string[];
};

function resolveName(nameText: string, index: ResolverIndex): NameMatch {
  const tokens = norm(nameText).split(" ").filter(Boolean);
  if (!tokens.length) return { rec: null, leftover: [], match: "none", suggestions: [] };

  for (let size = tokens.length; size >= 1; size--) {
    for (let start = 0; start + size <= tokens.length; start++) {
      const slice = tokens.slice(start, start + size).join(" ");
      const rec = index.alias.get(slice);
      if (rec) {
        const leftover = [...tokens.slice(0, start), ...tokens.slice(start + size)];
        return { rec, leftover, match: "exact", suggestions: [] };
      }
    }
  }

  const whole = tokens.join(" ");
  if (whole.length <= 24) {
    let best: { rec: IngredientRecord; dist: number } | null = null;
    for (const [a, rec] of index.alias) {
      if (Math.abs(a.length - whole.length) > 3) continue;
      const d = lev(whole, a);
      if (!best || d < best.dist) best = { rec, dist: d };
    }
    if (best && best.dist <= Math.max(1, Math.floor(whole.length * 0.2))) {
      return { rec: best.rec, leftover: [], match: "fuzzy", suggestions: [] };
    }
  }

  return { rec: null, leftover: [], match: "none", suggestions: suggest(tokens, index) };
}

function extractQtyAndUnit(text: string): { qty: string | null; unit: string | null; rest: string } {
  let qty: string | null = null;
  let unit: string | null = null;
  let s = text
    .replace(/¼/g, "1/4").replace(/½/g, "1/2").replace(/¾/g, "3/4")
    .replace(/⅓/g, "1/3").replace(/⅔/g, "2/3");

  // Number optionally glued to a unit abbreviation (e.g. "200g", "1.5kg")
  const qre = /(\d+(?:[.,]\d+)?(?:\/\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?)([a-zA-Z]*)/;
  const m = s.match(qre);
  if (m) {
    qty = m[1].replace(/\s/g, "");
    const glued = m[2].toLowerCase();
    if (glued && MEASURE_UNITS[glued]) {
      unit = MEASURE_UNITS[glued];
      s = s.replace(m[0], " ");
    } else {
      s = s.replace(m[1], " ");
    }
  }
  // Mixed fractions: "1 1/2"
  if (!qty) {
    const mixed = s.match(/(\d+)\s+(\d+)\/(\d+)/);
    if (mixed) {
      qty = String(Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]));
      s = s.replace(mixed[0], " ");
    }
  }
  // Stand-alone unit word
  if (!unit) {
    const toks = s.trim().split(/\s+/).filter(Boolean);
    for (let i = 0; i < toks.length; i++) {
      const u = MEASURE_UNITS[toks[i].toLowerCase()];
      if (u) { unit = u; toks.splice(i, 1); s = toks.join(" "); break; }
    }
  }
  return { qty, unit, rest: s.trim() };
}

export function parseSegment(text: string, index: ResolverIndex): ParsedEntry {
  const raw = text.trim();
  let work = " " + raw + " ";
  const notes: string[] = [];
  let garnish = false, optional = false, approximate = false;

  // 1. Strip parentheticals and note phrases
  const pm = work.match(/\(([^)]*)\)/);
  if (pm) { notes.push(pm[1].trim()); work = work.replace(pm[0], " "); }
  work = work.replace(/[?!]+/g, " ");
  for (const p of NOTE_PHRASES) {
    const re = new RegExp("(?:,\\s*)?\\b" + escapeRe(p) + "\\b", "i");
    if (re.test(work)) {
      if (GARNISH_PHRASES.some((g) => p.startsWith(g))) garnish = true;
      if (OPTIONAL_PHRASES.includes(p)) optional = true;
      if (APPROXIMATE_PHRASES.includes(p)) approximate = true;
      notes.push(p);
      work = work.replace(re, " ");
    }
  }

  // 2–3. Quantity + explicit measurement unit
  const { qty, unit: explicitUnit, rest: afterQty } = extractQtyAndUnit(work.trim());

  // 4. Strip "of" connector (e.g. "dash of coconut oil" → "coconut oil")
  const afterOf = afterQty.replace(/^\s*of\b\s*/i, "").trim();

  // 5. Extract size modifier before name resolution
  let sizeFound: string | null = null;
  const sizeFiltered = afterOf.split(/\s+/).filter((tok) => {
    const lc = tok.toLowerCase();
    if (SIZE_WORDS.has(lc)) { sizeFound = lc; return false; }
    return true;
  }).join(" ").trim();

  // 6. Resolve ingredient name (longest-match wins)
  const r = resolveName(sizeFiltered, index);

  // 7. Leftover → count unit or additional note
  let unit = explicitUnit;
  let unitSource: ParsedEntry["unitSource"] = explicitUnit ? "explicit" : null;
  const leftover = r.leftover.slice();
  if (!unit) {
    for (let i = 0; i < leftover.length; i++) {
      const cu = COUNT_UNITS[leftover[i].toLowerCase()];
      if (cu) { unit = cu; unitSource = "count"; leftover.splice(i, 1); break; }
    }
  }
  if (leftover.length) notes.push(leftover.join(" "));

  // 8. Final unit fallback
  const rec = r.rec;
  if (!unit && rec?.default_unit) { unit = rec.default_unit; unitSource = "default"; }

  // 9. Normalise l→L, ml→mL
  if (unit) unit = normaliseUnit(unit);

  return {
    raw,
    quantity: qty,
    unit: unit ?? null,
    unitSource: unit ? unitSource : null,
    ingredient: rec ? rec.name_en : sizeFiltered.trim() || afterOf.trim(),
    nameDe: rec?.name_de ?? null,
    category: rec?.category ?? null,
    size: sizeFound,
    note: notes.filter(Boolean).join(", "),
    garnish,
    optional,
    approximate,
    match: r.match,
    suggestions: r.suggestions,
    libraryId: rec?.id ?? null,
  };
}

export function parseLine(line: string, index: ResolverIndex): ParsedEntry[] {
  return line
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => parseSegment(s, index));
}

/** Format amount for display (unit hidden when suppressed or qty absent). */
export function formatAmount(entry: ParsedEntry): string {
  if (entry.quantity == null) return "";
  const showUnit = entry.unit && !SUPPRESSED_UNITS.has(entry.unit);
  return showUnit ? `${entry.quantity} ${entry.unit}` : entry.quantity;
}
