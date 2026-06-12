/**
 * Central TypeScript types for the entire app.
 *
 * Rule of thumb:
 * - `RecipeRecord` (in lib/recipe-types.ts) is the raw database shape — used when reading/writing Supabase.
 * - `Recipe` / `RecipeSummary` here are the display/feature types — used in components, pages, and new features.
 * - `lib/recipe-adapter.ts` bridges the two worlds.
 */

// ---------------------------------------------------------------------------
// Cuisine origin — 20 values covering Indian regional + global cuisines
// ---------------------------------------------------------------------------
export type CuisineOrigin =
  | "indian-tamil-nadu"
  | "indian-andhra"
  | "indian-karnataka"
  | "indian-kerala"
  | "indian-north"
  | "indian-rajasthan"
  | "indian-bengal"
  | "indian-goa"
  | "indian-maharashtra"
  | "indian-gujarat"
  | "german"
  | "austrian"
  | "french"
  | "italian"
  | "chinese"
  | "japanese"
  | "thai"
  | "mexican"
  | "american"
  | "other";

// ---------------------------------------------------------------------------
// Recipe tags — 16 semantic tags used for filtering and auto-classification
// ---------------------------------------------------------------------------
export type RecipeTag =
  | "spicy"
  | "very-spicy"
  | "veg"
  | "vegan"
  | "non-veg"
  | "high-protein"
  | "low-calorie"
  | "quick"
  | "gluten-free"
  | "dairy-free"
  | "family-favourite"
  | "freezer-friendly"
  | "street-food"
  | "festive"
  | "healthy"
  | "comfort-food";

// ---------------------------------------------------------------------------
// Nutrition
// ---------------------------------------------------------------------------
export interface NutritionInfo {
  /** Per-serving calories in kcal */
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  /** Sodium in mg */
  sodium: number;
  /** Serving size in grams */
  servingSize: number;
}

export type NutritionStatus = "calculated" | "manual" | "pending" | "failed";

export type NutritionSource = "ifct" | "usda" | "estimated" | "unknown";
export type NutritionConfidence = "exact" | "approximate" | "estimate";

export interface NutritionBadgeProps {
  source: NutritionSource;
  confidence: NutritionConfidence;
  unmatchedCount?: number;
  totalCount?: number;
}

// ---------------------------------------------------------------------------
// Recipe building blocks
// ---------------------------------------------------------------------------
export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  iconKey?: string;
  notes?: string;
}

export interface Equipment {
  name: string;
  iconKey?: string;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
  durationMinutes?: number;
  tip?: string;
}

// ---------------------------------------------------------------------------
// Core Recipe type (display / feature layer)
// id is string to support UUID-style keys and String(numericId) conversions.
// ---------------------------------------------------------------------------
export interface Recipe {
  id: string;
  title: string;
  description?: string;
  cuisine: CuisineOrigin;
  tags: RecipeTag[];
  category?: string;
  imageUrl?: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  ingredients: Ingredient[];
  equipment?: Equipment[];
  steps: RecipeStep[];
  nutrition?: NutritionInfo;
  nutritionStatus: NutritionStatus;
  sourceUrl?: string;
  notes?: string;
  isFavourite: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Lightweight version used on listing pages and the meal planner sidebar */
export type RecipeSummary = Pick<
  Recipe,
  | "id"
  | "title"
  | "cuisine"
  | "tags"
  | "imageUrl"
  | "prepTimeMinutes"
  | "cookTimeMinutes"
  | "servings"
  | "nutrition"
  | "nutritionStatus"
  | "isFavourite"
  | "category"
> & {
  /** Flat list of ingredient links used for ingredient-based filtering in the recipe search. */
  ingredientLinks: { libraryId: string | null; name_en: string }[];
  /** Owner's user id — used to show Edit/Delete only to the recipe's owner. */
  ownerId: string | null;
};

// ---------------------------------------------------------------------------
// Meal Planner
// ---------------------------------------------------------------------------
export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

/** A planned meal is either a recipe or a manual/non-recipe entry. */
export type MealEntryType =
  | "recipe"
  | "restaurant"
  | "delivery"
  | "leftover"
  | "frozen"
  | "food"
  | "note"
  | "other";

export interface PlannedMeal {
  id: string;
  /** ISO date string e.g. "2026-05-27" */
  date: string;
  slot: MealSlot;
  /** Matches Recipe.id; empty string for manual (non-recipe) entries */
  recipeId: string;
  recipe?: RecipeSummary;
  servings: number;
  notes?: string;
  /** "recipe" for normal recipe meals; otherwise a manual entry kind */
  entryType?: MealEntryType;
  /** Free-text label for manual entries (e.g. "Pizza delivery") */
  label?: string;
  /** For leftovers: the planned_meals.id this leftover came from */
  leftoverOf?: string | null;
  /** Food entries: quantity + unit ("1 glass") and calories (typed or derived) */
  foodQty?: number | null;
  foodUnit?: string | null;
  foodKcal?: number | null;
}

export type WeekPlan = Record<string, PlannedMeal[]>;

// ---------------------------------------------------------------------------
// Shopping List
// ---------------------------------------------------------------------------
export type ShoppingCategory =
  | "produce"
  | "fresh-herbs"
  | "dairy"
  | "eggs"
  | "meat"
  | "fish-seafood"
  | "spices"
  | "grains-pulses"
  | "nuts-seeds"
  | "canned-dried"
  | "bakery"
  | "sauces-pastes"
  | "oils"
  | "frozen"
  | "beverages"
  | "other";

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: ShoppingCategory;
  checked: boolean;
  recipeIds: string[];
  notes?: string;
  source?: "planner" | "low-stock" | "manual";
}

