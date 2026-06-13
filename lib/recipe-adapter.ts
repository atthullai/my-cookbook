/**
 * Adapter layer: converts between RecipeRecord (the existing DB shape)
 * and Recipe / RecipeSummary (the new display types from @/types).
 *
 * Why this file exists:
 * - RecipeRecord uses numeric ids, bilingual text fields (title_en/title_de),
 *   RecipeIngredientGroup arrays, and string-based badges.
 * - The new components and pages use Recipe/RecipeSummary with string ids,
 *   a single title, flat Ingredient arrays, and typed RecipeTag values.
 * - This adapter keeps both worlds compatible without changing the DB schema.
 */

import type { RecipeRecord, RecipeNutritionFacts } from "@/lib/recipe-types";
import { cleanRecipeTitle } from "@/lib/recipe-types";
import type {
  Recipe, RecipeSummary, CuisineOrigin,
  Ingredient, Equipment, RecipeStep,
  NutritionInfo, RecipeTag,
} from "@/types";
import { legacyBadgeToTag } from "@/lib/recipe-tags";

// ── CuisineOrigin mapping ──────────────────────────────────────────────────

/**
 * Maps the existing RecipeRecord fields to a CuisineOrigin.
 * Uses the new `origin` column if available; otherwise tries to
 * match the free-text `cuisine` field.
 */
export function toCuisineOrigin(record: RecipeRecord): CuisineOrigin {
  const NEW_ORIGINS = new Set<string>([
    "indian-tamil-nadu","indian-andhra","indian-karnataka","indian-kerala",
    "indian-north","indian-rajasthan","indian-bengal","indian-goa",
    "indian-maharashtra","indian-gujarat",
    "german","austrian","french","italian",
    "chinese","japanese","thai","mexican","american","other",
  ]);

  // Prefer the origin column only when it's a specific non-default value.
  // The Phase 1 migration defaulted every row to "other", so we skip "other"
  // here and let the cuisine field (which has real data) take precedence.
  if (record.origin && record.origin !== "other" && NEW_ORIGINS.has(record.origin)) {
    return record.origin as CuisineOrigin;
  }

  // Use the normalised cuisine key if it's already a valid specific origin
  if (record.cuisine && record.cuisine !== "other" && NEW_ORIGINS.has(record.cuisine)) {
    return record.cuisine as CuisineOrigin;
  }

  // Fall back to free-text cuisine field (handles legacy label-stored values)
  const c = (record.cuisine ?? "").toLowerCase();
  if (c.includes("tamil") || c.includes("chettinad"))  return "indian-tamil-nadu";
  if (c.includes("andhra") || c.includes("telangana")) return "indian-andhra";
  if (c.includes("karnataka") || c.includes("mysore")) return "indian-karnataka";
  if (c.includes("kerala"))                            return "indian-kerala";
  if (c.includes("bengal"))                            return "indian-bengal";
  if (c.includes("goa") || c.includes("goan"))        return "indian-goa";
  if (c.includes("maharashtra") || c.includes("mumbai")) return "indian-maharashtra";
  if (c.includes("gujarat"))                           return "indian-gujarat";
  if (c.includes("rajasthan"))                         return "indian-rajasthan";
  if (c.includes("north indian") || c.includes("mughal") || c.includes("punjab")) return "indian-north";
  if (c.includes("indian"))                            return "indian-north";
  if (c.includes("german"))                            return "german";
  if (c.includes("austrian"))                          return "austrian";
  if (c.includes("french"))                            return "french";
  if (c.includes("italian"))                           return "italian";
  if (c.includes("chinese"))                           return "chinese";
  if (c.includes("japanese"))                          return "japanese";
  if (c.includes("thai"))                              return "thai";
  if (c.includes("mexican"))                           return "mexican";
  if (c.includes("american"))                          return "american";
  return "other";
}

// ── Nutrition conversion ───────────────────────────────────────────────────

/**
 * Converts a RecipeNutritionFacts (string-valued JSONB) to NutritionInfo (number-valued).
 * Returns undefined when nutrition is null or all values are empty.
 */
export function toNutritionInfo(
  n: RecipeNutritionFacts | null | undefined,
  flatCalories?: number | null
): NutritionInfo | undefined {
  // Prefer the new flat integer columns if present
  if (flatCalories != null && flatCalories > 0) {
    return {
      calories:      flatCalories,
      protein:       0,
      carbohydrates: 0,
      fat:           0,
      fiber:         0,
      sugar:         0,
      sodium:        0,
      servingSize:   0,
    };
  }
  if (!n) return undefined;
  const cal = parseFloat(n.calories_kcal);
  if (!cal) return undefined;
  return {
    calories:       cal,
    protein:        parseFloat(n.protein_g)       || 0,
    carbohydrates:  parseFloat(n.carbs_g)         || 0,
    fat:            parseFloat(n.fat_g)           || 0,
    fiber:          parseFloat(n.fiber_g)         || 0,
    sugar:          parseFloat(n.sugar_g)         || 0,
    sodium:         parseFloat(n.sodium_mg)       || 0,
    servingSize:    0,
  };
}

// ── Tags conversion ────────────────────────────────────────────────────────

