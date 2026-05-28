/**
 * Nutrition calculation utilities.
 *
 * Strategy:
 * 1. Try USDA FoodData Central (free, requires USDA_API_KEY env var).
 * 2. Fall back to Edamam Nutrition Analysis API (NEXT_PUBLIC_EDAMAM_APP_ID/KEY).
 * 3. If both fail, return { data: null, source: "failed" }.
 *
 * These functions run server-side only (in Route Handlers or Server Actions).
 * The `NEXT_PUBLIC_` Edamam keys are named that way so the client can also
 * call the Edamam API directly from the browser if needed.
 *
 * USDA:   https://fdc.nal.usda.gov
 * Edamam: https://developer.edamam.com
 */

import type { Ingredient, NutritionInfo } from "@/types";

const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";
const EDAMAM_BASE = "https://api.edamam.com/api/nutrition-details";

/** USDA nutrient IDs for the macros we track */
const USDA_IDS = {
  calories: 1008,
  protein: 1003,
  fat: 1004,
  carbs: 1005,
  fiber: 1079,
  sugar: 2000,
  sodium: 1093,
} as const;

// ── USDA response types ────────────────────────────────────────────────────

interface UsdaFoodNutrient {
  nutrientId: number;
  value: number;
}

interface UsdaFood {
  fdcId: number;
  description: string;
  foodNutrients: UsdaFoodNutrient[];
}

interface UsdaSearchResponse {
  foods?: UsdaFood[];
}

// ── Edamam response types ──────────────────────────────────────────────────

interface EdamamNutrient {
  quantity?: number;
}

interface EdamamResponse {
  totalNutrients?: {
    ENERC_KCAL?: EdamamNutrient;
    PROCNT?: EdamamNutrient;
    FAT?: EdamamNutrient;
    CHOCDF?: EdamamNutrient;
    FIBTG?: EdamamNutrient;
    SUGAR?: EdamamNutrient;
    NA?: EdamamNutrient;
  };
  totalWeight?: number;
}

// ── Unit → gram conversion table ──────────────────────────────────────────

const UNIT_TO_GRAMS: Record<string, number> = {
  g: 1, gram: 1, grams: 1, kg: 1000, oz: 28.35, lb: 453.6,
  ml: 1, l: 1000,
  tsp: 4.2, teaspoon: 4.2,
  tbsp: 12.6, tablespoon: 12.6,
  cup: 240, cups: 240,
  "fl oz": 29.6,
  // whole-item counts
  "no.": 100, no: 100, whole: 100, piece: 100, pieces: 100,
  // produce structure
  head: 300,   // e.g. cabbage, lettuce
  clove: 5,    // garlic
  stalk: 30,   // celery, lemongrass
  inch: 5,     // ginger, galangal, cinnamon
  stick: 5,    // cinnamon stick, lemongrass
  // leaves / herbs
  leaf: 0.5, leaves: 0.5,
  sprig: 2,
  // small measures
  sheet: 15,   // lasagne, nori, filo
  dash: 0.6,
  handful: 30, pinch: 0.3,
  // packaged
  can: 400, packet: 100, sachet: 7, bunch: 30,
};

/** Converts ingredient quantity + unit to approximate grams */
function toGrams(qty: number, unit: string): number {
  const u = unit.toLowerCase().trim();
  return qty * (UNIT_TO_GRAMS[u] ?? 100);
}

// ── USDA lookup ────────────────────────────────────────────────────────────

