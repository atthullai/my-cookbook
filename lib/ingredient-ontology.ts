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
  weightConfidence: 'exact' | 'measured' | 'estimated' | 'unknown';
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
  // ── Spices & seasonings ───────────────────────────────────────────────────
  ingredient("salt", ["sea salt", "kosher salt", "table salt"], "spice", "pinch", 1.2, { sodium_mg: 38758 }),
  ingredient("black pepper", ["pepper", "ground pepper", "black pepper powder"], "spice", "tsp", 0.85, { calories_kcal: 251, carbs_g: 64, protein_g: 10, fat_g: 3.3, fiber_g: 25 }),
  ingredient("turmeric", ["turmeric powder", "haldi"], "spice", "tsp", 0.65, { calories_kcal: 312, carbs_g: 67, protein_g: 9.7, fat_g: 3.3, fiber_g: 22.7, iron_mg: 55 }),
  ingredient("cumin", ["cumin powder", "cumin seeds", "jeera", "ground cumin"], "spice", "tsp", 0.76, { calories_kcal: 375, carbs_g: 44, protein_g: 18, fat_g: 22, fiber_g: 10, iron_mg: 66 }),
  ingredient("coriander powder", ["ground coriander", "dhania powder"], "spice", "tsp", 0.68, { calories_kcal: 298, carbs_g: 55, protein_g: 12, fat_g: 18, fiber_g: 41, iron_mg: 17 }),
  ingredient("chili powder", ["red chili powder", "cayenne", "lal mirch"], "spice", "tsp", 0.6, { calories_kcal: 314, carbs_g: 50, protein_g: 13, fat_g: 14, fiber_g: 35, iron_mg: 5, vitamin_a_mcg: 2081 }),
  ingredient("garam masala", ["mixed spice"], "spice", "tsp", 0.62, { calories_kcal: 350, carbs_g: 55, protein_g: 15, fat_g: 15, fiber_g: 25 }),
  ingredient("paprika", ["smoked paprika", "sweet paprika"], "spice", "tsp", 0.6, { calories_kcal: 282, carbs_g: 54, protein_g: 14, fat_g: 13, fiber_g: 35, iron_mg: 16, vitamin_a_mcg: 2463, vitamin_c_mg: 143 }),
  ingredient("cinnamon", ["cinnamon powder", "ground cinnamon"], "spice", "tsp", 0.55, { calories_kcal: 247, carbs_g: 81, protein_g: 4, fat_g: 1.2, fiber_g: 53, calcium_mg: 26 }),
  ingredient("cardamom", ["cardamom powder", "elaichi", "ground cardamom"], "spice", "tsp", 0.62, { calories_kcal: 311, carbs_g: 68, protein_g: 11, fat_g: 6.7, fiber_g: 28 }),
  ingredient("cloves", ["clove", "ground cloves", "laung"], "spice", "tsp", 0.64, { calories_kcal: 274, carbs_g: 66, protein_g: 6, fat_g: 13, fiber_g: 34 }),
  ingredient("mustard seeds", ["rai", "mustard"], "spice", "tsp", 0.8, { calories_kcal: 508, carbs_g: 28, protein_g: 26, fat_g: 36, fiber_g: 12 }),
  ingredient("fenugreek seeds", ["methi seeds", "fenugreek"], "spice", "tsp", 0.78, { calories_kcal: 323, carbs_g: 58, protein_g: 23, fat_g: 6.4, fiber_g: 25, iron_mg: 33 }),
  ingredient("star anise", ["star anise pods"], "spice", "piece", 0.55, { calories_kcal: 337, carbs_g: 50, protein_g: 18, fat_g: 16, fiber_g: 15 }),
  ingredient("fennel seeds", ["saunf", "fennel"], "spice", "tsp", 0.62, { calories_kcal: 345, carbs_g: 52, protein_g: 16, fat_g: 15, fiber_g: 40 }),
  ingredient("nutmeg", ["ground nutmeg", "jaiphal"], "spice", "tsp", 0.55, { calories_kcal: 525, carbs_g: 49, protein_g: 5.8, fat_g: 36, fiber_g: 21 }),
  ingredient("bay leaves", ["bay leaf", "tej patta", "dried bay leaves"], "spice", "piece", 0.3, { calories_kcal: 313, carbs_g: 75, protein_g: 7.6, fat_g: 8.4, fiber_g: 26 }),
  ingredient("curry powder", ["curry mix"], "spice", "tsp", 0.63, { calories_kcal: 325, carbs_g: 58, protein_g: 14, fat_g: 10, fiber_g: 33, iron_mg: 30 }),
  // ── Herbs ─────────────────────────────────────────────────────────────────
  ingredient("coriander leaves", ["cilantro", "cilantro leaves", "fresh coriander", "dhania"], "herb", "handful", 0.35, { calories_kcal: 23, carbs_g: 3.7, protein_g: 2.1, fat_g: 0.5, fiber_g: 2.8, potassium_mg: 521, vitamin_c_mg: 27, vitamin_k_mcg: 310 }),
  ingredient("mint", ["mint leaves", "pudina", "fresh mint"], "herb", "handful", 0.3, { calories_kcal: 70, carbs_g: 15, protein_g: 3.8, fat_g: 0.9, fiber_g: 8, vitamin_c_mg: 31, vitamin_a_mcg: 212 }),
  ingredient("curry leaves", ["kadhi patta", "curry leaf"], "herb", "sprig", 0.4, { calories_kcal: 108, carbs_g: 18, protein_g: 6, fat_g: 1, fiber_g: 6.4, vitamin_c_mg: 4 }),
  ingredient("basil", ["fresh basil", "basil leaves"], "herb", "handful", 0.3, { calories_kcal: 23, carbs_g: 2.7, protein_g: 3.2, fat_g: 0.6, fiber_g: 1.6, vitamin_k_mcg: 415, vitamin_a_mcg: 264 }),
  ingredient("parsley", ["fresh parsley"], "herb", "handful", 0.3, { calories_kcal: 36, carbs_g: 6.3, protein_g: 3, fat_g: 0.8, fiber_g: 3.3, vitamin_c_mg: 133, vitamin_k_mcg: 1640 }),
  ingredient("thyme", ["fresh thyme", "dried thyme"], "herb", "sprig", 0.3, { calories_kcal: 101, carbs_g: 24, protein_g: 5.6, fat_g: 1.7, fiber_g: 14 }),
  ingredient("rosemary", ["fresh rosemary", "dried rosemary"], "herb", "sprig", 0.3, { calories_kcal: 131, carbs_g: 21, protein_g: 3.3, fat_g: 5.9, fiber_g: 14, vitamin_c_mg: 22 }),
  ingredient("ginger", ["fresh ginger", "ginger root", "adrak"], "herb", "piece", 1.0, { calories_kcal: 80, carbs_g: 18, protein_g: 1.8, fat_g: 0.75, fiber_g: 2 }),
  // ── Vegetables ────────────────────────────────────────────────────────────
  ingredient("garlic", ["garlic clove", "garlic cloves", "lasan"], "vegetable", "clove", 1, { calories_kcal: 149, carbs_g: 33, protein_g: 6.4, fat_g: 0.5, fiber_g: 2.1, calcium_mg: 181, vitamin_c_mg: 31 }),
  ingredient("onion", ["onions", "brown onion", "yellow onion"], "vegetable", "piece", 0.94, { calories_kcal: 40, carbs_g: 9.3, sugar_g: 4.2, fiber_g: 1.7, protein_g: 1.1, potassium_mg: 146 }),
  ingredient("tomato", ["tomatoes", "fresh tomato"], "vegetable", "piece", 0.95, { calories_kcal: 18, carbs_g: 3.9, sugar_g: 2.6, fiber_g: 1.2, protein_g: 0.9, potassium_mg: 237, vitamin_c_mg: 13.7 }),
  ingredient("potato", ["potatoes", "aloo"], "vegetable", "piece", 1.07, { calories_kcal: 77, carbs_g: 17, protein_g: 2, fat_g: 0.1, fiber_g: 2.2, potassium_mg: 421, vitamin_c_mg: 20 }),
  ingredient("sweet potato", ["yam", "shakarkandi"], "vegetable", "piece", 1.05, { calories_kcal: 86, carbs_g: 20, protein_g: 1.6, fat_g: 0.1, fiber_g: 3, potassium_mg: 337, vitamin_c_mg: 2.4, vitamin_a_mcg: 961 }),
  ingredient("carrot", ["carrots", "gajar"], "vegetable", "piece", 1.04, { calories_kcal: 41, carbs_g: 10, protein_g: 0.9, fat_g: 0.2, fiber_g: 2.8, potassium_mg: 320, vitamin_c_mg: 6, vitamin_a_mcg: 835 }),
  ingredient("green chili", ["green chilli", "hari mirch", "green chillies"], "vegetable", "piece", 0.96, { calories_kcal: 40, carbs_g: 9, protein_g: 2, fat_g: 0.2, fiber_g: 1.5, vitamin_c_mg: 242 }),
  ingredient("red chili", ["red chilli", "lal mirch fresh", "red chillies"], "vegetable", "piece", 0.96, { calories_kcal: 40, carbs_g: 9, protein_g: 2, fat_g: 0.2, fiber_g: 1.5, vitamin_c_mg: 144, vitamin_a_mcg: 157 }),
  ingredient("bell pepper", ["capsicum", "sweet pepper", "red pepper", "green pepper"], "vegetable", "piece", 0.96, { calories_kcal: 31, carbs_g: 6, protein_g: 1, fat_g: 0.3, fiber_g: 2.1, vitamin_c_mg: 128, vitamin_a_mcg: 157 }),
  ingredient("spinach", ["baby spinach", "palak"], "vegetable", "handful", 0.94, { calories_kcal: 23, carbs_g: 3.6, protein_g: 2.9, fat_g: 0.4, fiber_g: 2.2, potassium_mg: 558, vitamin_c_mg: 28, vitamin_a_mcg: 469, vitamin_k_mcg: 483 }),
  ingredient("broccoli", ["broccoli florets"], "vegetable", "piece", 0.89, { calories_kcal: 34, carbs_g: 7, protein_g: 2.8, fat_g: 0.4, fiber_g: 2.6, vitamin_c_mg: 89, vitamin_a_mcg: 77 }),
  ingredient("cauliflower", ["gobhi", "cauliflower florets"], "vegetable", "piece", 0.92, { calories_kcal: 25, carbs_g: 5, protein_g: 1.9, fat_g: 0.3, fiber_g: 2, vitamin_c_mg: 48 }),
  ingredient("cabbage", ["white cabbage", "band gobhi"], "vegetable", "piece", 0.9, { calories_kcal: 25, carbs_g: 6, protein_g: 1.3, fat_g: 0.1, fiber_g: 2.5, vitamin_c_mg: 36, vitamin_k_mcg: 76 }),
  ingredient("eggplant", ["aubergine", "brinjal", "baingan"], "vegetable", "piece", 0.93, { calories_kcal: 25, carbs_g: 6, protein_g: 1, fat_g: 0.2, fiber_g: 3 }),
  ingredient("zucchini", ["courgette", "turai"], "vegetable", "piece", 0.94, { calories_kcal: 17, carbs_g: 3.1, protein_g: 1.2, fat_g: 0.3, fiber_g: 1, vitamin_c_mg: 17 }),
  ingredient("cucumber", ["cucumbers"], "vegetable", "piece", 0.96, { calories_kcal: 15, carbs_g: 3.6, protein_g: 0.7, fat_g: 0.1, fiber_g: 0.5, vitamin_c_mg: 2.8 }),
  ingredient("mushroom", ["mushrooms", "button mushroom"], "vegetable", "piece", 0.92, { calories_kcal: 22, carbs_g: 3.3, protein_g: 3.1, fat_g: 0.3, fiber_g: 1, potassium_mg: 318 }),
  ingredient("peas", ["green peas", "frozen peas", "matar"], "vegetable", "cup", 0.83, { calories_kcal: 81, carbs_g: 14, protein_g: 5.4, fat_g: 0.4, fiber_g: 5.1, vitamin_c_mg: 40, vitamin_a_mcg: 38 }),
  ingredient("corn", ["sweetcorn", "maize", "corn kernels"], "vegetable", "piece", 0.75, { calories_kcal: 86, carbs_g: 19, protein_g: 3.3, fat_g: 1.4, fiber_g: 2.4, vitamin_c_mg: 7 }),
  ingredient("spring onion", ["scallion", "green onion", "hara pyaz"], "vegetable", "piece", 0.9, { calories_kcal: 32, carbs_g: 7.3, protein_g: 1.8, fat_g: 0.2, fiber_g: 2.6, vitamin_c_mg: 18, vitamin_k_mcg: 207 }),
  // ── Fruits ────────────────────────────────────────────────────────────────
  ingredient("lemon", ["lemons", "nimbu"], "fruit", "piece", 1.06, { calories_kcal: 29, carbs_g: 9, protein_g: 1.1, fat_g: 0.3, fiber_g: 2.8, vitamin_c_mg: 53 }),
  ingredient("lime", ["limes"], "fruit", "piece", 1.04, { calories_kcal: 30, carbs_g: 11, protein_g: 0.7, fat_g: 0.2, fiber_g: 2.8, vitamin_c_mg: 29 }),
  ingredient("lemon juice", ["lime juice", "fresh lemon juice"], "liquid", "tbsp", 1.02, { calories_kcal: 22, carbs_g: 7, protein_g: 0.4, fat_g: 0.2, vitamin_c_mg: 51 }),
  ingredient("mango", ["mangoes", "aam"], "fruit", "piece", 0.96, { calories_kcal: 60, carbs_g: 15, protein_g: 0.8, fat_g: 0.4, fiber_g: 1.6, vitamin_c_mg: 36, vitamin_a_mcg: 54 }),
  ingredient("banana", ["bananas", "kela"], "fruit", "piece", 0.98, { calories_kcal: 89, carbs_g: 23, protein_g: 1.1, fat_g: 0.3, fiber_g: 2.6, potassium_mg: 358, vitamin_c_mg: 8.7 }),
  ingredient("apple", ["apples"], "fruit", "piece", 0.96, { calories_kcal: 52, carbs_g: 14, protein_g: 0.3, fat_g: 0.2, fiber_g: 2.4, vitamin_c_mg: 4.6 }),
  ingredient("tomato paste", ["tomato puree", "tomato concentrate"], "vegetable", "tbsp", 1.2, { calories_kcal: 82, carbs_g: 19, protein_g: 4.3, fat_g: 0.5, fiber_g: 4.1, potassium_mg: 1749 }),
  ingredient("coconut", ["desiccated coconut", "grated coconut", "nariyal"], "fruit", "tbsp", 0.55, { calories_kcal: 354, carbs_g: 15, protein_g: 3.3, fat_g: 33, fiber_g: 9 }),
  // ── Grains & starches ─────────────────────────────────────────────────────
  ingredient("rice", ["basmati rice", "raw rice", "white rice", "jasmine rice"], "grain", "cup", 0.77, { calories_kcal: 365, carbs_g: 80, protein_g: 7.1, fat_g: 0.7, fiber_g: 1.3 }),
  ingredient("flour", ["all-purpose flour", "plain flour", "maida", "white flour"], "grain", "cup", 0.57, { calories_kcal: 364, carbs_g: 76, protein_g: 10, fat_g: 1, fiber_g: 2.7, iron_mg: 3.6, calcium_mg: 15 }),
  ingredient("whole wheat flour", ["atta", "wholemeal flour", "wheat flour"], "grain", "cup", 0.59, { calories_kcal: 340, carbs_g: 72, protein_g: 13, fat_g: 2.5, fiber_g: 11, iron_mg: 3.9, calcium_mg: 34 }),
  ingredient("oats", ["rolled oats", "porridge oats", "quick oats"], "grain", "cup", 0.42, { calories_kcal: 389, carbs_g: 66, protein_g: 17, fat_g: 7, fiber_g: 10.6, iron_mg: 4.7, calcium_mg: 54 }),
  ingredient("pasta", ["dry pasta", "spaghetti", "penne", "pasta dry"], "grain", "cup", 0.65, { calories_kcal: 371, carbs_g: 75, protein_g: 13, fat_g: 1.5, fiber_g: 2.7, iron_mg: 3.5 }),
  ingredient("semolina", ["suji", "sooji", "rava"], "grain", "cup", 0.62, { calories_kcal: 360, carbs_g: 73, protein_g: 13, fat_g: 1, fiber_g: 3.9, iron_mg: 4.5 }),
  ingredient("cornstarch", ["corn flour", "maizena", "arrowroot"], "grain", "tbsp", 0.6, { calories_kcal: 381, carbs_g: 91, protein_g: 0.3, fat_g: 0.1, fiber_g: 0.9 }),
  ingredient("breadcrumbs", ["bread crumbs", "panko"], "grain", "cup", 0.35, { calories_kcal: 395, carbs_g: 72, protein_g: 14, fat_g: 5.3, fiber_g: 4.2 }),
  ingredient("rice noodles", ["glass noodles", "vermicelli", "rice vermicelli"], "grain", "cup", 0.65, { calories_kcal: 364, carbs_g: 80, protein_g: 6, fat_g: 0.6, fiber_g: 1.8 }),
  // ── Legumes ───────────────────────────────────────────────────────────────
  ingredient("lentils", ["red lentils", "masoor dal", "green lentils", "brown lentils"], "legume", "cup", 0.83, { calories_kcal: 353, carbs_g: 60, protein_g: 26, fat_g: 1.1, fiber_g: 11, iron_mg: 7.5, calcium_mg: 56, folate_mcg: 479 }),
  ingredient("chickpeas", ["garbanzo beans", "chana", "kabuli chana"], "legume", "cup", 0.8, { calories_kcal: 364, carbs_g: 61, protein_g: 19, fat_g: 6, fiber_g: 17, iron_mg: 6.2, calcium_mg: 105, folate_mcg: 557 }),
  ingredient("kidney beans", ["rajma", "red kidney beans"], "legume", "cup", 0.85, { calories_kcal: 337, carbs_g: 61, protein_g: 22, fat_g: 1.1, fiber_g: 15, iron_mg: 8.2, calcium_mg: 83, folate_mcg: 394 }),
  ingredient("moong dal", ["mung beans", "moong", "green gram"], "legume", "cup", 0.83, { calories_kcal: 347, carbs_g: 63, protein_g: 24, fat_g: 1.2, fiber_g: 16, iron_mg: 6.7, folate_mcg: 625 }),
  ingredient("black beans", ["black turtle beans"], "legume", "cup", 0.82, { calories_kcal: 341, carbs_g: 63, protein_g: 21, fat_g: 1.4, fiber_g: 15, iron_mg: 5.0, folate_mcg: 444 }),
  // ── Dairy & eggs ──────────────────────────────────────────────────────────
  ingredient("milk", ["whole milk", "full fat milk", "doodh"], "dairy", "cup", 1.03, { calories_kcal: 61, carbs_g: 4.8, protein_g: 3.2, fat_g: 3.3, saturated_fat_g: 2, calcium_mg: 113, vitamin_d_mcg: 0.4, vitamin_b12_mcg: 0.5 }),
  ingredient("butter", ["unsalted butter", "salted butter", "makhan"], "dairy", "tbsp", 0.91, { calories_kcal: 717, fat_g: 81, saturated_fat_g: 51, cholesterol_mg: 215, vitamin_a_mcg: 684, vitamin_e_mg: 1.5 }),
  ingredient("cream", ["heavy cream", "double cream", "fresh cream", "whipping cream"], "dairy", "tbsp", 1.01, { calories_kcal: 340, fat_g: 36, saturated_fat_g: 23, cholesterol_mg: 135, vitamin_a_mcg: 340, vitamin_d_mcg: 0.4 }),
  ingredient("yogurt", ["curd", "dahi", "plain yogurt", "greek yogurt"], "dairy", "cup", 1.04, { calories_kcal: 61, carbs_g: 4.7, protein_g: 3.5, fat_g: 3.3, calcium_mg: 121 }),
  ingredient("cheese", ["cheddar", "grated cheese", "parmesan"], "dairy", "g", 1.05, { calories_kcal: 402, fat_g: 33, saturated_fat_g: 21, protein_g: 25, carbs_g: 1.3, calcium_mg: 721, vitamin_a_mcg: 330, vitamin_b12_mcg: 1.1 }),
  ingredient("paneer", ["cottage cheese", "indian cottage cheese"], "dairy", "g", 1.05, { calories_kcal: 265, fat_g: 21, saturated_fat_g: 11, protein_g: 18, carbs_g: 1.2, calcium_mg: 480 }),
  ingredient("egg", ["eggs", "whole egg"], "protein", "piece", 1.03, { calories_kcal: 155, carbs_g: 1.1, protein_g: 12.6, fat_g: 10.6, saturated_fat_g: 3.1, cholesterol_mg: 373, vitamin_a_mcg: 147, vitamin_d_mcg: 1.1, vitamin_b12_mcg: 1.1, calcium_mg: 44 }),
  // ── Fats & oils ───────────────────────────────────────────────────────────
  ingredient("vegetable oil", ["oil", "sunflower oil", "neutral oil", "canola oil", "rapeseed oil", "cooking oil"], "fat", "tbsp", 0.92, { calories_kcal: 884, fat_g: 100, saturated_fat_g: 14, vitamin_e_mg: 14.4 }),
  ingredient("olive oil", ["extra virgin olive oil", "EVOO"], "fat", "tbsp", 0.91, { calories_kcal: 884, fat_g: 100, saturated_fat_g: 14, vitamin_e_mg: 14.4, vitamin_k_mcg: 60 }),
  ingredient("coconut oil", ["coconut fat"], "fat", "tbsp", 0.92, { calories_kcal: 892, fat_g: 99, saturated_fat_g: 82 }),
  ingredient("ghee", ["clarified butter", "desi ghee"], "fat", "tbsp", 0.91, { calories_kcal: 900, fat_g: 100, saturated_fat_g: 60, cholesterol_mg: 256, vitamin_a_mcg: 840 }),
  // ── Liquids & sauces ──────────────────────────────────────────────────────
  ingredient("water", ["cold water", "warm water", "hot water"], "liquid", "cup", 1.0, {}),
  ingredient("coconut milk", ["canned coconut milk", "tinned coconut milk"], "liquid", "cup", 1.06, { calories_kcal: 230, fat_g: 24, saturated_fat_g: 21, carbs_g: 6, protein_g: 2.3 }),
  ingredient("soy sauce", ["light soy sauce", "dark soy sauce", "tamari"], "liquid", "tbsp", 1.17, { calories_kcal: 60, carbs_g: 6, protein_g: 10, sodium_mg: 5765 }),
  ingredient("vinegar", ["white vinegar", "rice vinegar", "apple cider vinegar"], "liquid", "tbsp", 1.01, { calories_kcal: 21, carbs_g: 0.9, sodium_mg: 2 }),
  ingredient("chicken stock", ["chicken broth", "stock", "chicken stock"], "liquid", "cup", 1.0, { calories_kcal: 15, protein_g: 1.5, sodium_mg: 400 }),
  ingredient("vegetable stock", ["vegetable broth", "veg stock"], "liquid", "cup", 1.0, { calories_kcal: 12, carbs_g: 2, protein_g: 0.5, sodium_mg: 380 }),
  // ── Sweeteners ────────────────────────────────────────────────────────────
  ingredient("sugar", ["white sugar", "caster sugar", "granulated sugar"], "sweetener", "tsp", 0.85, { calories_kcal: 387, carbs_g: 100, sugar_g: 100 }),
  ingredient("brown sugar", ["dark brown sugar", "light brown sugar", "demerara"], "sweetener", "tsp", 0.87, { calories_kcal: 377, carbs_g: 97, sugar_g: 97 }),
  ingredient("honey", ["wildflower honey", "shehad"], "sweetener", "tbsp", 1.42, { calories_kcal: 304, carbs_g: 82, sugar_g: 82, protein_g: 0.3, potassium_mg: 52 }),
  ingredient("jaggery", ["gur", "palm sugar", "raw cane sugar"], "sweetener", "tbsp", 1.4, { calories_kcal: 383, carbs_g: 98, sugar_g: 97, iron_mg: 11, calcium_mg: 80 }),
  // ── Proteins ──────────────────────────────────────────────────────────────
  ingredient("chicken", ["chicken breast", "chicken thigh", "boneless chicken"], "protein", "g", 1.06, { calories_kcal: 165, carbs_g: 0, protein_g: 31, fat_g: 3.6, saturated_fat_g: 1, cholesterol_mg: 74 }),
  ingredient("beef", ["ground beef", "minced beef", "beef mince"], "protein", "g", 1.06, { calories_kcal: 250, carbs_g: 0, protein_g: 26, fat_g: 15, saturated_fat_g: 6, cholesterol_mg: 88, iron_mg: 2.6, zinc_mg: 5.8 }),
  ingredient("fish", ["white fish", "fish fillet"], "protein", "g", 1.05, { calories_kcal: 82, carbs_g: 0, protein_g: 18, fat_g: 0.9, cholesterol_mg: 55 }),
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
  "no.": "whole",
  no: "whole",
  nos: "whole",
};

