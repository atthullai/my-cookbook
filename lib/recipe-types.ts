import type { User } from "@supabase/supabase-js";
import { findEquipmentItem } from "@/lib/equipment-library";
import { inferEquipmentFromText } from "@/lib/equipment-matcher";

// RECIPE TYPES MAP
// This is the app's dictionary.
// It defines what a recipe, ingredient, instruction section, badge, nutrition block, and draft form object look like.
// When the database shape changes, this is usually the first file to check.

// Shared app-wide types live here so page components, form components, and helpers all
// agree on the same recipe shape. This is what prevents "works on one page, breaks on another".
export type AppLanguage = "en" | "de";
export type AppUser = User;

export type RecipeAmount = string | number | null;

export const DIFFICULTY_OPTIONS = [
  "Beginner",
  "Intermediate",
  "Advanced",
] as const;

export const DIFFICULTY_LABELS_DE: Record<(typeof DIFFICULTY_OPTIONS)[number], string> = {
  Beginner: "Anfänger",
  Intermediate: "Mittel",
  Advanced: "Fortgeschritten",
};

export const BADGE_OPTIONS = [
  "Veg",
  "Non-Veg",
  "Egg",
  "Vegan",
  "Spicy",
  "High Protein",
  "Quick Meal",
  "One Pot",
  "Festival",
  "Breakfast",
  "Lunch",
  "Dinner",
  "Dessert",
] as const;

export const BADGE_LABELS_DE: Record<(typeof BADGE_OPTIONS)[number], string> = {
  Veg: "Vegetarisch",
  "Non-Veg": "Nicht-Vegetarisch",
  Egg: "Ei",
  Vegan: "Vegan",
  Spicy: "Scharf",
  "High Protein": "Proteinreich",
  "Quick Meal": "Schnelles Gericht",
  "One Pot": "One-Pot",
  Festival: "Festlich",
  Breakfast: "Fruhstuck",
  Lunch: "Mittagessen",
  Dinner: "Abendessen",
  Dessert: "Dessert",
};

export type RecipeIngredient = {
  id: string;
  ingredientId: string;
  canonicalName: string;
  name_en: string;
  name_de: string;
  amount: RecipeAmount;
  quantity: RecipeAmount;
  unit: string;
  preparation: string;
  optional: boolean;
  garnish: boolean;
  approximate: boolean;
  estimatedWeightGrams: number | null;
  defaultUnit: string;
  libraryId?: string | null;
  note?: string | null;
  isToTaste?: boolean;
  weightConfidence?: 'exact' | 'measured' | 'estimated' | 'unknown';
  nutritionSource?: 'ifct' | 'usda' | null;
};

export type RecipeIngredientGroup = {
  group_en: string;
  group_de: string;
  items: RecipeIngredient[];
};

export type RecipeEquipmentItem = {
  label_en: string;
  label_de: string;
  image?: string; // path relative to /public, e.g. /equipment/wok.jpg
};

/**
 * A single, structured instruction step. `steps_en`/`steps_de` on the section are
 * kept as plain-string mirrors (for search + legacy readers); `steps` is the
 * structured source of truth carrying appliance/heat/time/tools and the
 * ingredient chips used in that step (`ingredientRefs` = canonicalName keys).
 */
export type RecipeStep = {
  text_en: string;
  text_de: string;
  appliance?: string | null;            // 'cooktop'|'oven'|'blender'|'pressure-cooker'|'microwave'|'grill'
  heat?: "low" | "medium" | "high" | null;
  durationMin?: number | null;
  tools?: string[];
  ingredientRefs?: string[];            // canonicalName keys of ingredients used here
};

export type RecipeInstructionSection = {
  title_en: string;
  title_de: string;
  steps_en: string[];
  steps_de: string[];
  steps?: RecipeStep[];                 // structured steps (always present after normalize)
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
  cholesterol_mg: string;
  potassium_mg: string;
  calcium_mg: string;
  iron_mg: string;
  magnesium_mg: string;
  phosphorus_mg: string;
  zinc_mg: string;
  vitamin_a_mcg: string;
  vitamin_c_mg: string;
  vitamin_d_mcg: string;
  vitamin_e_mg: string;
  vitamin_k_mcg: string;
  vitamin_b6_mg: string;
  vitamin_b12_mcg: string;
  folate_mcg: string;
  note_en: string;
  note_de: string;
};