/** Converts a RecipeRecord.badges string array to RecipeTag[] */
export function toRecipeTags(badges: string[]): RecipeTag[] {
  return badges
    .map(legacyBadgeToTag)
    .filter((t): t is RecipeTag => t !== null);
}

// ── Time parsing ───────────────────────────────────────────────────────────

/** Parses time strings like "30 min", "1 hour", "45" into total minutes */
function parseTimeToMinutes(timeStr: string | null | undefined): number {
  if (!timeStr) return 0;
  const hourMatch  = timeStr.match(/(\d+)\s*h/i);
  const minMatch   = timeStr.match(/(\d+)\s*m/i);
  const plainMatch = timeStr.match(/^(\d+)$/);
  const hours   = hourMatch  ? parseInt(hourMatch[1])  : 0;
  const minutes = minMatch   ? parseInt(minMatch[1])   : 0;
  const plain   = plainMatch ? parseInt(plainMatch[1]) : 0;
  return (hours * 60) + minutes + plain;
}

// ── Ingredient conversion ──────────────────────────────────────────────────

/** Flattens RecipeIngredientGroup[] to Ingredient[] for the display layer */
function toIngredients(record: RecipeRecord): Ingredient[] {
  return record.ingredients.flatMap((group) =>
    group.items.map((item) => ({
      id:       item.id || `${item.name_en}-${item.unit}`,
      name:     item.name_en,
      quantity: typeof item.amount === "number"
        ? item.amount
        : parseFloat(String(item.amount ?? "0")) || 0,
      unit:     item.unit,
      notes:    item.preparation || undefined,
    }))
  );
}

/** Maps RecipeEquipmentItem[] to Equipment[] */
function toEquipment(record: RecipeRecord): Equipment[] {
  return record.equipment.map((eq) => ({ name: eq.label_en }));
}

/** Maps instruction sections to RecipeStep[] */
function toSteps(record: RecipeRecord): RecipeStep[] {
  let stepNumber = 0;
  return record.instruction_sections.flatMap((section) =>
    section.steps_en.map((instruction) => ({
      stepNumber: ++stepNumber,
      instruction,
    }))
  );
}

// ── Public adapters ────────────────────────────────────────────────────────

/**
 * Converts a full RecipeRecord to a Recipe display object.
 * Use for the recipe detail page.
 */
export function toRecipe(record: RecipeRecord): Recipe {
  const prepMins = record.prep_time_min ?? parseTimeToMinutes(record.prep_time);
  const cookMins = record.cook_time_min ?? parseTimeToMinutes(record.cook_time);

  return {
    id:              String(record.id),
    title:           cleanRecipeTitle(record.title_en),
    description:     record.description_en ?? undefined,
    cuisine:         toCuisineOrigin(record),
    tags:            toRecipeTags(record.badges),
    category:        record.category ?? undefined,
    imageUrl:        record.cover_image_url ?? undefined,
    prepTimeMinutes: prepMins,
    cookTimeMinutes: cookMins,
    servings:        record.servings ?? 4,
    ingredients:     toIngredients(record),
    equipment:       toEquipment(record),
    steps:           toSteps(record),
    nutrition:       toNutritionInfo(record.nutrition ?? null, record.calories),
    nutritionStatus: record.nutrition ? "calculated" : "pending",
    sourceUrl:       record.source_url ?? undefined,
    notes:           record.notes_en ?? undefined,
    isFavourite:     (record as RecipeRecord & { is_favourite?: boolean }).is_favourite ?? false,
    createdAt:       new Date().toISOString(),
    updatedAt:       new Date().toISOString(),
  };
}

/**
 * Converts a RecipeRecord to a RecipeSummary (for cards, planner sidebar, etc.)
 */
export function toRecipeSummary(record: RecipeRecord): RecipeSummary {
  const prepMins = record.prep_time_min ?? parseTimeToMinutes(record.prep_time);
  const cookMins = record.cook_time_min ?? parseTimeToMinutes(record.cook_time);

  // Flatten all ingredient items for ingredient-based filtering
  const ingredientLinks = (record.ingredients ?? []).flatMap((group) =>
    (group.items ?? []).map((item) => ({
      libraryId: item.libraryId ?? null,
      name_en:   item.name_en ?? "",
    }))
  );

  return {
    id:              String(record.id),
    ownerId:         record.user_id ?? null,
    title:           cleanRecipeTitle(record.title_en),
    cuisine:         toCuisineOrigin(record),
    tags:            toRecipeTags(record.badges),
    category:        record.category ?? undefined,
    imageUrl:        record.cover_image_url ?? undefined,
    prepTimeMinutes: prepMins,
    cookTimeMinutes: cookMins,
    servings:        record.servings ?? 4,
    nutrition:       toNutritionInfo(record.nutrition ?? null, record.calories),
    nutritionStatus: record.nutrition ? "calculated" : "pending",
    isFavourite:     (record as RecipeRecord & { is_favourite?: boolean }).is_favourite ?? false,
    ingredientLinks,
  };
}

/** Converts an array of RecipeRecords to RecipeSummary[] */
export function toRecipeSummaries(records: RecipeRecord[]): RecipeSummary[] {
  return records.map(toRecipeSummary);
}
