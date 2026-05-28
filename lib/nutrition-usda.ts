import type { IngredientGroupDraft, NutritionDraft } from "@/lib/recipe-types";
import { estimateIngredientWeightGrams } from "@/lib/ingredient-ontology";

// USDA NUTRITION MAP
// This file estimates nutrition by searching the USDA FoodData Central API for each ingredient.
// It is an estimate, not medical/legal nutrition labeling.
// If USDA matching is weird, look at normalizeIngredientName(), searchFood(), and resolveGramWeight().

const SEARCH_ENDPOINT = "https://api.nal.usda.gov/fdc/v1/foods/search";

type FoodSearchResult = {
  fdcId: number;
  description?: string;
  foodNutrients?: FoodNutrient[];
  foodMeasures?: FoodMeasure[];
  servingSize?: number;
  servingSizeUnit?: string;
  dataType?: string;
  score?: number;
  source?: "usda" | "local";
};

type FoodMeasure = {
  gramWeight?: number;
  disseminationText?: string;
  modifier?: string;
  measureUnitName?: string;
  measureUnit?: {
    name?: string;
  };
};

type FoodNutrient = {
  nutrient?: {
    name?: string;
    number?: string;
  };
  nutrientName?: string;
  nutrientNumber?: string;
  amount?: number;
  value?: number;
  unitName?: string;
};

type FoodSearchResponse = {
  foods?: FoodSearchResult[];
};

export type NutritionEstimateMeta = {
  ingredientCount: number;
  matchedIngredients: number;
  localFallbackIngredients: number;
  unmatchedIngredients: string[];
  confidence: "high" | "medium" | "low";
};

export type NutritionEstimateResult = {
  nutrition: NutritionDraft;
  meta: NutritionEstimateMeta;
};

const NUTRIENT_NAME_MAP = {
  calories_kcal: ["Energy", "Energy (Atwater General Factors)"],
  fat_g: ["Total lipid (fat)"],
  saturated_fat_g: ["Fatty acids, total saturated"],
  carbs_g: ["Carbohydrate, by difference"],
  fiber_g: ["Fiber, total dietary"],
  sugar_g: ["Sugars, total including NLEA"],
  protein_g: ["Protein"],
  sodium_mg: ["Sodium, Na"],
  cholesterol_mg: ["Cholesterol"],
  potassium_mg: ["Potassium, K"],
  calcium_mg: ["Calcium, Ca"],
  iron_mg: ["Iron, Fe"],
  magnesium_mg: ["Magnesium, Mg"],
  phosphorus_mg: ["Phosphorus, P"],
  zinc_mg: ["Zinc, Zn"],
  vitamin_a_mcg: ["Vitamin A, RAE"],
  vitamin_c_mg: ["Vitamin C, total ascorbic acid"],
  vitamin_d_mcg: ["Vitamin D (D2 + D3), International Units", "Vitamin D (D2 + D3)"],
  vitamin_e_mg: ["Vitamin E (alpha-tocopherol)"],
  vitamin_k_mcg: ["Vitamin K (phylloquinone)"],
  vitamin_b6_mg: ["Vitamin B-6"],
  vitamin_b12_mcg: ["Vitamin B-12"],
  folate_mcg: ["Folate, total"],
} satisfies Record<Exclude<keyof NutritionDraft, "note_en" | "note_de">, string[]>;

const NUTRIENT_NUMBER_MAP = {
  calories_kcal: ["208", "1008"],
  fat_g: ["204", "1004"],
  saturated_fat_g: ["606", "1258"],
  carbs_g: ["205", "1005"],
  fiber_g: ["291", "1079"],
  sugar_g: ["269", "2000"],
  protein_g: ["203", "1003"],
  sodium_mg: ["307", "1093"],
  cholesterol_mg: ["601", "1253"],
  potassium_mg: ["306", "1092"],
  calcium_mg: ["301", "1087"],
  iron_mg: ["303", "1089"],
  magnesium_mg: ["304", "1090"],
  phosphorus_mg: ["305", "1091"],
  zinc_mg: ["309", "1095"],
  vitamin_a_mcg: ["320", "1106"],
  vitamin_c_mg: ["401", "1162"],
  vitamin_d_mcg: ["324", "328", "1114"],
  vitamin_e_mg: ["323", "1109"],
  vitamin_k_mcg: ["430", "1185"],
  vitamin_b6_mg: ["415", "1175"],
  vitamin_b12_mcg: ["418", "1178"],
  folate_mcg: ["417", "1177"],
} satisfies Record<Exclude<keyof NutritionDraft, "note_en" | "note_de">, string[]>;

