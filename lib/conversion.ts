/**
 * Unit conversion utility — recipe → pantry base units.
 *
 * Tier 1: Exact universal conversions (g, ml, no.)
 * Tier 2: Approximate ingredient-specific (whole items, bunches, etc.)
 * Tier 3: Non-convertible — skip silently on deduction
 */

// ── Tier 1 — exact ────────────────────────────────────────────────────────────

const TIER1: Record<string, { factor: number; to: "g" | "ml" | "whole" }> = {
  tsp:    { factor: 5,      to: "ml"  },
  tbsp:   { factor: 15,     to: "ml"  },
  cup:    { factor: 240,    to: "ml"  },
  "fl oz":{ factor: 29.57,  to: "ml"  },
  oz:     { factor: 28.35,  to: "g"   },
  lb:     { factor: 453.59, to: "g"   },
  kg:     { factor: 1000,   to: "g"   },
  L:      { factor: 1000,   to: "ml"  },
  l:      { factor: 1000,   to: "ml"  },
  g:      { factor: 1,      to: "g"   },
  ml:     { factor: 1,      to: "ml"  },
  mL:     { factor: 1,      to: "ml"  },
  "no.":  { factor: 1,      to: "whole" },
  whole:  { factor: 1,      to: "whole" },
  portion:  { factor: 1,    to: "whole" },
  portions: { factor: 1,    to: "whole" },
};

// ── Tier 2 — approximate ──────────────────────────────────────────────────────

const TIER2: Record<string, { to: "g" | "ml" | "whole"; val: number }> = {
  // Alliums
  "garlic clove":  { to: "g",   val: 5   },
  "garlic cloves": { to: "g",   val: 5   },
  "clove":         { to: "g",   val: 5   },
  "cloves":        { to: "g",   val: 5   },
  "head garlic":   { to: "g",   val: 50  },
  "onion":         { to: "g",   val: 110 },
  "whole onion":   { to: "g",   val: 110 },
  "small onion":   { to: "g",   val: 70  },
  "large onion":   { to: "g",   val: 150 },
  // Produce
  "tomato":        { to: "g",   val: 120 },
  "whole tomato":  { to: "g",   val: 120 },
  "cherry tomato": { to: "g",   val: 15  },
  "potato":        { to: "g",   val: 170 },
  "whole potato":  { to: "g",   val: 170 },
  "carrot":        { to: "g",   val: 80  },
  "whole carrot":  { to: "g",   val: 80  },
  "celery stalk":  { to: "g",   val: 40  },
  "leek":          { to: "g",   val: 100 },
  "cucumber":      { to: "g",   val: 300 },
  "bell pepper":   { to: "g",   val: 160 },
  "pepper":        { to: "g",   val: 160 },
  "chili":         { to: "g",   val: 15  },
  "chilli":        { to: "g",   val: 15  },
  "cabbage":       { to: "g",   val: 900 },
  "head cabbage":  { to: "g",   val: 900 },
  "lettuce":       { to: "g",   val: 300 },
  "broccoli":      { to: "g",   val: 350 },
  "cauliflower":   { to: "g",   val: 600 },
  "mushroom":      { to: "g",   val: 20  },
  "zucchini":      { to: "g",   val: 200 },
  // Fruits
  "lemon":         { to: "g",   val: 100 },
  "lime":          { to: "g",   val: 67  },
  "orange":        { to: "g",   val: 180 },
  "banana":        { to: "g",   val: 120 },
  "apple":         { to: "g",   val: 180 },
  "avocado":       { to: "g",   val: 170 },
  // Eggs & dairy
  "egg":           { to: "whole", val: 1   },
  "whole egg":     { to: "whole", val: 1   },
  "large egg":     { to: "whole", val: 1   },
  "medium egg":    { to: "whole", val: 1   },
  "stick butter":  { to: "g",   val: 113 },
  "stick of butter":{ to: "g",  val: 113 },
  // Herbs
  "bunch":         { to: "g",   val: 25  },
  "handful":       { to: "g",   val: 15  },
  "sprig":         { to: "g",   val: 2   },
  "stalk":         { to: "g",   val: 5   },
  "leaf":          { to: "whole", val: 1   },
  "leaves":        { to: "whole", val: 3   },
  // Portions / partial units (generic fallbacks; per-item unitProfile overrides these)
  "slice":         { to: "g",   val: 30  },  // a bread slice ≈ 30 g
  "slices":        { to: "g",   val: 30  },
  "piece":         { to: "g",   val: 50  },
  "pieces":        { to: "g",   val: 50  },
  "scoop":         { to: "g",   val: 30  },
  // Pantry
  "can":           { to: "whole", val: 1   },
  "tin":           { to: "whole", val: 1   },
  "pinch":         { to: "g",   val: 0.3 },
  "dash":          { to: "ml",  val: 1   },
  // Grains (cup-based for tier2 fallback)
  "flour cup":     { to: "g",   val: 120 },
  "sugar cup":     { to: "g",   val: 200 },
  "rice cup":      { to: "g",   val: 185 },
  "oats cup":      { to: "g",   val: 90  },
  "lentils cup":   { to: "g",   val: 190 },
};