// ---------------------------------------------------------------------------
// Pantry
// ---------------------------------------------------------------------------
export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: ShoppingCategory;
  storage: StorageLocation;
  expiryDate?: string;
  lowStockThreshold?: number;
  brand?: string;
  isHomemade: boolean;
  madeOn?: string;
  iconKey?: string;
  notes?: string;
  updatedAt: string;
  /** True once the item has been frozen — cannot be frozen again */
  isFrozen: boolean;
  /** True once opened — triggers opened-expiry countdown */
  isOpened: boolean;
  /** ISO date when the item was opened */
  openedDate?: string;
  /** Pfand deposit amount in € (null = no Pfand) */
  pfandAmount?: number | null;
  // ── v2 tracking axes (independent of storage zone) ──
  /** Who made it. Drives Pfand/barcode/made-on. Mirrors isHomemade. */
  source?: FoodSource;
  /** Can be eaten as-is (orthogonal to source — a store-bought yogurt is ready too). */
  isReady?: boolean;
  /** Fine at room-temp OR fridge (a "flex zone" item). */
  isFlex?: boolean;
  /** Recipe this item was produced from (homemade / bulk-prep). */
  recipeId?: string | null;
  /** Bulk-prep batch size in portions/servings. */
  portionsTotal?: number | null;
  /** Portions left — decremented as eaten. */
  portionsRemaining?: number | null;
  /** Per-item partial-unit weights, e.g. { slice: 30, whole: 110 } (grams). */
  unitProfile?: UnitProfile | null;
}

export type StorageLocation = "room-temp" | "fridge" | "freezer";

export type FoodSource = "store-bought" | "homemade";

/** Grams per named partial unit for an item (e.g. brioche { slice: 30 }). */
export type UnitProfile = Partial<Record<"slice" | "piece" | "whole" | "clove" | "scoop", number>>;

export type PantryItemStatus = "ok" | "expiring-soon" | "expired" | "low-stock";

// ---------------------------------------------------------------------------
// Supplements (serving-based, parallel to food)
// ---------------------------------------------------------------------------
export interface Supplement {
  id: string;
  name: string;
  brand?: string;
  servingsPerContainer?: number | null;
  servingsRemaining?: number | null;
  dailyServings: number;
  reorderAtDays: number;
  lastTakenOn?: string | null;
  notes?: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Consumption ("eat event") + saved quick combos
// ---------------------------------------------------------------------------
/** One food line inside an eat event / combo. */
export interface ConsumptionItem {
  ref: string;      // pantry name used for FIFO deduction
  name: string;     // display name
  qty: number;      // quantity entered by the user
  unit: string;     // unit entered (g, whole, slice, …)
  base?: number;    // resolved base quantity (g | ml | whole)
  baseUnit?: "g" | "ml" | "whole";
}

export interface ConsumptionSupplement {
  id: string;
  name: string;
  servings: number;
}

export interface ConsumptionEvent {
  id: string;
  label?: string;
  comboId?: string | null;
  items: ConsumptionItem[];
  supplements: ConsumptionSupplement[];
  loggedAt: string;
}

export interface QuickCombo {
  id: string;
  name: string;
  items: ConsumptionItem[];
  supplements: ConsumptionSupplement[];
  createdAt?: string;
}

// ---------------------------------------------------------------------------
// Diet Plan
// ---------------------------------------------------------------------------
export interface DietPlan {
  id: string;
  name: string;
  dailyCalorieTarget: number;
  macroTargets: {
    proteinPercent: number;
    carbPercent: number;
    fatPercent: number;
  };
  excludedTags?: RecipeTag[];
  preferredCuisines?: CuisineOrigin[];
  notes?: string;
}

// ---------------------------------------------------------------------------
// Recipe filter state (used by the recipes listing page)
// ---------------------------------------------------------------------------
export interface RecipeFilters {
  search: string;
  cuisines: CuisineOrigin[];
  tags: RecipeTag[];
  category: string | null;
  maxTotalTime: number | null;
  sortBy: "newest" | "oldest" | "name-az" | "calories-low" | "time-quick";
}