const LOCAL_NUTRIENT_NUMBERS = {
  calories_kcal: "208",
  fat_g: "204",
  saturated_fat_g: "606",
  carbs_g: "205",
  fiber_g: "291",
  sugar_g: "269",
  protein_g: "203",
  sodium_mg: "307",
  cholesterol_mg: "601",
  potassium_mg: "306",
  calcium_mg: "301",
  iron_mg: "303",
  magnesium_mg: "304",
  phosphorus_mg: "305",
  zinc_mg: "309",
  vitamin_a_mcg: "320",
  vitamin_c_mg: "401",
  vitamin_d_mcg: "328",
  vitamin_e_mg: "323",
  vitamin_k_mcg: "430",
  vitamin_b6_mg: "415",
  vitamin_b12_mcg: "418",
  folate_mcg: "417",
} satisfies Record<Exclude<keyof NutritionDraft, "note_en" | "note_de">, string>;

const GENERIC_UNIT_TO_GRAMS: Record<string, number> = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  tsp: 5,
  teaspoon: 5,
  teaspoons: 5,
  tbsp: 15,
  tablespoon: 15,
  tablespoons: 15,
  cup: 240,
  cups: 240,
  ml: 1,
  l: 1000,
  oz: 28.35,
  lb: 453.59,
  lbs: 453.59,
  pound: 453.59,
  pounds: 453.59,
  pinch: 0.35,
  dash: 0.6,
  handful: 18,
  handfuls: 18,
  sprig: 2,
  sprigs: 2,
  leaf: 0.5,
  leaves: 0.5,
  clove: 3,
  cloves: 3,
  bunch: 30,
  bunches: 30,
  slice: 28,
  slices: 28,
  piece: 50,
  pieces: 50,
  whole: 100,
  // produce structure
  head: 300,
  heads: 300,
  stalk: 30,
  stalks: 30,
  inch: 5,
  inches: 5,
  stick: 5,
  sticks: 5,
  // sheet (lasagne, nori, filo)
  sheet: 15,
  sheets: 15,
};

const foodSearchCache = new Map<string, FoodSearchResult | null>();

const UNIT_ALIASES: Record<string, string> = {
  t: "tsp",
  tsps: "tsp",
  tspn: "tsp",
  tbl: "tbsp",
  tbs: "tbsp",
  tblsp: "tbsp",
  tbspn: "tbsp",
  tablespoonful: "tbsp",
  c: "cup",
  gm: "g",
  gms: "g",
  gramme: "g",
  kilogram: "kg",
  kilograms: "kg",
  ounce: "oz",
  ounces: "oz",
  no: "whole",
  "no.": "whole",
  nos: "whole",
  number: "whole",
  numbers: "whole",
};

const QUERY_ALIASES: Array<[RegExp, string]> = [
  [/\btoor dal\b|\btuvar dal\b|\bthuvaram paruppu\b|\barhar dal\b/i, "pigeon peas"],
  [/\bmoong dal\b|\bgreen gram\b|\bpaasi paruppu\b/i, "mung beans"],
  [/\burad dal\b|\bulutham paruppu\b/i, "black gram"],
  [/\bchana dal\b|\bkadalai paruppu\b/i, "chickpeas"],
  [/\bbesan\b|\bgram flour\b/i, "chickpea flour"],
  [/\bbrinjal\b|\baubergine\b/i, "eggplant"],
  [/\bcurd\b/i, "plain yogurt"],
  [/\bcoriander leaves\b|\bcilantro leaves\b/i, "cilantro"],
  [/\bcapsicum\b/i, "bell pepper"],
  [/\bjaggery\b/i, "sugar"],
  [/\bpoha\b|\baval\b/i, "rice flakes"],
  [/\bridava\b|\brava\b|\bsooji\b|\bsuji\b/i, "semolina"],
];

