/**
 * Match which recipe ingredients are referenced in a step's text.
 *
 * Used in three places:
 *  - the recipe view, as a fallback when a step has no explicit `ingredientRefs`
 *    (older recipes authored before structured steps);
 *  - the URL importer, to pre-fill `ingredientRefs` on imported steps;
 *  - the create/edit form, to suggest links when pasting instructions.
 *
 * Returns canonicalName keys (stable per recipe). Matching is a simple
 * case-insensitive substring test against each ingredient's English/German/
 * canonical name — deliberately no AI.
 */

export type StepMatchableIngredient = {
  canonicalName?: string | null;
  name_en?: string | null;
  name_de?: string | null;
};

function keyFor(item: StepMatchableIngredient): string {
  return (item.canonicalName || item.name_en || item.name_de || "").trim().toLowerCase();
}

/** Returns the canonicalName keys of ingredients mentioned in `text`. */
export function matchIngredientsInStep(
  text: string,
  ingredients: StepMatchableIngredient[],
  limit = 8,
): string[] {
  const haystack = (text || "").toLowerCase();
  if (!haystack) return [];

  const keys = new Set<string>();
  for (const item of ingredients) {
    const key = keyFor(item);
    if (!key) continue;
    // Candidate display names worth probing for in the step text.
    const candidates = [item.name_en, item.name_de, item.canonicalName]
      .map((n) => (n || "").trim().toLowerCase())
      .filter((n) => n.length > 2);
    if (candidates.some((name) => haystack.includes(name))) {
      keys.add(key);
      if (keys.size >= limit) break;
    }
  }
  return [...keys];
}
