import { NextResponse } from "next/server";
import { estimateNutritionFromIngredients } from "@/lib/nutrition-usda";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { IngredientGroupDraft } from "@/lib/recipe-types";

// NUTRITION ESTIMATE API MAP
// The browser sends ingredient groups here.
// Flow: 1. Look up each ingredient in the library cache (ingredients table).
//       2. For cache hits, use stored per-100g values — no USDA call needed.
//       3. For misses, fall back to live USDA + local pantry fallback.

export async function POST(request: Request) {
  const body = (await request.json()) as {
    ingredientGroups?: unknown;
    servings?: unknown;
  };

  const ingredientGroups = Array.isArray(body.ingredientGroups) ? (body.ingredientGroups as IngredientGroupDraft[]) : [];
  const servings = typeof body.servings === "string" ? body.servings : "";

  if (ingredientGroups.length === 0) {
    return NextResponse.json({ error: "Please add ingredients first." }, { status: 400 });
  }

  // Build library cache: name_en → nutrition row
  // This eliminates live USDA calls for ingredients we've already looked up.
  let libraryCache: LibraryNutritionCache = {};
  try {
    const supabase = await createSupabaseServerClient();
    const allNames = ingredientGroups
      .flatMap(g => g.items.map(i => i.name_en.trim().toLowerCase()))
      .filter(Boolean);

    if (allNames.length > 0) {
      const { data } = await supabase
        .from("ingredients")
        .select(`
          name_en, synonyms,
          kcal_per_100g, protein_per_100g, fat_per_100g, sat_fat_per_100g,
          carbs_per_100g, fiber_per_100g, sugar_per_100g, sodium_per_100g,
          cholesterol_per_100g, potassium_per_100g, calcium_per_100g,
          iron_per_100g, magnesium_per_100g, phosphorus_per_100g, zinc_per_100g,
          vitamin_a_per_100g, vitamin_c_per_100g, vitamin_d_per_100g,
          vitamin_e_per_100g, vitamin_k_per_100g, vitamin_b6_per_100g,
          vitamin_b12_per_100g, folate_per_100g, nutrition_source
        `)
        .not("kcal_per_100g", "is", null);

      if (data) {
        libraryCache = buildLibraryCache(data, allNames);
      }
    }
  } catch {
    // If library lookup fails, silently continue with USDA-only path
  }

  try {
    const estimate = await estimateNutritionFromIngredients({
      ingredientGroups,
      servings,
      libraryCache,
    });

    return NextResponse.json(estimate);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not estimate nutrition.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// ── Library cache helpers ─────────────────────────────────────────────────────

export type LibraryNutritionRow = {
  name_en: string;
  synonyms: string[];
  nutrition_source: string | null;
  kcal_per_100g: number | null;
  protein_per_100g: number | null;
  fat_per_100g: number | null;
  sat_fat_per_100g: number | null;
  carbs_per_100g: number | null;
  fiber_per_100g: number | null;
  sugar_per_100g: number | null;
  sodium_per_100g: number | null;
  cholesterol_per_100g: number | null;
  potassium_per_100g: number | null;
  calcium_per_100g: number | null;
  iron_per_100g: number | null;
  magnesium_per_100g: number | null;
  phosphorus_per_100g: number | null;
  zinc_per_100g: number | null;
  vitamin_a_per_100g: number | null;
  vitamin_c_per_100g: number | null;
  vitamin_d_per_100g: number | null;
  vitamin_e_per_100g: number | null;
  vitamin_k_per_100g: number | null;
  vitamin_b6_per_100g: number | null;
  vitamin_b12_per_100g: number | null;
  folate_per_100g: number | null;
};

export type LibraryNutritionCache = Record<string, LibraryNutritionRow>;

function buildLibraryCache(
  rows: LibraryNutritionRow[],
  queryNames: string[]
): LibraryNutritionCache {
  const cache: LibraryNutritionCache = {};

  for (const queryName of queryNames) {
    const q = queryName.toLowerCase().trim();
    // Exact name match first
    let match = rows.find(r => r.name_en.toLowerCase() === q);
    // Synonym match
    if (!match) {
      match = rows.find(r => (r.synonyms ?? []).some((s: string) => s.toLowerCase() === q));
    }
    // Partial substring match
    if (!match) {
      match = rows.find(r =>
        r.name_en.toLowerCase().includes(q) || q.includes(r.name_en.toLowerCase())
      );
    }
    if (match) cache[q] = match;
  }

  return cache;
}