const LOCAL_FOOD_FALLBACKS: Array<{ pattern: RegExp; food: FoodSearchResult }> = [
  localFood(/\b(rice|basmati)\b/i, "Rice, white, uncooked", { calories_kcal: 365, carbs_g: 80, protein_g: 7.1, fat_g: 0.7, fiber_g: 1.3, potassium_mg: 115, iron_mg: 0.8, magnesium_mg: 25, phosphorus_mg: 115, zinc_mg: 1.1, folate_mcg: 8 }),
  localFood(/\bonion\b/i, "Onion, raw", { calories_kcal: 40, carbs_g: 9.3, sugar_g: 4.2, fiber_g: 1.7, protein_g: 1.1, fat_g: 0.1, potassium_mg: 146, calcium_mg: 23, vitamin_c_mg: 7.4, folate_mcg: 19 }),
  localFood(/\b(pigeon peas|toor dal|lentil|dal)\b/i, "Pigeon peas, split, dry", { calories_kcal: 343, carbs_g: 63, fiber_g: 15, protein_g: 22, fat_g: 1.5, potassium_mg: 1392, calcium_mg: 130, iron_mg: 5.2, magnesium_mg: 183, phosphorus_mg: 367, zinc_mg: 2.8, folate_mcg: 456 }),
  localFood(/\b(mung beans|moong)\b/i, "Mung beans, dry", { calories_kcal: 347, carbs_g: 63, fiber_g: 16.3, sugar_g: 6.6, protein_g: 23.9, fat_g: 1.2, potassium_mg: 1246, calcium_mg: 132, iron_mg: 6.7, magnesium_mg: 189, phosphorus_mg: 367, zinc_mg: 2.7, folate_mcg: 625 }),
  localFood(/\b(chickpeas|chana)\b/i, "Chickpeas, dry", { calories_kcal: 364, carbs_g: 61, fiber_g: 17.4, sugar_g: 10.7, protein_g: 19.3, fat_g: 6, saturated_fat_g: 0.6, potassium_mg: 875, calcium_mg: 105, iron_mg: 6.2, magnesium_mg: 115, phosphorus_mg: 366, zinc_mg: 3.4, folate_mcg: 557 }),
  localFood(/\b(black gram|urad)\b/i, "Black gram, dry", { calories_kcal: 341, carbs_g: 59, fiber_g: 18.3, protein_g: 25, fat_g: 1.6, potassium_mg: 983, calcium_mg: 138, iron_mg: 7.6, magnesium_mg: 267, phosphorus_mg: 379, zinc_mg: 3.4, folate_mcg: 216 }),
  localFood(/\b(chickpea flour|besan)\b/i, "Chickpea flour", { calories_kcal: 387, carbs_g: 58, fiber_g: 10.8, sugar_g: 10.9, protein_g: 22.4, fat_g: 6.7, saturated_fat_g: 0.7, potassium_mg: 846, calcium_mg: 45, iron_mg: 4.9, magnesium_mg: 166, phosphorus_mg: 318, zinc_mg: 2.8, folate_mcg: 437 }),
  localFood(/\btomato\b/i, "Tomato, raw", { calories_kcal: 18, carbs_g: 3.9, sugar_g: 2.6, fiber_g: 1.2, protein_g: 0.9, fat_g: 0.2, potassium_mg: 237, vitamin_a_mcg: 42, vitamin_c_mg: 13.7, vitamin_k_mcg: 7.9, folate_mcg: 15 }),
  localFood(/\b(eggplant|brinjal)\b/i, "Eggplant, raw", { calories_kcal: 25, carbs_g: 5.9, sugar_g: 3.5, fiber_g: 3, protein_g: 1, fat_g: 0.2, potassium_mg: 229, magnesium_mg: 14, vitamin_c_mg: 2.2, folate_mcg: 22 }),
  localFood(/\bpotato\b/i, "Potato, raw", { calories_kcal: 77, carbs_g: 17.5, sugar_g: 0.8, fiber_g: 2.2, protein_g: 2, fat_g: 0.1, potassium_mg: 425, iron_mg: 0.8, magnesium_mg: 23, phosphorus_mg: 57, vitamin_c_mg: 19.7, vitamin_b6_mg: 0.3, folate_mcg: 15 }),
  localFood(/\bspinach\b/i, "Spinach, raw", { calories_kcal: 23, carbs_g: 3.6, sugar_g: 0.4, fiber_g: 2.2, protein_g: 2.9, fat_g: 0.4, potassium_mg: 558, calcium_mg: 99, iron_mg: 2.7, magnesium_mg: 79, phosphorus_mg: 49, zinc_mg: 0.5, vitamin_a_mcg: 469, vitamin_c_mg: 28, vitamin_e_mg: 2, vitamin_k_mcg: 483, vitamin_b6_mg: 0.2, folate_mcg: 194 }),
  localFood(/\bgarlic\b/i, "Garlic, raw", { calories_kcal: 149, carbs_g: 33, sugar_g: 1, fiber_g: 2.1, protein_g: 6.4, fat_g: 0.5, potassium_mg: 401, calcium_mg: 181, iron_mg: 1.7, magnesium_mg: 25, phosphorus_mg: 153, zinc_mg: 1.2, vitamin_c_mg: 31, vitamin_b6_mg: 1.2, folate_mcg: 3 }),
  localFood(/\bginger\b/i, "Ginger, raw", { calories_kcal: 80, carbs_g: 17.8, sugar_g: 1.7, fiber_g: 2, protein_g: 1.8, fat_g: 0.8, potassium_mg: 415, calcium_mg: 16, iron_mg: 0.6, magnesium_mg: 43, phosphorus_mg: 34, zinc_mg: 0.3, vitamin_c_mg: 5, vitamin_b6_mg: 0.2, folate_mcg: 11 }),
  localFood(/\bcoconut\b/i, "Coconut, fresh", { calories_kcal: 354, carbs_g: 15.2, sugar_g: 6.2, fiber_g: 9, protein_g: 3.3, fat_g: 33.5, saturated_fat_g: 29.7, potassium_mg: 356, calcium_mg: 14, iron_mg: 2.4, magnesium_mg: 32, phosphorus_mg: 113, zinc_mg: 1.1, vitamin_c_mg: 3.3, folate_mcg: 26 }),
  localFood(/\b(milk|whole milk)\b/i, "Milk, whole", { calories_kcal: 61, carbs_g: 4.8, sugar_g: 5.1, protein_g: 3.2, fat_g: 3.3, saturated_fat_g: 1.9, cholesterol_mg: 10, sodium_mg: 43, potassium_mg: 132, calcium_mg: 113, phosphorus_mg: 84, zinc_mg: 0.4, vitamin_a_mcg: 46, vitamin_d_mcg: 1.3, vitamin_b12_mcg: 0.5 }),
  localFood(/\b(yogurt|curd)\b/i, "Yogurt, plain whole milk", { calories_kcal: 61, carbs_g: 4.7, sugar_g: 4.7, protein_g: 3.5, fat_g: 3.3, saturated_fat_g: 2.1, cholesterol_mg: 13, sodium_mg: 46, potassium_mg: 155, calcium_mg: 121, phosphorus_mg: 95, zinc_mg: 0.6, vitamin_a_mcg: 27, vitamin_b12_mcg: 0.4 }),
  localFood(/\b(oil|vegetable oil)\b/i, "Vegetable oil", { calories_kcal: 884, fat_g: 100, saturated_fat_g: 14, vitamin_e_mg: 14.4, vitamin_k_mcg: 5.4 }),
  localFood(/\bghee\b/i, "Ghee", { calories_kcal: 900, fat_g: 100, saturated_fat_g: 60, cholesterol_mg: 256, vitamin_a_mcg: 840, vitamin_e_mg: 2.8, vitamin_k_mcg: 8.6 }),
  localFood(/\bbutter\b/i, "Butter", { calories_kcal: 717, fat_g: 81, saturated_fat_g: 51, protein_g: 0.9, carbs_g: 0.1, cholesterol_mg: 215, sodium_mg: 11, potassium_mg: 24, calcium_mg: 24, vitamin_a_mcg: 684, vitamin_d_mcg: 1.5, vitamin_e_mg: 2.3, vitamin_b12_mcg: 0.2 }),
  localFood(/\bsugar\b/i, "Sugar, granulated", { calories_kcal: 387, carbs_g: 100, sugar_g: 100 }),
  localFood(/\b(flour|maida|all-purpose flour)\b/i, "Wheat flour, all-purpose", { calories_kcal: 364, carbs_g: 76, fiber_g: 2.7, sugar_g: 0.3, protein_g: 10.3, fat_g: 1, saturated_fat_g: 0.2, potassium_mg: 107, calcium_mg: 15, iron_mg: 4.6, magnesium_mg: 22, phosphorus_mg: 108, zinc_mg: 0.7, folate_mcg: 183 }),
  localFood(/\begg\b/i, "Egg, whole", { calories_kcal: 143, carbs_g: 0.7, sugar_g: 0.4, protein_g: 12.6, fat_g: 9.5, saturated_fat_g: 3.1, cholesterol_mg: 372, sodium_mg: 142, potassium_mg: 138, calcium_mg: 56, iron_mg: 1.8, magnesium_mg: 12, phosphorus_mg: 198, zinc_mg: 1.3, vitamin_a_mcg: 160, vitamin_d_mcg: 2, vitamin_e_mg: 1.1, vitamin_b6_mg: 0.2, vitamin_b12_mcg: 0.9, folate_mcg: 47 }),
];

