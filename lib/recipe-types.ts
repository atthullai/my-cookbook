import type { User } from "@supabase/supabase-js";

// Shared app-wide types live here so page components, form components, and helpers all
// agree on the same recipe shape. This is what prevents "works on one page, breaks on another".
export type AppLanguage = "en" | "de";
export type AppUser = User;

export type RecipeAmount = string | number | null;

export type RecipeIngredient = {
  name_en: string;
  name_de: string;
  amount: RecipeAmount;
  unit: string;
};

export type RecipeIngredientGroup = {
  group_en: string;
  group_de: string;
  items: RecipeIngredient[];
};

export type RecipeEquipmentItem = {
  label_en: string;
  label_de: string;
};

export type RecipeRecord = {
  id: number;
  slug: string;
  user_id: string;
  title_en: string;
  title_de: string | null;
  author_name: string;
  learned_from: string | null;
  description_en: string | null;
  description_de: string | null;
  category: string | null;
  tags: string[];
  ingredients: RecipeIngredientGroup[];
  steps_en: string;
  steps_de: string | null;
  notes_en: string | null;
  notes_de: string | null;
  source_url: string | null;
  video_url: string | null;
  servings: number | null;
  equipment: RecipeEquipmentItem[];
  image_urls: string[];
};

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

// Slugs give recipes a readable stable identifier derived from the English title.
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

// Old rows may still contain legacy single-language fields. These normalizers upgrade them
// into the new bilingual shape so the UI can render old and new records safely.
function normalizeIngredient(value: unknown): RecipeIngredient {
  const item = value && typeof value === "object" ? value : {};
  const raw = item as Record<string, unknown>;
  const legacyName = normalizeString(raw.name);

  return {
    name_en: normalizeString(raw.name_en) || legacyName,
    name_de: normalizeString(raw.name_de) || legacyName,
    amount: normalizeAmount(raw.amount),
    unit: normalizeString(raw.unit),
  };
}

function normalizeIngredientGroup(value: unknown): RecipeIngredientGroup {
  const groupValue = value && typeof value === "object" ? value : {};
  const raw = groupValue as Record<string, unknown>;
  const legacyGroup = normalizeString(raw.group) || "Main";

  return {
    group_en: normalizeString(raw.group_en) || legacyGroup,
    group_de: normalizeString(raw.group_de) || legacyGroup,
    items: Array.isArray(raw.items) ? raw.items.map(normalizeIngredient) : [],
  };
}

function normalizeEquipmentItem(value: unknown): RecipeEquipmentItem {
  if (typeof value === "string") {
    return {
      label_en: value,
      label_de: value,
    };
  }

  const item = value && typeof value === "object" ? value : {};
  const raw = item as Record<string, unknown>;
  const legacyLabel = normalizeString(raw.label);

  return {
    label_en: normalizeString(raw.label_en) || legacyLabel,
    label_de: normalizeString(raw.label_de) || legacyLabel || normalizeString(raw.label_en),
  };
}

export function normalizeRecipe(value: unknown): RecipeRecord {
  const rawValue = value && typeof value === "object" ? value : {};
  const raw = rawValue as Record<string, unknown>;
  const titleEn = normalizeString(raw.title_en);

  return {
    id: typeof raw.id === "number" ? raw.id : Number(raw.id ?? 0),
    slug: normalizeString(raw.slug) || slugify(titleEn) || String(raw.id ?? ""),
    user_id: normalizeString(raw.user_id),
    title_en: titleEn,
    title_de: normalizeString(raw.title_de) || null,
    author_name: normalizeString(raw.author_name) || "Saran",
    learned_from: normalizeString(raw.learned_from) || null,
    description_en: normalizeString(raw.description_en) || null,
    description_de: normalizeString(raw.description_de) || null,
    category: normalizeString(raw.category) || null,
    tags: Array.isArray(raw.tags)
      ? raw.tags.map((tag) => normalizeString(tag).trim()).filter(Boolean)
      : [],
    ingredients: Array.isArray(raw.ingredients) ? raw.ingredients.map(normalizeIngredientGroup) : [],
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
    equipment: Array.isArray(raw.equipment) ? raw.equipment.map(normalizeEquipmentItem) : [],
    image_urls: Array.isArray(raw.image_urls)
      ? raw.image_urls.map((item) => normalizeString(item).trim()).filter(Boolean)
      : [],
  };
}

// These helpers keep the React pages simple: the page asks for "the title in the current language"
// instead of re-implementing fallback logic everywhere.
export function getRecipeTitle(recipe: RecipeRecord, lang: AppLanguage): string {
  if (lang === "de" && recipe.title_de) {
    return recipe.title_de;
  }

  return recipe.title_en;
}

export function getRecipeDescription(recipe: RecipeRecord, lang: AppLanguage): string {
  if (lang === "de" && recipe.description_de) {
    return recipe.description_de;
  }

  return recipe.description_en || "";
}

export function getRecipeSteps(recipe: RecipeRecord, lang: AppLanguage): string {
  if (lang === "de" && recipe.steps_de) {
    return recipe.steps_de;
  }

  return recipe.steps_en;
}

export function getRecipeNotes(recipe: RecipeRecord, lang: AppLanguage): string {
  if (lang === "de" && recipe.notes_de) {
    return recipe.notes_de;
  }

  return recipe.notes_en || "";
}

export function getIngredientGroupLabel(group: RecipeIngredientGroup, lang: AppLanguage): string {
  return lang === "de" ? group.group_de || group.group_en : group.group_en;
}

export function getIngredientLabel(ingredient: RecipeIngredient, lang: AppLanguage): string {
  return lang === "de" ? ingredient.name_de || ingredient.name_en : ingredient.name_en;
}

export function getEquipmentLabel(item: RecipeEquipmentItem, lang: AppLanguage): string {
  return lang === "de" ? item.label_de || item.label_en : item.label_en;
}

export function splitRecipeSteps(text: string): string[] {
  return text
    .split("\n")
    .map((step) => step.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
}

// Route params arrive as strings from the URL. This helper safely converts them into numeric ids.
export function parseRecipeId(value: string | string[] | undefined): number | null {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = Number(rawValue);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

// Tags are stored as arrays in the database, but users edit them as comma-separated text.
export function parseTagInput(tags: string): string[] {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

// Draft types are used only while editing forms. They stay string-based so inputs can be controlled
// without fighting with number parsing or half-typed values like "1/" while the user is typing.
export type IngredientDraft = {
  name_en: string;
  name_de: string;
  amount: string;
  unit: string;
};

export const EMPTY_INGREDIENT: IngredientDraft = {
  name_en: "",
  name_de: "",
  amount: "",
  unit: "",
};

export type IngredientGroupDraft = {
  group_en: string;
  group_de: string;
  items: IngredientDraft[];
};

export const EMPTY_INGREDIENT_GROUP: IngredientGroupDraft = {
  group_en: "Main",
  group_de: "Hauptteil",
  items: [{ ...EMPTY_INGREDIENT }],
};

export type EquipmentDraft = {
  label_en: string;
  label_de: string;
};

export const EMPTY_EQUIPMENT: EquipmentDraft = {
  label_en: "",
  label_de: "",
};