// Cuisine origins added in migration 20260527_nutrition_tags_diet.sql
export type CuisineOrigin =
  | "indian" | "italian" | "mexican" | "japanese" | "chinese"
  | "mediterranean" | "american" | "thai" | "french" | "other";

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
  cuisine: string | null;
  cuisine_de: string | null;
  course: string | null;
  course_de: string | null;
  difficulty: string | null;
  difficulty_de: string | null;
  prep_time: string | null;
  cook_time: string | null;
  total_time: string | null;
  tags: string[];
  badges: string[];
  ingredients: RecipeIngredientGroup[];
  instruction_sections: RecipeInstructionSection[];
  steps_en: string;
  steps_de: string | null;
  notes_en: string | null;
  notes_de: string | null;
  source_url: string | null;
  video_url: string | null;
  servings: number | null;
  equipment: RecipeEquipmentItem[];
  image_urls: string[];
  cover_image_url: string | null;
  tips_en?: string | null;
  tips_de?: string | null;
  storage_en?: string | null;
  storage_de?: string | null;
  faq?: RecipeFaqItem[];
  troubleshooting?: RecipeTroubleshootingItem[];
  step_photos?: RecipeStepPhoto[];
  nutrition?: RecipeNutritionFacts | null;
  // Phase-2 columns — added in migration 20260527_nutrition_tags_diet.sql
  origin?:          CuisineOrigin | null;
  calories?:        number | null;
  protein_g?:       number | null;
  carbs_g?:         number | null;
  fat_g?:           number | null;
  fiber_g?:         number | null;
  is_veg?:          boolean | null;
  is_vegan?:        boolean | null;
  spice_level?:     number | null; // 0–3
  is_high_protein?: boolean | null;
  prep_time_min?:   number | null;
  cook_time_min?:   number | null;
};

function normalizeString(value: unknown): string {
  // Many database fields can be missing/null/old-shaped.
  // This helper safely turns "not a string" into an empty string.
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
  const nameEn = normalizeString(raw.name_en) || legacyName;
  const amount = normalizeAmount(raw.amount);
  const quantity = normalizeAmount(raw.quantity) ?? amount;

  return {
    id: normalizeString(raw.id),
    ingredientId: normalizeString(raw.ingredientId) || normalizeString(raw.ingredient_id),
    canonicalName: normalizeString(raw.canonicalName) || normalizeString(raw.canonical_name) || nameEn.toLowerCase(),
    name_en: nameEn,
    name_de: normalizeString(raw.name_de) || legacyName || nameEn,
    amount,
    quantity,
    unit: normalizeString(raw.unit),
    preparation: normalizeString(raw.preparation),
    optional: Boolean(raw.optional),
    garnish: Boolean(raw.garnish),
    approximate: Boolean(raw.approximate),
    estimatedWeightGrams:
      typeof raw.estimatedWeightGrams === "number"
        ? raw.estimatedWeightGrams
        : typeof raw.estimated_weight_grams === "number"
          ? raw.estimated_weight_grams
          : null,
    defaultUnit: normalizeString(raw.defaultUnit) || normalizeString(raw.default_unit),
    libraryId: typeof raw.libraryId === "string" ? raw.libraryId : null,
    note: typeof raw.note === "string" ? raw.note : null,
    isToTaste: typeof raw.isToTaste === "boolean" ? raw.isToTaste : undefined,
    weightConfidence: (["exact","measured","estimated","unknown"].includes(raw.weightConfidence as string)
      ? raw.weightConfidence as 'exact' | 'measured' | 'estimated' | 'unknown'
      : undefined),
    nutritionSource: (["ifct","usda"].includes(raw.nutritionSource as string)
      ? raw.nutritionSource as 'ifct' | 'usda'
      : null),
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
    const label = value;
    const canonical = findEquipmentItem(label);
    return { label_en: label, label_de: label, image: canonical?.image };
  }

  const item = value && typeof value === "object" ? value : {};
  const raw = item as Record<string, unknown>;
  const legacyLabel = normalizeString(raw.label);
  const labelEn = normalizeString(raw.label_en) || legacyLabel;
  // Prefer the stored image, but fall back to canonical library lookup
  const storedImage = typeof raw.image === "string" ? raw.image : undefined;
  const canonical = storedImage ? undefined : findEquipmentItem(labelEn);

  return {
    label_en: labelEn,
    label_de: normalizeString(raw.label_de) || legacyLabel || labelEn,
    image: storedImage ?? canonical?.image,
  };
}