function localFood(
  pattern: RegExp,
  description: string,
  values: Partial<Record<Exclude<keyof NutritionDraft, "note_en" | "note_de">, number>>
) {
  return {
    pattern,
    food: {
      fdcId: -Math.abs(description.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)),
      description,
      source: "local" as const,
      foodNutrients: Object.entries(values).map(([field, value]) => ({
        nutrientName: nutrientNameForField(field as Exclude<keyof NutritionDraft, "note_en" | "note_de">),
        nutrientNumber: LOCAL_NUTRIENT_NUMBERS[field as Exclude<keyof NutritionDraft, "note_en" | "note_de">],
        value,
      })),
    },
  };
}

function nutrientNameForField(field: Exclude<keyof NutritionDraft, "note_en" | "note_de">) {
  return NUTRIENT_NAME_MAP[field][0];
}

function parseAmount(value: string): number | null {
  // Understand simple amounts from the editor, like "2", "0.5", or "1/2".
  // If the amount is too complicated, return null and skip that ingredient's measured amount.
  const trimmed = value
    .trim()
    .replace(/\u00bc/g, "1/4")
    .replace(/\u00bd/g, "1/2")
    .replace(/\u00be/g, "3/4")
    .replace(/\u2153/g, "1/3")
    .replace(/\u2154/g, "2/3");
  if (!trimmed) return null;

  const direct = Number(trimmed);
  if (!Number.isNaN(direct)) {
    return direct;
  }

  if (trimmed.includes("/")) {
    const [left, right] = trimmed.split("/");
    const numerator = Number(left);
    const denominator = Number(right);

    if (!Number.isNaN(numerator) && !Number.isNaN(denominator) && denominator !== 0) {
      return numerator / denominator;
    }
  }

  const mixedFraction = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedFraction) {
    const whole = Number(mixedFraction[1]);
    const numerator = Number(mixedFraction[2]);
    const denominator = Number(mixedFraction[3]);

    if (!Number.isNaN(whole) && !Number.isNaN(numerator) && !Number.isNaN(denominator) && denominator !== 0) {
      return whole + numerator / denominator;
    }
  }

  const range = trimmed.match(/^(\d+(?:\.\d+)?)\s*[-\u2013]\s*(\d+(?:\.\d+)?)/);
  if (range) {
    const low = Number(range[1]);
    const high = Number(range[2]);

    if (!Number.isNaN(low) && !Number.isNaN(high)) {
      return (low + high) / 2;
    }
  }

  return null;
}

