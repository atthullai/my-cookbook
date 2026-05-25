export function stableSlug(value: unknown): string {
  const text = String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return text || "item";
}

export function stableCompositeId(...parts: unknown[]): string {
  return parts.map(stableSlug).join("__");
}

export function recipeBadgeId(recipeId: number | string, badge: string): string {
  return stableCompositeId("recipe", recipeId, "badge", badge);
}

export function recipeTimingId(recipeId: number | string, slot: string, value: string): string {
  return stableCompositeId("recipe", recipeId, "time", slot, value);
}

export function ingredientGroupId(recipeId: number | string, groupName: string, groupIndex: number): string {
  return stableCompositeId("recipe", recipeId, "ingredient-group", groupIndex, groupName);
}

export function ingredientRowId(recipeId: number | string, groupName: string, ingredientName: string, ingredientIndex: number): string {
  return stableCompositeId("recipe", recipeId, "ingredient", groupName, ingredientIndex, ingredientName);
}

export function cookingStepId(recipeId: number | string, sectionTitle: string, step: string, stepIndex: number): string {
  return stableCompositeId("recipe", recipeId, "step", sectionTitle, stepIndex, step.slice(0, 48));
}

export function nutritionTagId(recipeId: number | string, tag: string): string {
  return stableCompositeId("recipe", recipeId, "nutrition", tag);
}