function inferEquipmentFromRecipe(raw: Record<string, unknown>, ingredients: RecipeIngredientGroup[], stepsEn: string): RecipeEquipmentItem[] {
  const textParts = [
    normalizeString(raw.title_en),
    normalizeString(raw.description_en),
    normalizeString(raw.notes_en),
    normalizeString(raw.tips_en),
    normalizeString(raw.category),
    normalizeString(raw.cuisine),
    normalizeString(raw.course),
    stepsEn,
    ingredients
      .flatMap((group) => [group.group_en, ...group.items.map((item) => `${item.amount ?? ""} ${item.unit} ${item.name_en}`)])
      .join("\n"),
  ];

  // Use the canonical equipment library matcher instead of hard-coded regexes
  return inferEquipmentFromText(textParts.join("\n")).map((item) => ({
    label_en: item.name_en,
    label_de: item.name_de,
    image: item.image,
  }));
}

function normalizeStep(value: unknown): RecipeStep {
  const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const text_en = normalizeString(raw.text_en) || normalizeString(raw.text);
  const heatRaw = normalizeString(raw.heat).toLowerCase();
  const heat = heatRaw === "low" || heatRaw === "medium" || heatRaw === "high" ? heatRaw : null;
  const durationNum = Number(raw.durationMin);
  return {
    text_en,
    text_de: normalizeString(raw.text_de) || text_en,
    appliance: normalizeString(raw.appliance) || null,
    heat,
    durationMin: Number.isFinite(durationNum) && durationNum > 0 ? Math.round(durationNum) : null,
    tools: Array.isArray(raw.tools) ? raw.tools.map((t) => normalizeString(t).trim()).filter(Boolean) : [],
    ingredientRefs: Array.isArray(raw.ingredientRefs)
      ? raw.ingredientRefs.map((r) => normalizeString(r).trim().toLowerCase()).filter(Boolean)
      : [],
  };
}

/** Build text-only structured steps from legacy string arrays (no metadata). */
function synthesizeSteps(stepsEn: string[], stepsDe: string[]): RecipeStep[] {
  return stepsEn.map((text, i) => ({
    text_en: text,
    text_de: stepsDe[i] || text,
    appliance: null,
    heat: null,
    durationMin: null,
    tools: [],
    ingredientRefs: [],
  }));
}

