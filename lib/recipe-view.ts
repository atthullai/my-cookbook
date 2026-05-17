import type { AppLanguage, RecipeNutritionFacts, RecipeRecord } from "@/lib/recipe-types";
import { getBadgeLabel, getInstructionSections, getRecipeCourse, getRecipeCuisine, getRecipeDifficulty, getRecipeNotes } from "@/lib/recipe-types";

// RECIPE VIEW MAP
// These helpers are only for displaying recipes nicely.
// They do not save to the database. They prepare chips, links, cover images, and nutrition claim tags for the UI.

// The recipe page renders normalized instruction sections, regardless of whether the row
// came from the new structured editor or an older text-only recipe.
export type InstructionSection = {
  title: string;
  steps: string[];
};

export function parseInstructionSections(recipe: RecipeRecord, lang: AppLanguage): InstructionSection[] {
  return getInstructionSections(recipe, lang);
}

export function extractLinks(recipe: RecipeRecord): string[] {
  // Scan the source URL, video URL, steps, and notes for links so the recipe page can show them together.
  const links = new Set<string>();
  const urlPattern = /https?:\/\/[^\s)]+/g;

  for (const block of [recipe.source_url, recipe.video_url, recipe.steps_en, recipe.steps_de, recipe.notes_en, recipe.notes_de]) {
    const matches = block?.match(urlPattern) ?? [];

    for (const match of matches) {
      links.add(match);
    }
  }

  return Array.from(links);
}

// Highlights are the small chips shown near the top of the recipe page.
export function buildRecipeHighlights(recipe: RecipeRecord, lang: AppLanguage): string[] {
  const highlights: string[] = [];

  if (getRecipeCuisine(recipe, lang)) {
    highlights.push(getRecipeCuisine(recipe, lang));
  }

  if (getRecipeCourse(recipe, lang)) {
    highlights.push(getRecipeCourse(recipe, lang));
  }

  if (getRecipeDifficulty(recipe, lang)) {
    highlights.push(getRecipeDifficulty(recipe, lang));
  }

  if (recipe.prep_time) {
    highlights.push(lang === "de" ? `Vorbereitung ${recipe.prep_time}` : `Prep ${recipe.prep_time}`);
  }

  if (recipe.cook_time) {
    highlights.push(lang === "de" ? `Kochen ${recipe.cook_time}` : `Cook ${recipe.cook_time}`);
  }

  if (recipe.total_time) {
    highlights.push(lang === "de" ? `Gesamt ${recipe.total_time}` : `Total ${recipe.total_time}`);
  }

  if (recipe.servings) {
    highlights.push(lang === "de" ? `${recipe.servings} Portionen` : `${recipe.servings} servings`);
  }

  if (recipe.ingredients.length > 0) {
    highlights.push(
      lang === "de"
        ? `${recipe.ingredients.length} Zutatenbereiche`
        : `${recipe.ingredients.length} ingredient section${recipe.ingredients.length > 1 ? "s" : ""}`
    );
  }

  return highlights;
}

export function hasNotes(recipe: RecipeRecord, lang: AppLanguage): boolean {
  return Boolean(getRecipeNotes(recipe, lang).trim());
}

export function getRecipeCoverImage(recipe: RecipeRecord): string {
  return recipe.cover_image_url || recipe.image_urls[0] || "";
}

