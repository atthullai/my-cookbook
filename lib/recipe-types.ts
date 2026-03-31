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

export type RecipeStepPhoto = {
  step_number: string;
  image_url: string;
  caption_en: string;
  caption_de: string;
};

export type RecipeFaqItem = {
  question_en: string;
  question_de: string;
  answer_en: string;
  answer_de: string;
};

export type RecipeTroubleshootingItem = {
  issue_en: string;
  issue_de: string;
  fix_en: string;
  fix_de: string;
};

export type RecipeNutritionFacts = {
  calories_kcal: string;
  fat_g: string;
  saturated_fat_g: string;
  carbs_g: string;
  fiber_g: string;
  sugar_g: string;
  protein_g: string;
  sodium_mg: string;
  note_en: string;
  note_de: string;
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
  tips_en?: string | null;
  tips_de?: string | null;
  storage_en?: string | null;
  storage_de?: string | null;
  faq?: RecipeFaqItem[];
  troubleshooting?: RecipeTroubleshootingItem[];
  step_photos?: RecipeStepPhoto[];
  nutrition?: RecipeNutritionFacts | null;
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

function normalizeStepPhoto(value: unknown): RecipeStepPhoto {
  const item = value && typeof value === "object" ? value : {};
  const raw = item as Record<string, unknown>;

  return {
    step_number: normalizeString(raw.step_number),
    image_url: normalizeString(raw.image_url),
    caption_en: normalizeString(raw.caption_en),
    caption_de: normalizeString(raw.caption_de) || normalizeString(raw.caption_en),
  };
}

function normalizeFaqItem(value: unknown): RecipeFaqItem {
  const item = value && typeof value === "object" ? value : {};
  const raw = item as Record<string, unknown>;

  return {
    question_en: normalizeString(raw.question_en),
    question_de: normalizeString(raw.question_de) || normalizeString(raw.question_en),
    answer_en: normalizeString(raw.answer_en),
    answer_de: normalizeString(raw.answer_de) || normalizeString(raw.answer_en),
  };
}

function normalizeTroubleshootingItem(value: unknown): RecipeTroubleshootingItem {
  const item = value && typeof value === "object" ? value : {};
  const raw = item as Record<string, unknown>;

  return {
    issue_en: normalizeString(raw.issue_en),
    issue_de: normalizeString(raw.issue_de) || normalizeString(raw.issue_en),
    fix_en: normalizeString(raw.fix_en),
    fix_de: normalizeString(raw.fix_de) || normalizeString(raw.fix_en),
  };
}

function normalizeNutrition(value: unknown): RecipeNutritionFacts | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;

  return {
    calories_kcal: normalizeString(raw.calories_kcal),
    fat_g: normalizeString(raw.fat_g),
    saturated_fat_g: normalizeString(raw.saturated_fat_g),
    carbs_g: normalizeString(raw.carbs_g),
    fiber_g: normalizeString(raw.fiber_g),
    sugar_g: normalizeString(raw.sugar_g),
    protein_g: normalizeString(raw.protein_g),
    sodium_mg: normalizeString(raw.sodium_mg),
    note_en: normalizeString(raw.note_en),
    note_de: normalizeString(raw.note_de) || normalizeString(raw.note_en),
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
    tips_en: normalizeString(raw.tips_en) || null,
    tips_de: normalizeString(raw.tips_de) || null,
    storage_en: normalizeString(raw.storage_en) || null,
    storage_de: normalizeString(raw.storage_de) || null,
    faq: Array.isArray(raw.faq) ? raw.faq.map(normalizeFaqItem) : [],
    troubleshooting: Array.isArray(raw.troubleshooting) ? raw.troubleshooting.map(normalizeTroubleshootingItem) : [],
    step_photos: Array.isArray(raw.step_photos) ? raw.step_photos.map(normalizeStepPhoto) : [],
    nutrition: normalizeNutrition(raw.nutrition),
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

export function getRecipeTips(recipe: RecipeRecord, lang: AppLanguage): string {
  if (lang === "de" && recipe.tips_de) {
    return recipe.tips_de;
  }

  return recipe.tips_en || "";
}

export function getRecipeStorage(recipe: RecipeRecord, lang: AppLanguage): string {
  if (lang === "de" && recipe.storage_de) {
    return recipe.storage_de;
  }

  return recipe.storage_en || "";
}

export function getRecipeNutritionNote(recipe: RecipeRecord, lang: AppLanguage): string {
  if (!recipe.nutrition) {
    return "";
  }

  if (lang === "de" && recipe.nutrition.note_de) {
    return recipe.nutrition.note_de;
  }

  return recipe.nutrition.note_en || "";
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

export type StepPhotoDraft = {
  step_number: string;
  image_url: string;
  caption_en: string;
  caption_de: string;
};

export const EMPTY_STEP_PHOTO: StepPhotoDraft = {
  step_number: "",
  image_url: "",
  caption_en: "",
  caption_de: "",
};

export type FaqDraft = {
  question_en: string;
  question_de: string;
  answer_en: string;
  answer_de: string;
};

export const EMPTY_FAQ: FaqDraft = {
  question_en: "",
  question_de: "",
  answer_en: "",
  answer_de: "",
};

export type TroubleshootingDraft = {
  issue_en: string;
  issue_de: string;
  fix_en: string;
  fix_de: string;
};

export const EMPTY_TROUBLESHOOTING: TroubleshootingDraft = {
  issue_en: "",
  issue_de: "",
  fix_en: "",
  fix_de: "",
};

export type NutritionDraft = {
  calories_kcal: string;
  fat_g: string;
  saturated_fat_g: string;
  carbs_g: string;
  fiber_g: string;
  sugar_g: string;
  protein_g: string;
  sodium_mg: string;
  note_en: string;
  note_de: string;
};

export const EMPTY_NUTRITION: NutritionDraft = {
  calories_kcal: "",
  fat_g: "",
  saturated_fat_g: "",
  carbs_g: "",
  fiber_g: "",
  sugar_g: "",
  protein_g: "",
  sodium_mg: "",
  note_en: "",
  note_de: "",
};