function normalizeIngredientName(name: string): string {
  // Search works better with the plain food name.
  // "finely chopped onion, for serving" becomes closer to "onion".
  const cleaned = name
    .replace(/\([^)]*\)/g, "")
    .split(",")[0]
    .split("/")[0]
    .replace(
      /\b(finely|roughly|coarse|coarsely|boiled|mashed|chopped|diced|minced|sliced|grated|crushed|peeled|fresh|frozen|dry|dried|large|small|medium|optional|for frying|for serving|to taste|as needed|divided)\b/gi,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();

  const alias = QUERY_ALIASES.find(([pattern]) => pattern.test(cleaned));
  return alias ? alias[1] : cleaned;
}

function getApiKey(): string {
  return process.env.USDA_API_KEY || "DEMO_KEY";
}

async function searchFood(query: string): Promise<FoodSearchResult | null> {
  const cacheKey = query.toLowerCase();

  if (foodSearchCache.has(cacheKey)) {
    return foodSearchCache.get(cacheKey) ?? null;
  }

  const params = new URLSearchParams({
    api_key: getApiKey(),
    query,
    pageSize: "8",
    pageNumber: "1",
    requireAllWords: "false",
  });

  ["Foundation", "SR Legacy", "Survey (FNDDS)"].forEach((dataType) => {
    params.append("dataType", dataType);
  });

  const response = await fetch(`${SEARCH_ENDPOINT}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
    const fallback = findLocalFood(query);
    foodSearchCache.set(cacheKey, fallback);
    return fallback;
  }

  const data = (await response.json()) as FoodSearchResponse;
  const match = chooseBestFoodMatch(query, data.foods ?? []) ?? findLocalFood(query);
  foodSearchCache.set(cacheKey, match);
  return match;
}

function findLocalFood(query: string): FoodSearchResult | null {
  const fallback = LOCAL_FOOD_FALLBACKS.find((item) => item.pattern.test(query));
  return fallback?.food ?? null;
}

function chooseBestFoodMatch(query: string, foods: FoodSearchResult[]): FoodSearchResult | null {
  const normalizedQuery = query.toLowerCase();
  const scored = foods
    .filter((food) => typeof food.fdcId === "number")
    .map((food) => {
      const description = food.description?.toLowerCase() ?? "";
      const typeBoost = food.dataType === "Foundation" ? 35 : food.dataType === "SR Legacy" ? 25 : 15;
      const exactBoost = description === normalizedQuery ? 50 : description.startsWith(normalizedQuery) ? 30 : description.includes(normalizedQuery) ? 12 : 0;
      return { food, score: (food.score ?? 0) + typeBoost + exactBoost };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.food ?? null;
}

function normalizeUnit(unit: string): string {
  const normalized = unit.trim().toLowerCase().replace(/\.$/, "");
  return UNIT_ALIASES[normalized] ?? normalized;
}

function resolveIngredientQuantity(amountInput: string, unitInput: string) {
  const parsedAmount = parseAmount(amountInput);
  const amountAsUnit = normalizeUnit(amountInput);
  const unit = normalizeUnit(unitInput);

  if (parsedAmount !== null) {
    return { amount: parsedAmount, unit };
  }

  if (!unit && GENERIC_UNIT_TO_GRAMS[amountAsUnit]) {
    return { amount: 1, unit: amountAsUnit };
  }

  return { amount: 1, unit };
}

function ingredientSpecificGramWeight(query: string, unit: string): number | null {
  const normalizedQuery = query.toLowerCase();

  if (unit === "cup" || unit === "cups") {
    if (/\b(rice|basmati)\b/.test(normalizedQuery)) return 185;
    if (/\b(flour|maida|semolina|rava|sooji)\b/.test(normalizedQuery)) return 120;
    if (/\b(sugar|jaggery)\b/.test(normalizedQuery)) return 200;
    if (/\b(milk|water|yogurt|curd)\b/.test(normalizedQuery)) return 240;
    if (/\b(oil|ghee|butter)\b/.test(normalizedQuery)) return 218;
    if (/\b(dal|lentil|bean|peas|chickpea)\b/.test(normalizedQuery)) return 190;
    if (/\bcoconut\b/.test(normalizedQuery)) return 85;
  }

  if (unit === "whole" || unit === "piece" || unit === "pieces") {
    if (/\begg\b/.test(normalizedQuery)) return 50;
    if (/\bonion\b/.test(normalizedQuery)) return 110;
    if (/\btomato\b/.test(normalizedQuery)) return 120;
    if (/\bpotato\b/.test(normalizedQuery)) return 170;
    if (/\bgarlic\b/.test(normalizedQuery)) return 3;
    if (/\b(chili|chilli|pepper)\b/.test(normalizedQuery)) return 5;
  }

  return null;
}

function resolveGramWeight(food: FoodSearchResult, amount: number, unit: string, query: string): number | null {
  const normalizedUnit = normalizeUnit(unit);

  if (!normalizedUnit) {
    const wholeMeasure = findMeasureGramWeight(food, ["whole", "large", "medium", "quantity not specified"]);
    return amount * (ingredientSpecificGramWeight(query, "whole") ?? wholeMeasure ?? 100);
  }

  const ingredientWeight = ingredientSpecificGramWeight(query, normalizedUnit);
  if (ingredientWeight) {
    return amount * ingredientWeight;
  }

  if (GENERIC_UNIT_TO_GRAMS[normalizedUnit]) {
    return amount * GENERIC_UNIT_TO_GRAMS[normalizedUnit];
  }

  const measureWeight = findMeasureGramWeight(food, [normalizedUnit]);
  if (measureWeight) {
    return amount * measureWeight;
  }

  if (food.servingSize && food.servingSizeUnit?.toLowerCase() === "g") {
    return amount * food.servingSize;
  }

  return amount * 100;
}

function findMeasureGramWeight(food: FoodSearchResult, needles: string[]): number | null {
  const measure = food.foodMeasures?.find((item) => {
    const haystack = [item.disseminationText, item.modifier, item.measureUnitName, item.measureUnit?.name]
      .map((value) => value?.toLowerCase() ?? "")
      .join(" ");

    return needles.some((needle) => haystack.includes(needle));
  });

  return measure?.gramWeight ?? null;
}

function getNutrientAmount(
  source: { foodNutrients?: FoodNutrient[] },
  names: string[],
  numbers: string[]
): number {
  for (const nutrient of source.foodNutrients ?? []) {
    const nutrientName = nutrient.nutrient?.name ?? nutrient.nutrientName;
    const nutrientNumber = nutrient.nutrient?.number ?? nutrient.nutrientNumber;
    const nutrientAmount = typeof nutrient.amount === "number" ? nutrient.amount : nutrient.value;

    if ((nutrientName && names.includes(nutrientName) || nutrientNumber && numbers.includes(nutrientNumber)) && typeof nutrientAmount === "number") {
      if (nutrientName === "Vitamin D (D2 + D3), International Units") {
        return nutrientAmount / 40;
      }

      return nutrientAmount;
    }
  }

  return 0;
}

function blankNutritionDraft(): NutritionDraft {
  return {
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
}

export async function estimateNutritionFromIngredients(input: {
  ingredientGroups: IngredientGroupDraft[];
  servings: string;
}): Promise<NutritionEstimateResult> {
  // Main nutrition flow:
  // 1. Flatten all ingredient sections into one list.
  // 2. Search USDA for each ingredient.
  // 3. Convert ingredient amount/unit to grams.
  // 4. Add nutrients together and divide by servings.
  const nutritionTotals = Object.fromEntries(
    Object.keys(blankNutritionDraft())
      .filter((key) => !["note_en", "note_de"].includes(key))
      .map((key) => [key, 0])
  ) as Record<Exclude<keyof NutritionDraft, "note_en" | "note_de">, number>;

  const ingredients = input.ingredientGroups.flatMap((group) =>
    group.items.filter((ingredient) => ingredient.name_en.trim())
  );
  let matchedIngredients = 0;
  let localFallbackIngredients = 0;
  const unmatchedIngredients: string[] = [];

  for (const ingredient of ingredients) {
    const foodQuery = normalizeIngredientName(ingredient.name_en);

    if (!foodQuery) {
      continue;
    }

    const searchResult = await searchFood(foodQuery).catch(() => null);
    if (!searchResult) {
      unmatchedIngredients.push(ingredient.name_en.trim());
      continue;
    }

    const quantity = resolveIngredientQuantity(ingredient.amount, ingredient.unit);
    const ontologyGrams = estimateIngredientWeightGrams({
      id: "",
      ingredientId: "",
      canonicalName: foodQuery,
      name_en: ingredient.name_en,
      name_de: ingredient.name_de,
      amount: ingredient.amount,
      quantity: ingredient.amount,
      unit: ingredient.unit,
      preparation: ingredient.preparation ?? "",
      optional: Boolean(ingredient.optional),
      garnish: Boolean(ingredient.garnish),
      approximate: Boolean(ingredient.approximate),
      estimatedWeightGrams: null,
      defaultUnit: "",
    });
    const grams = ontologyGrams || resolveGramWeight(searchResult, quantity.amount, quantity.unit, foodQuery);

    if (!grams) {
      unmatchedIngredients.push(ingredient.name_en.trim());
      continue;
    }

    matchedIngredients += 1;
    if (searchResult.source === "local") {
      localFallbackIngredients += 1;
    }

    for (const [field, nutrientNames] of Object.entries(NUTRIENT_NAME_MAP) as Array<
      [Exclude<keyof NutritionDraft, "note_en" | "note_de">, string[]]
    >) {
      const per100 = getNutrientAmount(searchResult, nutrientNames, NUTRIENT_NUMBER_MAP[field]);
      nutritionTotals[field] += (per100 * grams) / 100;
    }
  }

  const servings = Number(input.servings) > 0 ? Number(input.servings) : 1;
  const format = (value: number) => (value > 0 ? Number((value / servings).toFixed(2)).toString() : "");
  const matchRatio = ingredients.length > 0 ? matchedIngredients / ingredients.length : 0;
  const confidence = matchRatio >= 0.85 ? "high" : matchRatio >= 0.5 ? "medium" : "low";
  const confidenceDe = confidence === "high" ? "hoch" : confidence === "medium" ? "mittel" : "niedrig";
  const missed = unmatchedIngredients.slice(0, 5).join(", ");
  const sourceText = localFallbackIngredients > 0 ? "USDA FoodData Central plus local pantry fallback" : "USDA FoodData Central";
  const sourceTextDe = localFallbackIngredients > 0 ? "USDA FoodData Central plus lokaler Pantry-Fallback" : "USDA FoodData Central";
  const fallbackText = localFallbackIngredients > 0 ? ` ${localFallbackIngredients} matched with the local fallback.` : "";
  const fallbackTextDe = localFallbackIngredients > 0 ? ` ${localFallbackIngredients} mit lokalem Fallback erkannt.` : "";
  const noteEn =
    matchedIngredients > 0
      ? `Estimated from ${sourceText} with normalized gram conversion (${matchedIngredients} of ${ingredients.length} ingredients matched, ${confidence} confidence). Pinches, leaves, garnish, optional, and to-taste items are handled with low-impact rules. Review for recipe yield, frying oil absorption, evaporation, cooking loss, and brand-specific products.${fallbackText}${missed ? ` Unmatched: ${missed}.` : ""}`
      : "USDA could not confidently match the current ingredient list yet. Please review ingredient names, amounts, and units or enter nutrition manually if needed.";
  const noteDe =
    matchedIngredients > 0
      ? `Geschaetzt aus ${sourceTextDe} mit normalisierter Gramm-Umrechnung (${matchedIngredients} von ${ingredients.length} Zutaten erkannt, Vertrauen ${confidenceDe}). Prisen, Blaetter, Garnitur, optionale Zutaten und "nach Geschmack" werden niedrig gewichtet. Bitte Ausbeute, Frittieroel-Aufnahme, Verdunstung, Kochverlust und konkrete Marken pruefen.${fallbackTextDe}${missed ? ` Nicht erkannt: ${missed}.` : ""}`
      : "USDA konnte die aktuelle Zutatenliste noch nicht sicher zuordnen. Bitte pruefe Zutatenbezeichnungen, Mengen und Einheiten oder trage die Nahrwerte manuell ein.";

  return {
    nutrition: {
      calories_kcal: format(nutritionTotals.calories_kcal),
      fat_g: format(nutritionTotals.fat_g),
      saturated_fat_g: format(nutritionTotals.saturated_fat_g),
      carbs_g: format(nutritionTotals.carbs_g),
      fiber_g: format(nutritionTotals.fiber_g),
      sugar_g: format(nutritionTotals.sugar_g),
      protein_g: format(nutritionTotals.protein_g),
      sodium_mg: format(nutritionTotals.sodium_mg),
      cholesterol_mg: format(nutritionTotals.cholesterol_mg),
      potassium_mg: format(nutritionTotals.potassium_mg),
      calcium_mg: format(nutritionTotals.calcium_mg),
      iron_mg: format(nutritionTotals.iron_mg),
      magnesium_mg: format(nutritionTotals.magnesium_mg),
      phosphorus_mg: format(nutritionTotals.phosphorus_mg),
      zinc_mg: format(nutritionTotals.zinc_mg),
      vitamin_a_mcg: format(nutritionTotals.vitamin_a_mcg),
      vitamin_c_mg: format(nutritionTotals.vitamin_c_mg),
      vitamin_d_mcg: format(nutritionTotals.vitamin_d_mcg),
      vitamin_e_mg: format(nutritionTotals.vitamin_e_mg),
      vitamin_k_mcg: format(nutritionTotals.vitamin_k_mcg),
      vitamin_b6_mg: format(nutritionTotals.vitamin_b6_mg),
      vitamin_b12_mcg: format(nutritionTotals.vitamin_b12_mcg),
      folate_mcg: format(nutritionTotals.folate_mcg),
      note_en: noteEn,
      note_de: noteDe,
    },
    meta: {
      ingredientCount: ingredients.length,
      matchedIngredients,
      localFallbackIngredients,
      unmatchedIngredients,
      confidence,
    },
  };
}