function normalizeInstructionSection(value: unknown): RecipeInstructionSection {
  const item = value && typeof value === "object" ? value : {};
  const raw = item as Record<string, unknown>;
  const legacyTitle = normalizeString(raw.title) || "Method";

  // `raw.steps` is ambiguous: in the new shape it's an array of step OBJECTS;
  // in old data it was sometimes a string[] alias for steps_en. Disambiguate.
  const structuredRaw =
    Array.isArray(raw.steps) && raw.steps.some((s) => s && typeof s === "object")
      ? (raw.steps as unknown[])
      : null;
  const structured = structuredRaw ? structuredRaw.map(normalizeStep).filter((s) => s.text_en) : null;

  let stepsEn = Array.isArray(raw.steps_en)
    ? raw.steps_en.map((step) => normalizeString(step).trim()).filter(Boolean)
    : !structuredRaw && Array.isArray(raw.steps)
      ? raw.steps.map((step) => normalizeString(step).trim()).filter(Boolean)
      : [];
  let stepsDe = Array.isArray(raw.steps_de)
    ? raw.steps_de.map((step) => normalizeString(step).trim()).filter(Boolean)
    : [];

  if (structured && structured.length > 0) {
    if (stepsEn.length === 0) stepsEn = structured.map((s) => s.text_en);
    if (stepsDe.length === 0) stepsDe = structured.map((s) => s.text_de);
  }

  const steps =
    structured && structured.length > 0
      ? structured
      : synthesizeSteps(stepsEn, stepsDe.length > 0 ? stepsDe : stepsEn);

  return {
    title_en: normalizeString(raw.title_en) || legacyTitle,
    title_de: normalizeString(raw.title_de) || legacyTitle,
    steps_en: stepsEn,
    steps_de: stepsDe.length > 0 ? stepsDe : stepsEn,
    steps,
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
    cholesterol_mg: normalizeString(raw.cholesterol_mg),
    potassium_mg: normalizeString(raw.potassium_mg),
    calcium_mg: normalizeString(raw.calcium_mg),
    iron_mg: normalizeString(raw.iron_mg),
    magnesium_mg: normalizeString(raw.magnesium_mg),
    phosphorus_mg: normalizeString(raw.phosphorus_mg),
    zinc_mg: normalizeString(raw.zinc_mg),
    vitamin_a_mcg: normalizeString(raw.vitamin_a_mcg),
    vitamin_c_mg: normalizeString(raw.vitamin_c_mg),
    vitamin_d_mcg: normalizeString(raw.vitamin_d_mcg),
    vitamin_e_mg: normalizeString(raw.vitamin_e_mg),
    vitamin_k_mcg: normalizeString(raw.vitamin_k_mcg),
    vitamin_b6_mg: normalizeString(raw.vitamin_b6_mg),
    vitamin_b12_mcg: normalizeString(raw.vitamin_b12_mcg),
    folate_mcg: normalizeString(raw.folate_mcg),
    note_en: normalizeString(raw.note_en),
    note_de: normalizeString(raw.note_de) || normalizeString(raw.note_en),
  };
}

