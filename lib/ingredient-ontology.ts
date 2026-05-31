import type { NutritionDraft, RecipeIngredient, RecipeNutritionFacts } from "@/lib/recipe-types";

export type MeasurementUnit =
  | "g"
  | "kg"
  | "ml"
  | "l"
  | "tsp"
  | "tbsp"
  | "cup"
  | "pinch"
  | "dash"
  | "handful"
  | "sprig"
  | "leaf"
  | "clove"
  | "piece"
  | "bunch"
  | "to taste";

export type IngredientEntity = {
  id: string;
  canonicalName: string;
  aliases: string[];
  density: number;
  ediblePortion: number;
  nutritionPer100g: Partial<Record<Exclude<keyof RecipeNutritionFacts, "note_en" | "note_de">, number>>;
  defaultUnit: MeasurementUnit;
  category: "vegetable" | "fruit" | "grain" | "legume" | "dairy" | "protein" | "fat" | "spice" | "herb" | "sweetener" | "liquid" | "other";
};

export type RecipeIngredientOntology = {
  ingredientId: string;
  quantity: number | null;
  unit: MeasurementUnit | string;
  preparation: string;
  optional: boolean;
  garnish: boolean;
  approximate: boolean;
  estimatedWeightGrams: number;
};

export type CookingAdjustment = {
  cookingLossPercent: number;
  evaporationPercent: number;
  oilAbsorptionPercent: number;
};

const ZERO_NUTRITION = {
  calories_kcal: 0,
  fat_g: 0,
  saturated_fat_g: 0,
  carbs_g: 0,
  fiber_g: 0,
  sugar_g: 0,
  protein_g: 0,
  sodium_mg: 0,
  cholesterol_mg: 0,
  potassium_mg: 0,
  calcium_mg: 0,
  iron_mg: 0,
  magnesium_mg: 0,
  phosphorus_mg: 0,
  zinc_mg: 0,
  vitamin_a_mcg: 0,
  vitamin_c_mg: 0,
  vitamin_d_mcg: 0,
  vitamin_e_mg: 0,
  vitamin_k_mcg: 0,
  vitamin_b6_mg: 0,
  vitamin_b12_mcg: 0,
  folate_mcg: 0,
} satisfies Record<Exclude<keyof RecipeNutritionFacts, "note_en" | "note_de">, number>;

export const INGREDIENT_DATABASE: IngredientEntity[] = [
  ingredient("salt", ["sea salt", "kosher salt"], "spice", "pinch", 1.2, { sodium_mg: 38758 }),
  ingredient("turmeric", ["turmeric powder", "haldi"], "spice", "tsp", 0.65, { calories_kcal: 312, carbs_g: 67, protein_g: 9.7, fat_g: 3.3, fiber_g: 22.7, iron_mg: 55 }),
  ingredient("coriander leaves", ["cilantro", "cilantro leaves"], "herb", "handful", 0.35, { calories_kcal: 23, carbs_g: 3.7, protein_g: 2.1, fat_g: 0.5, fiber_g: 2.8, potassium_mg: 521, vitamin_c_mg: 27, vitamin_k_mcg: 310 }),
  ingredient("garlic", ["garlic clove"], "vegetable", "clove", 1, { calories_kcal: 149, carbs_g: 33, protein_g: 6.4, fat_g: 0.5, fiber_g: 2.1, calcium_mg: 181, vitamin_c_mg: 31 }),
  ingredient("vegetable oil", ["oil", "sunflower oil", "neutral oil"], "fat", "tbsp", 0.92, { calories_kcal: 884, fat_g: 100, saturated_fat_g: 14, vitamin_e_mg: 14.4 }),
  ingredient("ghee", ["clarified butter"], "fat", "tbsp", 0.91, { calories_kcal: 900, fat_g: 100, saturated_fat_g: 60, cholesterol_mg: 256, vitamin_a_mcg: 840 }),
  ingredient("sugar", ["powdered sugar", "sugar powder"], "sweetener", "tsp", 0.85, { calories_kcal: 387, carbs_g: 100, sugar_g: 100 }),
  ingredient("rice", ["basmati rice", "raw rice"], "grain", "cup", 0.77, { calories_kcal: 365, carbs_g: 80, protein_g: 7.1, fat_g: 0.7, fiber_g: 1.3 }),
  ingredient("onion", ["onions"], "vegetable", "piece", 0.94, { calories_kcal: 40, carbs_g: 9.3, sugar_g: 4.2, fiber_g: 1.7, protein_g: 1.1 }),
  ingredient("tomato", ["tomatoes"], "vegetable", "piece", 0.95, { calories_kcal: 18, carbs_g: 3.9, sugar_g: 2.6, fiber_g: 1.2, protein_g: 0.9, potassium_mg: 237, vitamin_c_mg: 13.7 }),
];

