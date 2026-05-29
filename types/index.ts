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
>;

// ---------------------------------------------------------------------------
// Meal Planner
// ---------------------------------------------------------------------------
export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export interface PlannedMeal {
  id: string;
  /** ISO date string e.g. "2026-05-27" */
  date: string;
  slot: MealSlot;
  /** Matches Recipe.id (string representation of the DB numeric id) */
  recipeId: string;
  recipe?: RecipeSummary;
  servings: number;
  notes?: string;
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
}

export type StorageLocation = "room-temp" | "fridge" | "freezer";

export type PantryItemStatus = "ok" | "expiring-soon" | "expired" | "low-stock";

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