function normalizeInstructionSections(raw: Record<string, unknown>, stepsEn: string, stepsDe: string | null): RecipeInstructionSection[] {
  const fromDb = Array.isArray(raw.instruction_sections) ? raw.instruction_sections.map(normalizeInstructionSection) : [];
  const hasLegacyHeadings = stepsEn.includes("## ");

  const parseLegacySections = (text: string, fallbackText: string) => {
    const lines = (text || fallbackText)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const sections: Array<{ title: string; steps: string[] }> = [];
    let currentTitle = "METHOD";
    let currentSteps: string[] = [];

    const pushSection = () => {
      if (currentSteps.length === 0) {
        return;
      }

      sections.push({
        title: currentTitle,
        steps: currentSteps,
      });
    };

    for (const line of lines) {
      if (line.startsWith("## ")) {
        pushSection();
        currentTitle = line.replace(/^##\s+/, "").trim().toUpperCase() || "METHOD";
        currentSteps = [];
        continue;
      }

      currentSteps.push(line.replace(/^\d+\.\s*/, "").trim());
    }

    pushSection();
    return sections;
  };

  if (fromDb.length > 0 && !hasLegacyHeadings) {
    return fromDb;
  }

  if (hasLegacyHeadings) {
    const englishSections = parseLegacySections(stepsEn, stepsEn);
    const germanSections = parseLegacySections(stepsDe || stepsEn, stepsEn);

    return englishSections.map((section, index) => {
      const sectionStepsDe = germanSections[index]?.steps.length ? germanSections[index].steps : section.steps;
      return {
        title_en: section.title,
        title_de: germanSections[index]?.title || section.title,
        steps_en: section.steps,
        steps_de: sectionStepsDe,
        steps: synthesizeSteps(section.steps, sectionStepsDe),
      };
    });
  }

  const englishSteps = splitRecipeSteps(stepsEn);
  const germanSteps = splitRecipeSteps(stepsDe || "");

  if (englishSteps.length === 0) {
    return [];
  }

  const methodStepsDe = germanSteps.length > 0 ? germanSteps : englishSteps;
  return [
    {
      title_en: "Method",
      title_de: "Methode",
      steps_en: englishSteps,
      steps_de: methodStepsDe,
      steps: synthesizeSteps(englishSteps, methodStepsDe),
    },
  ];
}

export function normalizeRecipe(value: unknown): RecipeRecord {
  // This is the big safety net.
  // Supabase rows, imported recipes, and old prototype rows can all be a little different.
  // normalizeRecipe turns them into one predictable RecipeRecord for the UI.
  const rawValue = value && typeof value === "object" ? value : {};
  const raw = rawValue as Record<string, unknown>;
  const titleEn = normalizeString(raw.title_en);
  const stepsEn = normalizeString(raw.steps_en);
  const stepsDe = normalizeString(raw.steps_de) || null;
  const ingredients = Array.isArray(raw.ingredients) ? raw.ingredients.map(normalizeIngredientGroup) : [];
  const normalizedEquipment = Array.isArray(raw.equipment) ? raw.equipment.map(normalizeEquipmentItem) : [];
  const imageUrls = Array.isArray(raw.image_urls)
    ? raw.image_urls.map((item) => normalizeString(item).trim()).filter(Boolean)
    : [];

  return {
    id: typeof raw.id === "number" ? raw.id : Number(raw.id ?? 0),
    slug: normalizeString(raw.slug) || slugify(titleEn) || String(raw.id ?? ""),
    user_id: normalizeString(raw.user_id),
    title_en: titleEn,
    title_de: normalizeString(raw.title_de) || null,
    author_name: normalizeString(raw.author_name) || "Atthuzhai",
    learned_from: normalizeString(raw.learned_from) || null,
    description_en: normalizeString(raw.description_en) || null,
    description_de: normalizeString(raw.description_de) || null,
    category: normalizeString(raw.category) || null,
    cuisine: normalizeString(raw.cuisine) || null,
    cuisine_de: normalizeString(raw.cuisine_de) || normalizeString(raw.cuisine) || null,
    course: normalizeString(raw.course) || null,
    course_de: normalizeString(raw.course_de) || normalizeString(raw.course) || null,
    difficulty: normalizeString(raw.difficulty) || null,
    difficulty_de: normalizeString(raw.difficulty_de) || normalizeString(raw.difficulty) || null,
    prep_time: normalizeString(raw.prep_time) || null,
    cook_time: normalizeString(raw.cook_time) || null,
    total_time: normalizeString(raw.total_time) || null,
    tags: Array.isArray(raw.tags)
      ? [...new Set(raw.tags.map((tag) => normalizeString(tag).trim()).filter(Boolean))]
      : [],
    badges: Array.isArray(raw.badges)
      ? [...new Set(raw.badges.map((badge) => normalizeString(badge).trim()).filter(Boolean))]
      : [],
    ingredients,
    instruction_sections: normalizeInstructionSections(raw, stepsEn, stepsDe),
    steps_en: stepsEn,
    steps_de: stepsDe,
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
    equipment: normalizedEquipment.length > 0 ? normalizedEquipment : inferEquipmentFromRecipe(raw, ingredients, stepsEn),
    image_urls: imageUrls,
    cover_image_url: normalizeString(raw.cover_image_url) || imageUrls[0] || null,
    tips_en: normalizeString(raw.tips_en) || null,
    tips_de: normalizeString(raw.tips_de) || null,
    storage_en: normalizeString(raw.storage_en) || null,
    storage_de: normalizeString(raw.storage_de) || null,
    faq: Array.isArray(raw.faq) ? raw.faq.map(normalizeFaqItem) : [],
    troubleshooting: Array.isArray(raw.troubleshooting) ? raw.troubleshooting.map(normalizeTroubleshootingItem) : [],
    step_photos: Array.isArray(raw.step_photos) ? raw.step_photos.map(normalizeStepPhoto) : [],
    nutrition: normalizeNutrition(raw.nutrition),
    // Phase-2 columns — present only after migration 20260527_nutrition_tags_diet.sql
    origin: (typeof raw.origin === "string" ? raw.origin : null) as CuisineOrigin | null,
    calories:        typeof raw.calories        === "number" ? raw.calories        : null,
    protein_g:       typeof raw.protein_g       === "number" ? raw.protein_g       : null,
    carbs_g:         typeof raw.carbs_g         === "number" ? raw.carbs_g         : null,
    fat_g:           typeof raw.fat_g           === "number" ? raw.fat_g           : null,
    fiber_g:         typeof raw.fiber_g         === "number" ? raw.fiber_g         : null,
    is_veg:          typeof raw.is_veg          === "boolean" ? raw.is_veg          : null,
    is_vegan:        typeof raw.is_vegan        === "boolean" ? raw.is_vegan        : null,
    spice_level:     typeof raw.spice_level     === "number" ? raw.spice_level     : null,
    is_high_protein: typeof raw.is_high_protein === "boolean" ? raw.is_high_protein : null,
    prep_time_min:   typeof raw.prep_time_min   === "number" ? raw.prep_time_min   : null,
    cook_time_min:   typeof raw.cook_time_min   === "number" ? raw.cook_time_min   : null,
  };
}

// These helpers keep the React pages simple: the page asks for "the title in the current language"
// instead of re-implementing fallback logic everywhere.
/**
 * Strips trailing SEO/blog cruft from a recipe title for display, e.g.
 * "Egg Masala Recipe | Egg Masala Gravy | Egg Recipe" → "Egg Masala Recipe".
 * Splits on a pipe or en/em-dash that is followed by whitespace, so genuine
 * hyphenated ("Idli-Rava") or non-spaced titles stay intact. Non-destructive:
 * only the displayed value is cleaned — the stored title_en/title_de are kept,
 * so the edit form still shows (and can correct) the original.
 */
export function cleanRecipeTitle(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.split(/\s*[|–—]\s+/)[0].trim() || raw.trim();
}

export function getRecipeTitle(recipe: RecipeRecord, lang: AppLanguage): string {
  if (lang === "de" && recipe.title_de) {
    return cleanRecipeTitle(recipe.title_de);
  }

  return cleanRecipeTitle(recipe.title_en);
}

export function getRecipeDescription(recipe: RecipeRecord, lang: AppLanguage): string {
  if (lang === "de" && recipe.description_de) {
    return recipe.description_de;
  }

  return recipe.description_en || "";
}

export function getLocalizedLabel(englishValue: string | null | undefined, germanValue: string | null | undefined, lang: AppLanguage): string {
  if (lang === "de" && germanValue) {
    return germanValue;
  }

  return englishValue || "";
}

export function getRecipeCuisine(recipe: RecipeRecord, lang: AppLanguage): string {
  return getLocalizedLabel(recipe.cuisine, recipe.cuisine_de, lang);
}

export function getRecipeCourse(recipe: RecipeRecord, lang: AppLanguage): string {
  return getLocalizedLabel(recipe.course, recipe.course_de, lang);
}

export function getRecipeDifficulty(recipe: RecipeRecord, lang: AppLanguage): string {
  return getLocalizedLabel(recipe.difficulty, recipe.difficulty_de, lang);
}

export function getBadgeLabel(badge: string, lang: AppLanguage): string {
  if (lang === "en") {
    return badge;
  }

  if ((badge as keyof typeof BADGE_LABELS_DE) in BADGE_LABELS_DE) {
    return BADGE_LABELS_DE[badge as keyof typeof BADGE_LABELS_DE];
  }

  if (badge.startsWith("Good ")) {
    return `Gute Quelle fur ${badge.replace(/^Good\s+/, "")}`;
  }

  if (badge.startsWith("Excellent ")) {
    return `Sehr gute Quelle fur ${badge.replace(/^Excellent\s+/, "")}`;
  }

  return badge;
}

export function getBadgeEmoji(badge: string): string {
  if (badge.includes("Excellent Protein")) return "🏋️";
  if (badge.includes("Good Protein")) return "💪";
  if (badge.includes("Excellent Fiber")) return "🌾";
  if (badge.includes("Good Fiber")) return "🌿";
  if (badge.includes("Excellent Calcium")) return "🥛";
  if (badge.includes("Good Calcium")) return "🦴";
  if (badge.includes("Excellent Iron")) return "🧲";
  if (badge.includes("Good Iron")) return "🫘";
  if (badge.includes("Excellent Potassium")) return "🍌";
  if (badge.includes("Good Potassium")) return "🥔";
  if (badge.includes("Excellent Vitamin D")) return "☀️";
  if (badge.includes("Good Vitamin D")) return "🌤️";
  if (badge.includes("Vegan")) return "🌱";
  if (badge.includes("Non-Veg")) return "🍗";
  if (badge.includes("Egg")) return "🥚";
  if (badge.includes("Veg")) return "🌿";
  if (badge.includes("Spicy")) return "🌶️";
  if (badge.includes("High Protein")) return "💪";
  if (badge.includes("Quick Meal")) return "⚡";
  if (badge.includes("One Pot")) return "🍲";
  if (badge.includes("Festival")) return "🎉";
  if (badge.includes("Breakfast")) return "🍳";
  if (badge.includes("Lunch")) return "🍛";
  if (badge.includes("Dinner")) return "🍽️";
  if (badge.includes("Dessert")) return "🍰";
  return "🏷️";
}

export function getBadgeIcon(badge: string):
  | "vegan"
  | "nonveg"
  | "egg"
  | "veg"
  | "spicy"
  | "protein"
  | "quick"
  | "onepot"
  | "festival"
  | "breakfast"
  | "lunch"
  | "dinner"
  | "dessert"
  | "good"
  | "excellent"
  | "tag" {
  if (badge.includes("Vegan")) return "vegan";
  if (badge.includes("Non-Veg")) return "nonveg";
  if (badge.includes("Egg")) return "egg";
  if (badge.includes("Veg")) return "veg";
  if (badge.includes("Spicy")) return "spicy";
  if (badge.includes("High Protein")) return "protein";
  if (badge.includes("Quick Meal")) return "quick";
  if (badge.includes("One Pot")) return "onepot";
  if (badge.includes("Festival")) return "festival";
  if (badge.includes("Breakfast")) return "breakfast";
  if (badge.includes("Lunch")) return "lunch";
  if (badge.includes("Dinner")) return "dinner";
  if (badge.includes("Dessert")) return "dessert";
  if (badge.includes("Good")) return "good";
  if (badge.includes("Excellent")) return "excellent";

  return "tag";
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

export function getInstructionSections(recipe: RecipeRecord, lang: AppLanguage): Array<{ title: string; steps: string[] }> {
  if (recipe.instruction_sections.length > 0) {
    return recipe.instruction_sections
      .map((section) => ({
        title: lang === "de" ? section.title_de || section.title_en : section.title_en,
        steps: lang === "de" ? (section.steps_de.length > 0 ? section.steps_de : section.steps_en) : section.steps_en,
      }))
      .filter((section) => section.steps.length > 0);
  }

  return [];
}

/** A language-resolved structured step for rendering (chips + cues). */
export type ResolvedStep = {
  text: string;
  appliance: string | null;
  heat: "low" | "medium" | "high" | null;
  durationMin: number | null;
  tools: string[];
  ingredientRefs: string[];
};

export function getInstructionStepSections(
  recipe: RecipeRecord,
  lang: AppLanguage,
): Array<{ title: string; steps: ResolvedStep[] }> {
  if (recipe.instruction_sections.length === 0) return [];
  return recipe.instruction_sections
    .map((section) => {
      const title = lang === "de" ? section.title_de || section.title_en : section.title_en;
      const stringSteps = lang === "de" ? (section.steps_de.length > 0 ? section.steps_de : section.steps_en) : section.steps_en;
      const structured = section.steps && section.steps.length > 0 ? section.steps : null;
      const steps: ResolvedStep[] = structured
        ? structured.map((s) => ({
            text: lang === "de" ? s.text_de || s.text_en : s.text_en,
            appliance: s.appliance ?? null,
            heat: s.heat ?? null,
            durationMin: s.durationMin ?? null,
            tools: s.tools ?? [],
            ingredientRefs: s.ingredientRefs ?? [],
          }))
        : stringSteps.map((t) => ({ text: t, appliance: null, heat: null, durationMin: null, tools: [], ingredientRefs: [] }));
      return { title, steps };
    })
    .filter((section) => section.steps.length > 0);
}

export function splitRecipeSteps(text: string): string[] {
  return text
    .split("\n")
    .map((step) => step.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
}

export function serializeInstructionSections(
  sections: Array<{
    title_en: string;
    title_de: string;
    steps_en: string[];
    steps_de: string[];
  }>,
  lang: AppLanguage
): string {
  return sections
    .flatMap((section, index) => {
      const title = lang === "de" ? section.title_de || section.title_en : section.title_en;
      const steps = lang === "de" ? (section.steps_de.length > 0 ? section.steps_de : section.steps_en) : section.steps_en;

      return [
        ...(title && sections.length > 1 ? [`## ${title}`] : []),
        ...steps.map((step, stepIndex) => `${stepIndex + 1}. ${step}`),
        ...(index < sections.length - 1 ? [""] : []),
      ];
    })
    .join("\n")
    .trim();
}

// Route params arrive as strings from the URL. This helper safely converts them into numeric ids.
export function parseRecipeId(value: string | string[] | undefined): number | null {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = Number(rawValue);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

// Tags and badges are stored as arrays in the database, but users often edit them as comma-separated text.
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
  preparation?: string;
  note?: string;
  optional?: boolean;
  garnish?: boolean;
  approximate?: boolean;
  libraryId?: string | null;
};

export const EMPTY_INGREDIENT: IngredientDraft = {
  name_en: "",
  name_de: "",
  amount: "",
  unit: "",
  preparation: "",
  note: "",
  optional: false,
  garnish: false,
  approximate: false,
  libraryId: null,
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
  image?: string; // path relative to /public, e.g. /equipment/wok.jpg
};

export const EMPTY_EQUIPMENT: EquipmentDraft = {
  label_en: "",
  label_de: "",
};

/** A single structured step in the create/edit form. durationMin is a string for input friendliness. */
export type InstructionStepDraft = {
  text_en: string;
  text_de: string;
  appliance: string;        // "" = none
  heat: string;             // "" | "low" | "medium" | "high"
  durationMin: string;      // "" or a number as text
  tools: string[];
  ingredientRefs: string[]; // canonicalName keys
};

export const EMPTY_INSTRUCTION_STEP: InstructionStepDraft = {
  text_en: "",
  text_de: "",
  appliance: "",
  heat: "",
  durationMin: "",
  tools: [],
  ingredientRefs: [],
};

export type InstructionSectionDraft = {
  title_en: string;
  title_de: string;
  steps_en: string;
  steps_de: string;
  /** Structured per-step drafts. When present (and non-empty) they win over the
   *  multiline steps_en/steps_de strings in buildInstructionSectionPayload. */
  steps?: InstructionStepDraft[];
};

export const EMPTY_INSTRUCTION_SECTION: InstructionSectionDraft = {
  title_en: "Method",
  title_de: "Methode",
  steps_en: "",
  steps_de: "",
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
  cholesterol_mg: string;
  potassium_mg: string;
  calcium_mg: string;
  iron_mg: string;
  magnesium_mg: string;
  phosphorus_mg: string;
  zinc_mg: string;
  vitamin_a_mcg: string;
  vitamin_c_mg: string;
  vitamin_d_mcg: string;
  vitamin_e_mg: string;
  vitamin_k_mcg: string;
  vitamin_b6_mg: string;
  vitamin_b12_mcg: string;
  folate_mcg: string;
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
  cholesterol_mg: "",
  potassium_mg: "",
  calcium_mg: "",
  iron_mg: "",
  magnesium_mg: "",
  phosphorus_mg: "",
  zinc_mg: "",
  vitamin_a_mcg: "",
  vitamin_c_mg: "",
  vitamin_d_mcg: "",
  vitamin_e_mg: "",
  vitamin_k_mcg: "",
  vitamin_b6_mg: "",
  vitamin_b12_mcg: "",
  folate_mcg: "",
  note_en: "",
  note_de: "",
};
