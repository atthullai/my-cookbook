import type { IngredientGroupDraft, NutritionDraft } from "@/lib/recipe-types";

const SEARCH_ENDPOINT = "https://api.nal.usda.gov/fdc/v1/foods/search";
const FOOD_ENDPOINT = "https://api.nal.usda.gov/fdc/v1/food";

type FoodSearchResult = {
  fdcId: number;
  description?: string;
  foodNutrients?: FoodNutrient[];
  servingSize?: number;
  servingSizeUnit?: string;
};

type FoodPortion = {
  gramWeight?: number;
  modifier?: string;
  measureUnit?: {
    name?: string;
  };
};

type FoodNutrient = {
  nutrient?: {
    name?: string;
    number?: string;
  };
  amount?: number;
};

type FoodDetailsResponse = {
  description?: string;
  foodNutrients?: FoodNutrient[];
  foodPortions?: FoodPortion[];
  servingSize?: number;
  servingSizeUnit?: string;
};

type FoodSearchResponse = {
  foods?: FoodSearchResult[];
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
  pound: 453.59,
  pounds: 453.59,
};

function parseAmount(value: string): number | null {
  const trimmed = value.trim();
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

  return null;
}

function normalizeIngredientName(name: string): string {
  return name
    .split(",")[0]
    .split("/")[0]
    .replace(/\b(finely|roughly|coarse|coarsely|boiled|mashed|chopped|fresh|for frying|for serving)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getApiKey(): string {
  return process.env.USDA_API_KEY || "DEMO_KEY";
}

async function searchFood(query: string): Promise<FoodSearchResult | null> {
  const response = await fetch(`${SEARCH_ENDPOINT}?api_key=${getApiKey()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      pageSize: 5,
      dataType: ["Foundation", "SR Legacy", "Survey (FNDDS)"],
    }),
  });

  if (!response.ok) {
    throw new Error(`USDA food search failed with status ${response.status}`);
  }

  const data = (await response.json()) as FoodSearchResponse;
  return data.foods?.find((food) => typeof food.fdcId === "number") || null;
}

async function fetchFoodDetails(fdcId: number): Promise<FoodDetailsResponse | null> {
  const response = await fetch(`${FOOD_ENDPOINT}/${fdcId}?api_key=${getApiKey()}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`USDA food details failed with status ${response.status}`);
  }

  return (await response.json()) as FoodDetailsResponse;
}

function resolveGramWeight(details: FoodDetailsResponse | FoodSearchResult, amount: number, unit: string): number | null {
  const normalizedUnit = unit.trim().toLowerCase();

  if (!normalizedUnit) {
    if (details.servingSize && details.servingSizeUnit?.toLowerCase() === "g") {
      return amount * details.servingSize;
    }

    return amount * 100;
  }

  const matchedPortion = ("foodPortions" in details ? details.foodPortions : undefined)?.find((portion) => {
    const names = [portion.modifier, portion.measureUnit?.name].map((value) => value?.toLowerCase() || "");
    return names.some((name) => name.includes(normalizedUnit));
  });

  if (matchedPortion?.gramWeight) {
    return amount * matchedPortion.gramWeight;
  }

  if (GENERIC_UNIT_TO_GRAMS[normalizedUnit]) {
    return amount * GENERIC_UNIT_TO_GRAMS[normalizedUnit];
  }

  return amount * 100;
}

function getNutrientAmount(source: { foodNutrients?: FoodNutrient[] }, names: string[]): number {
  for (const nutrient of source.foodNutrients ?? []) {
    const nutrientName = nutrient.nutrient?.name;

    if (nutrientName && names.includes(nutrientName) && typeof nutrient.amount === "number") {
      if (nutrientName === "Vitamin D (D2 + D3), International Units") {
        return nutrient.amount / 40;
      }

      return nutrient.amount;
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
}): Promise<NutritionDraft> {
  const nutritionTotals = Object.fromEntries(
    Object.keys(blankNutritionDraft())
      .filter((key) => !["note_en", "note_de"].includes(key))
      .map((key) => [key, 0])
  ) as Record<Exclude<keyof NutritionDraft, "note_en" | "note_de">, number>;

  const ingredients = input.ingredientGroups.flatMap((group) =>
    group.items.filter((ingredient) => ingredient.name_en.trim())
  );

  for (const ingredient of ingredients) {
    const amount = parseAmount(ingredient.amount);
    const foodQuery = normalizeIngredientName(ingredient.name_en);

    if (!foodQuery) {
      continue;
    }

    const searchResult = await searchFood(foodQuery);
    if (!searchResult) {
      continue;
    }

    let details: FoodDetailsResponse | null = null;

    try {
      details = await fetchFoodDetails(searchResult.fdcId);
    } catch {
      details = null;
    }

    const nutrientSource = details || searchResult;
    const grams = resolveGramWeight(details || searchResult, amount ?? 1, ingredient.unit);

    if (!grams) {
      continue;
    }

    for (const [field, nutrientNames] of Object.entries(NUTRIENT_NAME_MAP) as Array<
      [Exclude<keyof NutritionDraft, "note_en" | "note_de">, string[]]
    >) {
      const per100 = getNutrientAmount(nutrientSource, nutrientNames);
      nutritionTotals[field] += (per100 * grams) / 100;
    }
  }

  const servings = Number(input.servings) > 0 ? Number(input.servings) : 1;
  const format = (value: number) => (value > 0 ? Number((value / servings).toFixed(2)).toString() : "");

  return {
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
    note_en: "Estimated from USDA FoodData Central ingredient matches. Review and adjust for recipe-specific yield, frying, and evaporation.",
    note_de: "Geschaetzt aus passenden USDA-FoodData-Central-Zutaten. Bitte fur Ausbeute, Frittieren und Verdunstung bei Bedarf anpassen.",
  };
}