function ingredient(
  canonicalName: string,
  aliases: string[],
  category: IngredientEntity["category"],
  defaultUnit: MeasurementUnit,
  density: number,
  nutritionPer100g: IngredientEntity["nutritionPer100g"]
): IngredientEntity {
  return {
    id: canonicalName.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase(),
    canonicalName,
    aliases,
    density,
    ediblePortion: 1,
    nutritionPer100g,
    defaultUnit,
    category,
  };
}

const UNIT_ALIASES: Record<string, MeasurementUnit | string> = {
  gram: "g",
  grams: "g",
  gm: "g",
  gms: "g",
  kilogram: "kg",
  kilograms: "kg",
  liter: "l",
  litre: "l",
  liters: "l",
  litres: "l",
  teaspoon: "tsp",
  teaspoons: "tsp",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  cups: "cup",
  pinches: "pinch",
  dashes: "dash",
  handfuls: "handful",
  sprigs: "sprig",
  leaves: "leaf",
  cloves: "clove",
  pieces: "piece",
  bunches: "bunch",
  "to-taste": "to taste",
  // new plural/variant aliases
  heads: "head",
  stalks: "stalk",
  inches: "inch",
  sticks: "stick",
  sheets: "sheet",
  "no.": "no.",
  no: "no.",
  nos: "no.",
};

const GENERIC_GRAMS: Record<string, number> = {
  g: 1,
  kg: 1000,
  ml: 1,
  l: 1000,
  tsp: 5,
  tbsp: 15,
  cup: 240,
  pinch: 0.36,
  dash: 0.6,
  handful: 18,
  sprig: 2,
  leaf: 0.5,
  clove: 3,
  piece: 50,
  whole: 100,
  "no.": 100,
  bunch: 30,
  head: 300,
  stalk: 30,
  inch: 5,
  stick: 5,
  sheet: 15,
};

export function normalizeUnit(unit: string): MeasurementUnit | string {
  const normalized = unit.trim().toLowerCase().replace(/\.$/, "").replace(/\s+/g, "-");
  return UNIT_ALIASES[normalized] ?? normalized.replace(/-/g, " ");
}

export function parseQuantity(value: string | number | null | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const text = String(value ?? "")
    .trim()
    .replace(/\u00bc/g, "1/4")
    .replace(/\u00bd/g, "1/2")
    .replace(/\u00be/g, "3/4");

  if (!text || /to taste|as needed|optional/i.test(text)) {
    return null;
  }

  const direct = Number(text);
  if (Number.isFinite(direct)) return direct;

  const mixed = text.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);

  const fraction = text.match(/^(\d+)\/(\d+)$/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);

  const range = text.match(/^(\d+(?:\.\d+)?)\s*[-\u2013]\s*(\d+(?:\.\d+)?)/);
  if (range) return (Number(range[1]) + Number(range[2])) / 2;

  return null;
}

export function resolveIngredientEntity(name: string): IngredientEntity | null {
  const normalized = name.toLowerCase();
  return (
    INGREDIENT_DATABASE.find((item) => item.canonicalName === normalized || item.aliases.some((alias) => normalized.includes(alias))) ??
    INGREDIENT_DATABASE.find((item) => normalized.includes(item.canonicalName)) ??
    null
  );
}