/** Fetches per-100g nutrient data for a single ingredient name from USDA */
async function fetchUsdaNutrients(name: string): Promise<Partial<NutritionInfo> | null> {
  try {
    const key = process.env.USDA_API_KEY ?? "DEMO_KEY";
    const res = await fetch(
      `${USDA_BASE}/foods/search?query=${encodeURIComponent(name)}&pageSize=1&api_key=${key}`,
      // Cache for 24h — USDA nutrient data is stable
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;

    const data: UsdaSearchResponse = await res.json();
    const food = data.foods?.[0];
    if (!food) return null;

    const m = new Map<number, number>(
      food.foodNutrients.map((n) => [n.nutrientId, n.value])
    );

    return {
      calories:       m.get(USDA_IDS.calories)       ?? 0,
      protein:        m.get(USDA_IDS.protein)         ?? 0,
      fat:            m.get(USDA_IDS.fat)             ?? 0,
      carbohydrates:  m.get(USDA_IDS.carbs)           ?? 0,
      fiber:          m.get(USDA_IDS.fiber)           ?? 0,
      sugar:          m.get(USDA_IDS.sugar)           ?? 0,
      sodium:         m.get(USDA_IDS.sodium)          ?? 0,
    };
  } catch {
    return null;
  }
}

/** Aggregates USDA nutrition across all ingredients, divides by servings */
async function withUsda(
  ingredients: Ingredient[],
  servings: number
): Promise<NutritionInfo | null> {
  const t = { calories: 0, protein: 0, fat: 0, carbohydrates: 0, fiber: 0, sugar: 0, sodium: 0, servingSize: 0 };
  let matched = 0;

  for (const ing of ingredients) {
    const g = toGrams(ing.quantity, ing.unit);
    const n = await fetchUsdaNutrients(ing.name);
    if (n) {
      const scale = g / 100;
      t.calories      += (n.calories      ?? 0) * scale;
      t.protein       += (n.protein       ?? 0) * scale;
      t.fat           += (n.fat           ?? 0) * scale;
      t.carbohydrates += (n.carbohydrates ?? 0) * scale;
      t.fiber         += (n.fiber         ?? 0) * scale;
      t.sugar         += (n.sugar         ?? 0) * scale;
      t.sodium        += (n.sodium        ?? 0) * scale;
      t.servingSize   += g;
      matched++;
    }
  }

  // Require at least 50% match rate for a reliable estimate
  if (matched < ingredients.length * 0.5) return null;

  return {
    calories:       Math.round(t.calories / servings),
    protein:        Math.round((t.protein / servings) * 10) / 10,
    fat:            Math.round((t.fat / servings) * 10) / 10,
    carbohydrates:  Math.round((t.carbohydrates / servings) * 10) / 10,
    fiber:          Math.round((t.fiber / servings) * 10) / 10,
    sugar:          Math.round((t.sugar / servings) * 10) / 10,
    sodium:         Math.round(t.sodium / servings),
    servingSize:    Math.round(t.servingSize / servings),
  };
}

// ── Edamam fallback ────────────────────────────────────────────────────────

/** Calls Edamam Nutrition Analysis API as a fallback when USDA fails */
async function withEdamam(
  ingredients: Ingredient[],
  servings: number,
  title: string
): Promise<NutritionInfo | null> {
  try {
    const id  = process.env.NEXT_PUBLIC_EDAMAM_APP_ID;
    const key = process.env.NEXT_PUBLIC_EDAMAM_APP_KEY;
    if (!id || !key) return null;

    const res = await fetch(`${EDAMAM_BASE}?app_id=${id}&app_key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        yield: servings,
        ingr: ingredients.map((i) => `${i.quantity} ${i.unit} ${i.name}`),
      }),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const d: EdamamResponse = await res.json();
    const n = d.totalNutrients;
    if (!n) return null;

    return {
      calories:       Math.round((n.ENERC_KCAL?.quantity ?? 0) / servings),
      protein:        Math.round(((n.PROCNT?.quantity     ?? 0) / servings) * 10) / 10,
      fat:            Math.round(((n.FAT?.quantity        ?? 0) / servings) * 10) / 10,
      carbohydrates:  Math.round(((n.CHOCDF?.quantity     ?? 0) / servings) * 10) / 10,
      fiber:          Math.round(((n.FIBTG?.quantity      ?? 0) / servings) * 10) / 10,
      sugar:          Math.round(((n.SUGAR?.quantity      ?? 0) / servings) * 10) / 10,
      sodium:         Math.round((n.NA?.quantity          ?? 0) / servings),
      servingSize:    Math.round((d.totalWeight           ?? 0) / servings),
    };
  } catch {
    return null;
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

export interface NutritionResult {
  data: NutritionInfo | null;
  source: "usda" | "edamam" | "failed";
  warning?: string;
}

/**
 * Calculates per-serving nutrition for a recipe.
 * Tries USDA first, Edamam as fallback.
 * Returns { data: null, source: "failed" } when both APIs fail.
 */
export async function calculateNutrition(
  ingredients: Ingredient[],
  servings: number,
  title = "Recipe"
): Promise<NutritionResult> {
  if (!ingredients.length || servings <= 0) {
    return { data: null, source: "failed", warning: "No ingredients provided" };
  }

  const usda = await withUsda(ingredients, servings);
  if (usda) return { data: usda, source: "usda" };

  const edamam = await withEdamam(ingredients, servings, title);
  if (edamam) return { data: edamam, source: "edamam" };

  return { data: null, source: "failed", warning: "Could not calculate nutrition" };
}

/**
 * Returns a Tailwind text-color class based on calorie level:
 * green < 300, amber 300–500, red > 500
 */
export function calorieColor(cal: number): string {
  if (cal < 300) return "text-green-600";
  if (cal < 500) return "text-amber-600";
  return "text-red-600";
}

/** Daily value reference amounts (used for progress bars in NutritionPanel) */
export const DAILY_VALUES: Record<keyof Omit<NutritionInfo, "servingSize">, number> = {
  calories:      2000,
  protein:       50,
  carbohydrates: 275,
  fat:           78,
  fiber:         28,
  sugar:         50,
  sodium:        2300,
};
