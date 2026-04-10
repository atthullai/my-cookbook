import type { AppLanguage, RecipeRecord } from "@/lib/recipe-types";
import { getInstructionSections, getRecipeNotes } from "@/lib/recipe-types";

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

  if (recipe.cuisine) {
    highlights.push(recipe.cuisine);
  }

  if (recipe.course) {
    highlights.push(recipe.course);
  }

  if (recipe.difficulty) {
    highlights.push(recipe.difficulty);
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

function parseNutrientValue(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const DAILY_VALUES = {
  protein_g: 50,
  fiber_g: 28,
  calcium_mg: 1300,
  iron_mg: 18,
  potassium_mg: 4700,
  vitamin_d_mcg: 20,
} as const;

const CLAIM_LABELS = {
  protein_g: "Protein",
  fiber_g: "Fiber",
  calcium_mg: "Calcium",
  iron_mg: "Iron",
  potassium_mg: "Potassium",
  vitamin_d_mcg: "Vitamin D",
} as const;

// These are display claims, not legal packaging claims. They help your recipe cards communicate
// nutrition strengths based on manual nutrition values already stored in the app.
export function deriveNutritionClaimTags(recipe: RecipeRecord): string[] {
  if (!recipe.nutrition) {
    return [];
  }

  return (Object.keys(DAILY_VALUES) as Array<keyof typeof DAILY_VALUES>)
    .flatMap((key) => {
      const value = parseNutrientValue(recipe.nutrition?.[key]);
      if (value === null) {
        return [];
      }

      const percentDailyValue = (value / DAILY_VALUES[key]) * 100;

      if (percentDailyValue >= 20) {
        return [`Excellent ${CLAIM_LABELS[key]}`];
      }

      if (percentDailyValue >= 10) {
        return [`Good ${CLAIM_LABELS[key]}`];
      }

      return [];
    })
    .filter(Boolean);
}