// ── Tier 3 — skip ─────────────────────────────────────────────────────────────

const TIER3 = new Set([
  "to taste", "as needed", "optional", "sheet", "inch",
  "packet", "sachet", "some", "handful optional", "garnish",
]);

// ── Types ─────────────────────────────────────────────────────────────────────

export type ConvertResult = {
  base:     number;
  baseUnit: "g" | "ml" | "whole";
  tier:     1 | 2 | 3;
};

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Convert a recipe ingredient quantity to a pantry base unit.
 *
 * @param qty            – recipe quantity (already scaled for servings)
 * @param unit           – recipe unit string
 * @param ingredientName – ingredient name (used for tier-2 lookup)
 */
export function convertToBase(
  qty: number,
  unit: string,
  ingredientName: string
): ConvertResult {
  const u = (unit ?? "").toLowerCase().trim();
  const name = (ingredientName ?? "").toLowerCase().trim();

  // Tier 3 — skip
  if (TIER3.has(u) || TIER3.has(name)) {
    return { base: 0, baseUnit: "g", tier: 3 };
  }

  // Tier 1 — exact conversion
  if (TIER1[u]) {
    return {
      base:     qty * TIER1[u].factor,
      baseUnit: TIER1[u].to,
      tier:     1,
    };
  }

  // Also try original casing for L vs l
  if (TIER1[unit]) {
    return {
      base:     qty * TIER1[unit].factor,
      baseUnit: TIER1[unit].to,
      tier:     1,
    };
  }

  // Tier 2 — name-based approximate
  const t2key = Object.keys(TIER2).find((k) => name.includes(k) || u.includes(k));
  if (t2key) {
    return {
      base:     qty * TIER2[t2key].val,
      baseUnit: TIER2[t2key].to,
      tier:     2,
    };
  }

  // Fallback — treat as grams tier-1-style
  return { base: qty, baseUnit: "g", tier: 1 };
}

// ── Pantry quantity resolver (partial-unit aware) ─────────────────────────────

/**
 * Resolve a quantity the user typed when logging consumption into a pantry base
 * amount. Honours a per-item `unitProfile` first (e.g. brioche { slice: 30 }),
 * so "2 slices" → 60 g even when the generic 30 g default is wrong, then falls
 * back to the shared {@link convertToBase} engine. Fractions (e.g. ½ onion) are
 * carried by `qty`.
 */
export function resolvePantryQty(
  qty: number,
  unit: string,
  name: string,
  unitProfile?: Partial<Record<string, number>> | null,
): ConvertResult {
  const u = (unit ?? "").toLowerCase().trim().replace(/s$/, ""); // slice/slices → slice
  if (unitProfile && typeof unitProfile[u] === "number") {
    return { base: qty * (unitProfile[u] as number), baseUnit: "g", tier: 2 };
  }
  return convertToBase(qty, unit, name);
}

// ── Gap formatting ────────────────────────────────────────────────────────────

export function formatGap(base: number, unit: "g" | "ml" | "whole"): string {
  if (unit === "whole") return `${Math.ceil(base)}`;
  if (unit === "g")   return base >= 1000 ? `${(base / 1000).toFixed(1)}kg` : `${Math.round(base)}g`;
  if (unit === "ml")  return base >= 1000 ? `${(base / 1000).toFixed(1)}L`  : `${Math.round(base)}ml`;
  return `${base}`;
}