export function parseNutrientValue(value: string | undefined): number | null {
  // Nutrition fields are strings in the database because they come from editable text inputs.
  // Convert only valid numbers; ignore blanks or weird text.
  if (!value) {
    return null;
  }

  const parsed = Number(value.replace(",", ".").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

const DAILY_VALUES = {
  fat_g: 78,
  saturated_fat_g: 20,
  carbs_g: 275,
  protein_g: 50,
  fiber_g: 28,
  sodium_mg: 2300,
  potassium_mg: 4700,
  calcium_mg: 1300,
  iron_mg: 18,
  magnesium_mg: 420,
  phosphorus_mg: 1250,
  zinc_mg: 11,
  vitamin_a_mcg: 900,
  vitamin_c_mg: 90,
  vitamin_d_mcg: 20,
  vitamin_e_mg: 15,
  vitamin_k_mcg: 120,
  vitamin_b6_mg: 1.7,
  vitamin_b12_mcg: 2.4,
  folate_mcg: 400,
} as const;

const CLAIM_LABELS = {
  fat_g: "Fat",
  saturated_fat_g: "Saturated Fat",
  carbs_g: "Carbohydrates",
  protein_g: "Protein",
  fiber_g: "Fiber",
  sodium_mg: "Sodium",
  potassium_mg: "Potassium",
  calcium_mg: "Calcium",
  iron_mg: "Iron",
  magnesium_mg: "Magnesium",
  phosphorus_mg: "Phosphorus",
  zinc_mg: "Zinc",
  vitamin_a_mcg: "Vitamin A",
  vitamin_c_mg: "Vitamin C",
  vitamin_d_mcg: "Vitamin D",
  vitamin_e_mg: "Vitamin E",
  vitamin_k_mcg: "Vitamin K",
  vitamin_b6_mg: "Vitamin B6",
  vitamin_b12_mcg: "Vitamin B12",
  folate_mcg: "Folate",
} as const;

const NUTRITION_LABELS: Array<{
  key: keyof Omit<RecipeNutritionFacts, "note_en" | "note_de">;
  label_en: string;
  label_de: string;
  unit: string;
  group: "energy" | "macro" | "mineral" | "vitamin";
}> = [
  { key: "calories_kcal", label_en: "Calories", label_de: "Kalorien", unit: "kcal", group: "energy" },
  { key: "fat_g", label_en: "Fat", label_de: "Fett", unit: "g", group: "macro" },
  { key: "saturated_fat_g", label_en: "Saturated Fat", label_de: "Gesattigte Fettsauren", unit: "g", group: "macro" },
  { key: "carbs_g", label_en: "Carbohydrates", label_de: "Kohlenhydrate", unit: "g", group: "macro" },
  { key: "fiber_g", label_en: "Fiber", label_de: "Ballaststoffe", unit: "g", group: "macro" },
  { key: "sugar_g", label_en: "Sugar", label_de: "Zucker", unit: "g", group: "macro" },
  { key: "protein_g", label_en: "Protein", label_de: "Protein", unit: "g", group: "macro" },
  { key: "sodium_mg", label_en: "Sodium", label_de: "Natrium", unit: "mg", group: "mineral" },
  { key: "cholesterol_mg", label_en: "Cholesterol", label_de: "Cholesterin", unit: "mg", group: "macro" },
  { key: "potassium_mg", label_en: "Potassium", label_de: "Kalium", unit: "mg", group: "mineral" },
  { key: "calcium_mg", label_en: "Calcium", label_de: "Kalzium", unit: "mg", group: "mineral" },
  { key: "iron_mg", label_en: "Iron", label_de: "Eisen", unit: "mg", group: "mineral" },
  { key: "magnesium_mg", label_en: "Magnesium", label_de: "Magnesium", unit: "mg", group: "mineral" },
  { key: "phosphorus_mg", label_en: "Phosphorus", label_de: "Phosphor", unit: "mg", group: "mineral" },
  { key: "zinc_mg", label_en: "Zinc", label_de: "Zink", unit: "mg", group: "mineral" },
  { key: "vitamin_a_mcg", label_en: "Vitamin A", label_de: "Vitamin A", unit: "mcg", group: "vitamin" },
  { key: "vitamin_c_mg", label_en: "Vitamin C", label_de: "Vitamin C", unit: "mg", group: "vitamin" },
  { key: "vitamin_d_mcg", label_en: "Vitamin D", label_de: "Vitamin D", unit: "mcg", group: "vitamin" },
  { key: "vitamin_e_mg", label_en: "Vitamin E", label_de: "Vitamin E", unit: "mg", group: "vitamin" },
  { key: "vitamin_k_mcg", label_en: "Vitamin K", label_de: "Vitamin K", unit: "mcg", group: "vitamin" },
  { key: "vitamin_b6_mg", label_en: "Vitamin B6", label_de: "Vitamin B6", unit: "mg", group: "vitamin" },
  { key: "vitamin_b12_mcg", label_en: "Vitamin B12", label_de: "Vitamin B12", unit: "mcg", group: "vitamin" },
  { key: "folate_mcg", label_en: "Folate", label_de: "Folat", unit: "mcg", group: "vitamin" },
];

export function getNutritionItems(recipe: RecipeRecord, lang: AppLanguage) {
  if (!recipe.nutrition) {
    return [];
  }

  return NUTRITION_LABELS.flatMap((item) => {
    const value = recipe.nutrition?.[item.key]?.trim() ?? "";

    if (!value) {
      return [];
    }

    const numericValue = parseNutrientValue(value);
    const dailyValue = item.key in DAILY_VALUES ? DAILY_VALUES[item.key as keyof typeof DAILY_VALUES] : null;
    const dailyPercent = numericValue !== null && dailyValue ? Math.round((numericValue / dailyValue) * 100) : null;

    return [
      {
        ...item,
        label: lang === "de" ? item.label_de : item.label_en,
        value,
        numericValue,
        dailyPercent,
      },
    ];
  });
}

export function getMacroBalance(recipe: RecipeRecord) {
  if (!recipe.nutrition) {
    return [];
  }

  const protein = parseNutrientValue(recipe.nutrition.protein_g) ?? 0;
  const carbs = parseNutrientValue(recipe.nutrition.carbs_g) ?? 0;
  const fat = parseNutrientValue(recipe.nutrition.fat_g) ?? 0;
  const total = protein + carbs + fat;

  if (total <= 0) {
    return [];
  }

  return [
    { key: "protein", label_en: "Protein", label_de: "Protein", value: protein, percent: Math.round((protein / total) * 100) },
    { key: "carbs", label_en: "Carbs", label_de: "Kohlenhydrate", value: carbs, percent: Math.round((carbs / total) * 100) },
    { key: "fat", label_en: "Fat", label_de: "Fett", value: fat, percent: Math.round((fat / total) * 100) },
  ].filter((item) => item.value > 0);
}

export function getNutritionHighlights(recipe: RecipeRecord, lang: AppLanguage) {
  const items = getNutritionItems(recipe, lang);

  return items
    .filter((item) => item.dailyPercent !== null && item.dailyPercent >= 10 && item.key !== "saturated_fat_g" && item.key !== "sodium_mg")
    .sort((left, right) => (right.dailyPercent ?? 0) - (left.dailyPercent ?? 0))
    .slice(0, 4);
}

// These are display claims, not legal packaging claims. They help your recipe cards communicate
// nutrition strengths based on manual nutrition values already stored in the app.
export function deriveNutritionClaimTags(recipe: RecipeRecord, lang: AppLanguage = "en"): string[] {
  if (!recipe.nutrition) {
    return [];
  }

  const claimKeys: Array<keyof typeof DAILY_VALUES> = [
    "protein_g",
    "fiber_g",
    "calcium_mg",
    "iron_mg",
    "potassium_mg",
    "magnesium_mg",
    "zinc_mg",
    "vitamin_a_mcg",
    "vitamin_c_mg",
    "vitamin_d_mcg",
    "vitamin_b12_mcg",
    "folate_mcg",
  ];

  return claimKeys
    .flatMap((key) => {
      const value = parseNutrientValue(recipe.nutrition?.[key]);
      if (value === null) {
        return [];
      }

      const percentDailyValue = (value / DAILY_VALUES[key]) * 100;

      if (percentDailyValue >= 20) {
        return [getBadgeLabel(`Excellent ${CLAIM_LABELS[key]}`, lang)];
      }

      if (percentDailyValue >= 10) {
        return [getBadgeLabel(`Good ${CLAIM_LABELS[key]}`, lang)];
      }

      return [];
    })
    .filter(Boolean);
}
