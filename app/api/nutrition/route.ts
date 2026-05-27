/**
 * POST /api/nutrition
 * Body:    { ingredients: string[] }   — plain ingredient name strings
 * Returns: { calories, protein_g, carbs_g, fat_g, fiber_g }
 *
 * Simpler sibling of /api/nutrition-estimate.
 * Used by the useAutoNutrition hook in the add/edit recipe forms
 * to show a live macro preview while the user types.
 *
 * Falls back to DEMO_KEY when USDA_API_KEY is not set.
 */
import { NextResponse } from "next/server";

const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";

function getApiKey(): string {
  return process.env.USDA_API_KEY ?? "DEMO_KEY";
}

interface NutrientTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

interface FoodNutrient {
  nutrientId?: number;
  nutrientNumber?: string;
  value?: number;
}

interface FoodItem {
  foodNutrients?: FoodNutrient[];
}

interface SearchResponse {
  foods?: FoodItem[];
}

// USDA nutrient IDs for the macros we care about
const NUTRIENT_IDS = {
  calories: [1008, 208],   // Energy (kcal)
  protein_g: [1003, 203],  // Protein
  carbs_g: [1005, 205],    // Carbohydrate
  fat_g: [1004, 204],      // Total lipid (fat)
  fiber_g: [1079, 291],    // Fiber, total dietary
} satisfies Record<keyof NutrientTotals, number[]>;

function extractNutrient(nutrients: FoodNutrient[], ids: number[]): number {
  for (const nutrient of nutrients) {
    const id = nutrient.nutrientId ?? Number(nutrient.nutrientNumber);
    if (ids.includes(id) && typeof nutrient.value === "number") {
      return nutrient.value;
    }
  }
  return 0;
}

async function lookupIngredient(name: string): Promise<NutrientTotals> {
  const zero: NutrientTotals = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
  if (!name.trim()) return zero;

  const params = new URLSearchParams({
    query: name.trim(),
    pageSize: "1",
    api_key: getApiKey(),
  });

  try {
    const res = await fetch(`${USDA_BASE}/foods/search?${params}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return zero;

    const data: SearchResponse = await res.json();
    const food = data.foods?.[0];
    if (!food?.foodNutrients) return zero;

    const nutrients = food.foodNutrients;
    return {
      calories:  extractNutrient(nutrients, NUTRIENT_IDS.calories),
      protein_g: extractNutrient(nutrients, NUTRIENT_IDS.protein_g),
      carbs_g:   extractNutrient(nutrients, NUTRIENT_IDS.carbs_g),
      fat_g:     extractNutrient(nutrients, NUTRIENT_IDS.fat_g),
      fiber_g:   extractNutrient(nutrients, NUTRIENT_IDS.fiber_g),
    };
  } catch {
    return zero;
  }
}

export async function POST(req: Request): Promise<Response> {
  let ingredients: string[];

  try {
    const body = await req.json() as { ingredients?: unknown };
    if (!Array.isArray(body.ingredients)) {
      return NextResponse.json({ error: "ingredients must be a string array" }, { status: 400 });
    }
    ingredients = body.ingredients.map(String);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const results = await Promise.all(ingredients.map(lookupIngredient));

  const totals = results.reduce<NutrientTotals>(
    (acc, r) => ({
      calories:  acc.calories  + r.calories,
      protein_g: acc.protein_g + r.protein_g,
      carbs_g:   acc.carbs_g   + r.carbs_g,
      fat_g:     acc.fat_g     + r.fat_g,
      fiber_g:   acc.fiber_g   + r.fiber_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
  );

  return NextResponse.json(totals);
}
