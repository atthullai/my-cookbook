import type { User } from "@supabase/supabase-js";

export type AppLanguage = "en" | "de";
export type AppUser = User;

export type RecipeAmount = string | number | null;

export type RecipeIngredient = {
  name: string;
  amount: RecipeAmount;
  unit: string;
};

export type RecipeIngredientGroup = {
  group: string;
  items: RecipeIngredient[];
};

export type RecipeRecord = {
  id: number;
  user_id: string;
  title_en: string;
  title_de: string | null;
  description_en?: string | null;
  description_de?: string | null;
  category: string | null;
  tags: string[];
  ingredients: RecipeIngredientGroup[];
  steps_en: string;
  steps_de: string | null;
  notes_en?: string | null;
  notes_de?: string | null;
  source_url?: string | null;
  video_url?: string | null;
  servings?: number | null;
  equipment?: string[];
  image_urls?: string[];
};

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeAmount(value: unknown): RecipeAmount {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return null;
}

function normalizeIngredient(value: unknown): RecipeIngredient {
  const item = value && typeof value === "object" ? value : {};
  const recipeItem = item as Record<string, unknown>;

  return {
    name: normalizeString(recipeItem.name),
    amount: normalizeAmount(recipeItem.amount),
    unit: normalizeString(recipeItem.unit),
  };
}

function normalizeIngredientGroup(value: unknown): RecipeIngredientGroup {
  const groupValue = value && typeof value === "object" ? value : {};
  const group = groupValue as Record<string, unknown>;
  const items = Array.isArray(group.items)
    ? group.items.map(normalizeIngredient)
    : [];

  return {
    group: normalizeString(group.group) || "Main",
    items,
  };
}

export function normalizeRecipe(value: unknown): RecipeRecord {
  const rawValue = value && typeof value === "object" ? value : {};
  const raw = rawValue as Record<string, unknown>;

  return {
    id: typeof raw.id === "number" ? raw.id : Number(raw.id ?? 0),
    user_id: normalizeString(raw.user_id),
    title_en: normalizeString(raw.title_en),
    title_de: normalizeString(raw.title_de) || null,
    description_en: normalizeString(raw.description_en) || null,
    description_de: normalizeString(raw.description_de) || null,
    category: normalizeString(raw.category) || null,
    tags: Array.isArray(raw.tags)
      ? raw.tags
          .map((tag) => normalizeString(tag).trim())
          .filter(Boolean)
      : [],
    ingredients: Array.isArray(raw.ingredients)
      ? raw.ingredients.map(normalizeIngredientGroup)
      : [],
    steps_en: normalizeString(raw.steps_en),
    steps_de: normalizeString(raw.steps_de) || null,
    notes_en: normalizeString(raw.notes_en) || null,
    notes_de: normalizeString(raw.notes_de) || null,
    source_url: normalizeString(raw.source_url) || null,
    video_url: normalizeString(raw.video_url) || null,
    servings:
      typeof raw.servings === "number"
        ? raw.servings
        : typeof raw.servings === "string" && raw.servings.trim()
          ? Number(raw.servings)
          : null,
    equipment: Array.isArray(raw.equipment)
      ? raw.equipment.map((item) => normalizeString(item).trim()).filter(Boolean)
      : [],
    image_urls: Array.isArray(raw.image_urls)
      ? raw.image_urls.map((item) => normalizeString(item).trim()).filter(Boolean)
      : [],
  };
}

export function getRecipeTitle(recipe: RecipeRecord, lang: AppLanguage): string {
  if (lang === "de" && recipe.title_de) {
    return recipe.title_de;
  }

  return recipe.title_en;
}

export function getRecipeSteps(recipe: RecipeRecord, lang: AppLanguage): string {
  if (lang === "de" && recipe.steps_de) {
    return recipe.steps_de;
  }

  return recipe.steps_en;
}

export function getRecipeDescription(recipe: RecipeRecord, lang: AppLanguage): string {
  if (lang === "de" && recipe.description_de) {
    return recipe.description_de;
  }

  return recipe.description_en || "";
}

export function getRecipeNotes(recipe: RecipeRecord, lang: AppLanguage): string {
  if (lang === "de" && recipe.notes_de) {
    return recipe.notes_de;
  }

  return recipe.notes_en || "";
}

export function splitRecipeSteps(text: string): string[] {
  return text
    .split("\n")
    .map((step) => step.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
}

export function parseRecipeId(value: string | string[] | undefined): number | null {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = Number(rawValue);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

export function parseTagInput(tags: string): string[] {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export type IngredientDraft = {
  name: string;
  amount: string;
  unit: string;
};

export const EMPTY_INGREDIENT: IngredientDraft = {
  name: "",
  amount: "",
  unit: "",
};