export function estimateIngredientWeightGrams(ingredient: RecipeIngredient): number {
  const quantity = parseQuantity(ingredient.quantity ?? ingredient.amount);
  const unit = normalizeUnit(ingredient.unit || ingredient.defaultUnit || "");
  const entity = resolveIngredientEntity(ingredient.canonicalName || ingredient.name_en);
  // Only treat as "to taste" when the unit or amount field itself says so — not when the ingredient name has a parenthetical note like "(as needed)"
  const isToTaste = /to taste|as needed/i.test(`${ingredient.amount ?? ""} ${ingredient.unit ?? ""}`)
    || /^(to taste|as needed)$/i.test((ingredient.name_en ?? "").trim());

  if (isToTaste || ingredient.optional) {
    return ingredient.garnish ? 0.25 : 0.5;
  }

  const effectiveQuantity = quantity ?? 1;
  const specific = ingredientSpecificUnitGrams(entity?.canonicalName ?? ingredient.name_en, unit);
  const base = specific ?? GENERIC_GRAMS[unit] ?? GENERIC_GRAMS[entity?.defaultUnit ?? "piece"] ?? 100;
  const edible = entity?.ediblePortion ?? 1;
  const density = unit === "ml" || unit === "l" ? entity?.density ?? 1 : 1;
  const garnishFactor = ingredient.garnish ? 0.25 : 1;

  return Number((effectiveQuantity * base * edible * density * garnishFactor).toFixed(2));
}

function ingredientSpecificUnitGrams(name: string, unit: string): number | null {
  if (unit === "leaf" && /coriander|cilantro/.test(name)) return 0.12;
  if (unit === "handful" && /coriander|cilantro|herb/.test(name)) return 8;
  if (unit === "pinch" && /salt/.test(name)) return 0.36;
  if (unit === "tsp" && /salt/.test(name)) return 6;
  if (unit === "cup" && /rice/.test(name)) return 185;
  if (unit === "piece" && /onion/.test(name)) return 110;
  if (unit === "piece" && /tomato/.test(name)) return 120;

  // Per-count (no.) weights for common items — overrides the generic 100g default
  if (unit === "no.") {
    if (/chilli|chili|green chilli|red chilli/.test(name)) return 12;
    if (/tomato/.test(name)) return 120;
    if (/onion/.test(name)) return 110;
    if (/potato/.test(name)) return 170;
    if (/egg/.test(name)) return 55;
    if (/lemon/.test(name)) return 100;
    if (/lime/.test(name)) return 67;
    if (/garlic clove|garlic/.test(name)) return 5;
    if (/cardamom/.test(name)) return 0.8;
    if (/clove/.test(name)) return 0.3;
    if (/curry leaf|curry leave/.test(name)) return 0.5;
    if (/bay leaf|bay leave/.test(name)) return 0.5;
    if (/banana/.test(name)) return 120;
    if (/apple/.test(name)) return 180;
    if (/orange/.test(name)) return 180;
    if (/carrot/.test(name)) return 80;
    if (/cucumber/.test(name)) return 300;
    if (/bell pepper|capsicum/.test(name)) return 160;
  }
  return null;
}

