// lib/ingredient-resolver.ts
//
// Turns a free-text line ("jeera 1 tsp, 8 green chilli; butter 1 stick, 1 whole onion")
// into structured entries resolved against the ingredients table.
//
// ── The one rule that governs everything ───────────────────────────────────
// The DICTIONARY decides what is a name and what is a stray word, by always
// claiming the LONGEST entry that exists. "cinnamon stick" and "whole moong"
// are claimed whole because they are rows; "butter stick" and "whole onion"
// are not rows, so "stick"/"whole" are left over and become units.
//
// ── Order of operations per segment ────────────────────────────────────────
//   1. strip note phrases / parentheticals   ("for garnish", "to taste")
//   2. pull quantity (anywhere)              ("200g", "1/2", "2-3", "rice 1 cup")
//   3. pull an explicit MEASUREMENT unit     (g, ml, tsp, cup…) — safe early
//   4. resolve the ingredient NAME           (longest name/synonym match)
//   5. read LEFTOVER words: a count unit if known (stick, can…), else a note
//   6. final unit = explicit measure > leftover count unit > default_unit
//   7. display: hide the unit when it is in SUPPRESSED_UNITS or qty is absent

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
  note: string;
  garnish: boolean;
  optional: boolean;
  approximate: boolean;
  match: "exact" | "fuzzy" | "none";
  suggestions: string[];
  libraryId: string | null;
};

// True measurement units — never part of an ingredient name, parsed early.
const MEASURE_UNITS: Record<string, string> = {
  ml: "ml", milliliter: "ml", milliliters: "ml", millilitre: "ml", millilitres: "ml",
  l: "l", liter: "l", liters: "l", litre: "l", litres: "l",
  tsp: "tsp", teaspoon: "tsp", teaspoons: "tsp",
  tbsp: "tbsp", tablespoon: "tbsp", tablespoons: "tbsp",
  cup: "cup", cups: "cup",
  "fl oz": "fl oz", floz: "fl oz",
  g: "g", gm: "g", gram: "g", grams: "g",
  kg: "kg", kilogram: "kg", kilograms: "kg",
  oz: "oz", ounce: "oz", ounces: "oz",
  lb: "lb", lbs: "lb", pound: "lb", pounds: "lb",
};

// Count / piece units — recognised ONLY from words left over AFTER name resolution,
// so they can never cannibalise a name like "cinnamon stick" or "whole moong".
const COUNT_UNITS: Record<string, string> = {
  whole: "whole", wholes: "whole",
  stick: "stick", sticks: "stick",
  sprig: "sprig", sprigs: "sprig",
  leaf: "leaf", leaves: "leaf",
  sheet: "sheet", sheets: "sheet",
  can: "can", cans: "can",
  packet: "packet", packets: "packet",
  sachet: "sachet", sachets: "sachet",
  pinch: "pinch", pinches: "pinch",
  dash: "dash", dashes: "dash",
  head: "head", heads: "head",
  stalk: "stalk", stalks: "stalk",
  bunch: "bunch", bunches: "bunch",
  handful: "handful", handfuls: "handful",
  slice: "slice", slices: "slice",
  piece: "piece", pieces: "piece",
  inch: "inch", inches: "inch",
};

// Units that display as a bare number in view mode: "2 onion", not "2 whole onion".
export const SUPPRESSED_UNITS = new Set<string>(["whole"]);

// Phrases that become notes (or flags) rather than ingredient text.
const GARNISH_PHRASES = ["for garnish", "to garnish", "as garnish", "garnish"];
const OPTIONAL_PHRASES = ["optional", "if available", "if needed", "if required"];
const APPROXIMATE_PHRASES = ["approx", "approximate", "approximately", "about", "around"];
const NOTE_PHRASES = [
  ...GARNISH_PHRASES,
  ...OPTIONAL_PHRASES,
  ...APPROXIMATE_PHRASES,
  "to taste", "to serve", "for serving", "as required", "as needed",
  "finely chopped", "roughly chopped", "thinly sliced", "coarsely ground",
  "required",
];

const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export type ResolverIndex = { alias: Map<string, IngredientRecord>; records: IngredientRecord[] };

/** Build once from rows loaded from Supabase. */
export function buildIndex(records: IngredientRecord[]): ResolverIndex {
  const alias = new Map<string, IngredientRecord>();
  const add = (key: string, rec: IngredientRecord) => {
    const k = norm(key);
    if (!k) return;
    if (!alias.has(k)) alias.set(k, rec);
    // Light singular/plural fallback
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
  if (!m) return n;
  if (!n) return m;
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

  // Longest contiguous window that is a known alias wins.
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

  // Typo tolerance: closest alias by edit distance, only for short strings.
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
    .replace(/¼/g, "1/4")
    .replace(/½/g, "1/2")
    .replace(/¾/g, "3/4")
    .replace(/⅓/g, "1/3")
    .replace(/⅔/g, "2/3");

  // Match number (possibly with fraction or range) optionally glued to a unit letter
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

  // Also handle mixed fractions like "1 1/2"
  if (!qty) {
    const mixed = s.match(/(\d+)\s+(\d+)\/(\d+)/);
    if (mixed) {
      qty = String(Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]));
      s = s.replace(mixed[0], " ");
    }
  }

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
  let garnish = false;
  let optional = false;
  let approximate = false;

  // 1. strip parenthetical notes
  const pm = work.match(/\(([^)]*)\)/);
  if (pm) { notes.push(pm[1].trim()); work = work.replace(pm[0], " "); }
  work = work.replace(/[?!]+/g, " ");

  // strip note phrases, detecting flags
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

  // 2-3. quantity + explicit measurement unit
  const { qty, unit: explicitUnit, rest } = extractQtyAndUnit(work.trim());

  // 4. resolve the ingredient name
  const r = resolveName(rest, index);

  // 5. leftover words → count unit or additional note
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

  // 6. final unit fallback to default_unit
  const rec = r.rec;
  if (!unit && rec?.default_unit) { unit = rec.default_unit; unitSource = "default"; }

  return {
    raw,
    quantity: qty,
    unit: unit ?? null,
    unitSource: unit ? unitSource : null,
    ingredient: rec ? rec.name_en : rest.trim(),
    nameDe: rec?.name_de ?? null,
    category: rec?.category ?? null,
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

/** Display helper: "1", "2 stick", "1 cup" — unit hidden when suppressed or qty is absent. */
export function formatAmount(entry: ParsedEntry): string {
  if (entry.quantity == null) return "";
  const showUnit = entry.unit && !SUPPRESSED_UNITS.has(entry.unit);
  return showUnit ? `${entry.quantity} ${entry.unit}` : entry.quantity;
}
