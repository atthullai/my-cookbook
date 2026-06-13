import type { NutritionSource, NutritionConfidence, NutritionBadgeProps } from "@/types";
import type { RecipeIngredient } from "@/lib/recipe-types";

export function deriveNutritionMeta(ingredients: RecipeIngredient[]): NutritionBadgeProps {
  const total = ingredients.length;
  if (total === 0) return { source: "unknown", confidence: "estimate", unmatchedCount: 0, totalCount: 0 };

  const unmatched = ingredients.filter((i) => !i.libraryId).length;

  // Source: use whatever the ingredients were actually matched against.
  // Prefer an explicit IFCT/USDA tag; otherwise the runtime pipeline is USDA
  // (nutrition-usda.ts), so matched-but-untagged ingredients are USDA, not IFCT.
  const sources = ingredients.map((i) => i.nutritionSource).filter(Boolean);
  const source: NutritionSource =
    sources.includes("ifct") ? "ifct" :
    sources.includes("usda") ? "usda" :
    unmatched < total ? "usda" : "unknown";

  const unmatchedRatio = unmatched / total;
  const confidence: NutritionConfidence =
    unmatchedRatio === 0 ? "exact" : unmatchedRatio < 0.2 ? "approximate" : "estimate";

  return { source, confidence, unmatchedCount: unmatched, totalCount: total };
}
