import type { NutritionSource, NutritionConfidence, NutritionBadgeProps } from "@/types";
import type { RecipeIngredient } from "@/lib/recipe-types";

export function deriveNutritionMeta(ingredients: RecipeIngredient[]): NutritionBadgeProps {
  const total = ingredients.length;
  if (total === 0) return { source: "unknown", confidence: "estimate", unmatchedCount: 0, totalCount: 0 };

  const unmatched = ingredients.filter((i) => !i.libraryId).length;

  // Source: if anything is matched to the library, treat as IFCT (primary source).
  // A future nutritionSource field per ingredient would let us distinguish IFCT vs USDA precisely.
  const source: NutritionSource = unmatched < total ? "ifct" : "unknown";

  const unmatchedRatio = unmatched / total;
  const confidence: NutritionConfidence =
    unmatchedRatio === 0 ? "exact" : unmatchedRatio < 0.2 ? "approximate" : "estimate";

  return { source, confidence, unmatchedCount: unmatched, totalCount: total };
}