const GENERIC_GRAMS: Record<string, number> = {
  g: 1,
  kg: 1000,
  ml: 1, mL: 1,
  l: 1000, L: 1000,
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
  const isToTaste = ingredient.isToTaste === true
    || /to taste|as needed/i.test(`${ingredient.amount ?? ""} ${ingredient.unit ?? ""}`)
    || /^(to taste|as needed)$/i.test((ingredient.name_en ?? "").trim());

  if (isToTaste || ingredient.optional) {
    return ingredient.garnish ? 0.25 : 0.5;
  }

  const effectiveQuantity = quantity ?? 1;
  const size = (ingredient as { size?: string | null }).size ?? null;
  const specific = ingredientSpecificUnitGrams(entity?.canonicalName ?? ingredient.name_en, unit, size);
  const base = specific ?? GENERIC_GRAMS[unit] ?? GENERIC_GRAMS[entity?.defaultUnit ?? "piece"] ?? 100;
  const edible = entity?.ediblePortion ?? 1;
  const density = unit === "ml" || unit === "l" ? entity?.density ?? 1 : 1;
  const garnishFactor = ingredient.garnish ? 0.25 : 1;

  return Number((effectiveQuantity * base * edible * density * garnishFactor).toFixed(2));
}

// Size-based default gram weights for common whole ingredients.
const SIZE_GRAM_WEIGHTS: Record<string, Record<string, number>> = {
  onion:        { small: 70,  medium: 110, large: 150, big: 150 },
  tomato:       { small: 80,  medium: 120, large: 160, big: 160 },
  egg:          { small: 45,  medium: 55,  large: 65,  xl: 75,  huge: 75 },
  potato:       { small: 100, medium: 170, large: 250, big: 250 },
  "sweet potato":{ small: 100, medium: 180, large: 280 },
  carrot:       { small: 50,  medium: 80,  large: 120 },
  lemon:        { small: 80,  medium: 100, large: 130 },
  lime:         { small: 50,  medium: 67,  large: 90  },
  apple:        { small: 130, medium: 180, large: 240 },
  banana:       { small: 90,  medium: 120, large: 150 },
  mango:        { small: 200, medium: 320, large: 450 },
  avocado:      { small: 120, medium: 170, large: 220 },
  garlic:       { small: 3,   medium: 5,   large: 7   },
  cucumber:     { small: 200, medium: 300, large: 400 },
  eggplant:     { small: 200, medium: 350, large: 500 },
  zucchini:     { small: 150, medium: 200, large: 300 },
  "bell pepper":{ small: 110, medium: 160, large: 220 },
};

function ingredientSpecificUnitGrams(name: string, unit: string, size?: string | null): number | null {
  // Size-aware weights (small/medium/large)
  if (size) {
    const lname = name.toLowerCase();
    const lsize = size.toLowerCase();
    for (const [key, weights] of Object.entries(SIZE_GRAM_WEIGHTS)) {
      if (lname.includes(key)) {
        const w = weights[lsize];
        if (w) return w;
      }
    }
  }
  if (unit === "leaf" && /coriander|cilantro/.test(name)) return 0.12;
  if (unit === "handful" && /coriander|cilantro|herb/.test(name)) return 8;
  if (unit === "pinch" && /salt/.test(name)) return 0.36;
  if (unit === "tsp" && /salt/.test(name)) return 6;
  if (unit === "cup" && /rice/.test(name)) return 185;
  if (unit === "piece" && /onion/.test(name)) return 110;
  if (unit === "piece" && /tomato/.test(name)) return 120;

  // Per-count (whole) weights for common items — overrides the generic 100g default
  if (unit === "whole") {
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
    weightConfidence: (ingredient.weightConfidence ?? (estimatedWeightGrams != null ? 'estimated' : 'unknown')) as 'exact' | 'measured' | 'estimated' | 'unknown',
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