export function normalizeRecipeIngredientOntology(ingredient: RecipeIngredient): RecipeIngredientOntology {
  const entity = resolveIngredientEntity(ingredient.canonicalName || ingredient.name_en);
  const quantity = parseQuantity(ingredient.quantity ?? ingredient.amount);
  const unit = normalizeUnit(ingredient.unit || entity?.defaultUnit || "piece");
  const estimatedWeightGrams = ingredient.estimatedWeightGrams ?? estimateIngredientWeightGrams(ingredient);

  return {
    ingredientId: ingredient.ingredientId || entity?.id || `custom-${ingredient.name_en.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    quantity,
    unit,
    preparation: ingredient.preparation || "",
    optional: Boolean(ingredient.optional),
    garnish: Boolean(ingredient.garnish),
    approximate: Boolean(ingredient.approximate || quantity === null),
    estimatedWeightGrams,
  };
}

export function applyCookingAdjustments(grams: number, ingredient: RecipeIngredient, adjustment: CookingAdjustment): number {
  const name = ingredient.name_en.toLowerCase();
  const unit = normalizeUnit(ingredient.unit);
  let adjusted = grams;

  if (/oil/.test(name) && /fry|frying/.test(`${ingredient.preparation} ${ingredient.unit} ${ingredient.name_en}`.toLowerCase())) {
    adjusted *= adjustment.oilAbsorptionPercent / 100;
  }

  if (unit === "ml" || unit === "l" || /water|stock/.test(name)) {
    adjusted *= Math.max(0, 1 - adjustment.evaporationPercent / 100);
  }

  return Number((adjusted * Math.max(0, 1 - adjustment.cookingLossPercent / 100)).toFixed(2));
}

export function aggregateLocalNutrition(ingredients: RecipeIngredient[], servings: number): NutritionDraft {
  const totals = { ...ZERO_NUTRITION };

  for (const recipeIngredient of ingredients) {
    const entity = resolveIngredientEntity(recipeIngredient.canonicalName || recipeIngredient.name_en);
    if (!entity) continue;

    const grams = estimateIngredientWeightGrams(recipeIngredient);
    for (const key of Object.keys(totals) as Array<keyof typeof totals>) {
      totals[key] += ((entity.nutritionPer100g[key] ?? 0) * grams) / 100;
    }
  }

  const safeServings = servings > 0 ? servings : 1;
  const format = (value: number) => (value > 0 ? Number((value / safeServings).toFixed(2)).toString() : "");

  return {
    calories_kcal: format(totals.calories_kcal),
    fat_g: format(totals.fat_g),
    saturated_fat_g: format(totals.saturated_fat_g),
    carbs_g: format(totals.carbs_g),
    fiber_g: format(totals.fiber_g),
    sugar_g: format(totals.sugar_g),
    protein_g: format(totals.protein_g),
    sodium_mg: format(totals.sodium_mg),
    cholesterol_mg: format(totals.cholesterol_mg),
    potassium_mg: format(totals.potassium_mg),
    calcium_mg: format(totals.calcium_mg),
    iron_mg: format(totals.iron_mg),
    magnesium_mg: format(totals.magnesium_mg),
    phosphorus_mg: format(totals.phosphorus_mg),
    zinc_mg: format(totals.zinc_mg),
    vitamin_a_mcg: format(totals.vitamin_a_mcg),
    vitamin_c_mg: format(totals.vitamin_c_mg),
    vitamin_d_mcg: format(totals.vitamin_d_mcg),
    vitamin_e_mg: format(totals.vitamin_e_mg),
    vitamin_k_mcg: format(totals.vitamin_k_mcg),
    vitamin_b6_mg: format(totals.vitamin_b6_mg),
    vitamin_b12_mcg: format(totals.vitamin_b12_mcg),
    folate_mcg: format(totals.folate_mcg),
    note_en: "Estimated from the local normalized ingredient database. USDA, Open Food Facts, EFSA, and regional datasets can enrich this ontology over time.",
    note_de: "Geschaetzt aus der lokalen normalisierten Zutatendatenbank. USDA, Open Food Facts, EFSA und regionale Datensaetze koennen diese Ontologie erweitern.",
  };
}

export function calculateHealthScore(nutrition: RecipeNutritionFacts | null): number | null {
  if (!nutrition) return null;

  const numberValue = (value: string) => {
    const parsed = Number(value.replace(",", ".").replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const protein = numberValue(nutrition.protein_g);
  const fiber = numberValue(nutrition.fiber_g);
  const sodium = numberValue(nutrition.sodium_mg);
  const saturatedFat = numberValue(nutrition.saturated_fat_g);
  const sugar = numberValue(nutrition.sugar_g);

  const positive = Math.min(35, protein * 2) + Math.min(30, fiber * 5);
  const penalties = Math.min(20, sodium / 115) + Math.min(15, saturatedFat * 2) + Math.min(15, sugar);
  return Math.max(0, Math.min(100, Math.round(55 + positive - penalties)));
}
