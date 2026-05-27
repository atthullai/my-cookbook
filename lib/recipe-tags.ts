/**
 * Recipe tag metadata and auto-classification helpers.
 *
 * TAG_META maps every RecipeTag to display properties (label, emoji, color classes).
 * getCardTags() returns the highest-priority subset for recipe cards.
 * mergeAutoTags() enriches manual tags with auto-detected ones from time/nutrition.
 */

import type { RecipeTag, NutritionInfo } from "@/types";

export interface TagMeta {
  label: string;
  emoji: string;
  /** Tailwind bg class */
  color: string;
  /** Tailwind text class */
  textColor: string;
  /** Tailwind border class */
  borderColor: string;
  /** Lower number = shown first on cards */
  priority: number;
  description: string;
}

export const TAG_META: Record<RecipeTag, TagMeta> = {
  veg: {
    label: "Veg", emoji: "🌿",
    color: "bg-green-100", textColor: "text-green-800", borderColor: "border-green-300",
    priority: 1, description: "Vegetarian",
  },
  vegan: {
    label: "Vegan", emoji: "🌱",
    color: "bg-emerald-100", textColor: "text-emerald-800", borderColor: "border-emerald-300",
    priority: 2, description: "Fully plant-based",
  },
  "non-veg": {
    label: "Non-Veg", emoji: "🍗",
    color: "bg-orange-100", textColor: "text-orange-800", borderColor: "border-orange-300",
    priority: 3, description: "Contains meat or seafood",
  },
  "gluten-free": {
    label: "Gluten-Free", emoji: "🫙",
    color: "bg-yellow-100", textColor: "text-yellow-800", borderColor: "border-yellow-300",
    priority: 4, description: "No gluten",
  },
  "dairy-free": {
    label: "Dairy-Free", emoji: "🥛",
    color: "bg-blue-100", textColor: "text-blue-800", borderColor: "border-blue-300",
    priority: 5, description: "No dairy",
  },
  spicy: {
    label: "Spicy", emoji: "🌶️",
    color: "bg-red-100", textColor: "text-red-700", borderColor: "border-red-300",
    priority: 6, description: "Has a kick",
  },
  "very-spicy": {
    label: "Very Spicy", emoji: "🔥",
    color: "bg-red-200", textColor: "text-red-900", borderColor: "border-red-500",
    priority: 7, description: "Fiery hot",
  },
  "high-protein": {
    label: "High Protein", emoji: "💪",
    color: "bg-purple-100", textColor: "text-purple-800", borderColor: "border-purple-300",
    priority: 8, description: "20g+ protein per serving",
  },
  "low-calorie": {
    label: "Low Cal", emoji: "⚖️",
    color: "bg-teal-100", textColor: "text-teal-800", borderColor: "border-teal-300",
    priority: 9, description: "Under 400 kcal",
  },
  healthy: {
    label: "Healthy", emoji: "🫀",
    color: "bg-lime-100", textColor: "text-lime-800", borderColor: "border-lime-300",
    priority: 10, description: "Balanced & nutritious",
  },
  quick: {
    label: "Quick", emoji: "⚡",
    color: "bg-amber-100", textColor: "text-amber-800", borderColor: "border-amber-300",
    priority: 11, description: "Under 30 minutes",
  },
  "freezer-friendly": {
    label: "Freezer-Friendly", emoji: "🧊",
    color: "bg-sky-100", textColor: "text-sky-800", borderColor: "border-sky-300",
    priority: 12, description: "Freezes well",
  },
  "family-favourite": {
    label: "Family Fave", emoji: "❤️",
    color: "bg-pink-100", textColor: "text-pink-800", borderColor: "border-pink-300",
    priority: 13, description: "A household classic",
  },
  festive: {
    label: "Festive", emoji: "🎉",
    color: "bg-violet-100", textColor: "text-violet-800", borderColor: "border-violet-300",
    priority: 14, description: "For celebrations",
  },
  "street-food": {
    label: "Street Food", emoji: "🛺",
    color: "bg-orange-100", textColor: "text-orange-800", borderColor: "border-orange-300",
    priority: 15, description: "Street-food inspired",
  },
  "comfort-food": {
    label: "Comfort Food", emoji: "🤗",
    color: "bg-stone-100", textColor: "text-stone-800", borderColor: "border-stone-300",
    priority: 16, description: "Warm & soul-soothing",
  },
};

/** Maximum number of tag badges shown on a recipe card */
export const MAX_CARD_BADGES = 4;

/**
 * Returns up to MAX_CARD_BADGES tags sorted by priority.
 * Used in RecipeCard to avoid badge overflow.
 */
export function getCardTags(tags: RecipeTag[]): RecipeTag[] {
  return [...tags]
    .sort((a, b) => TAG_META[a].priority - TAG_META[b].priority)
    .slice(0, MAX_CARD_BADGES);
}

/**
 * Merges manually assigned tags with auto-detected tags derived from
 * cook time and nutrition. Deduplicates the result.
 */
export function mergeAutoTags(
  manual: RecipeTag[],
  totalMins: number,
  nutrition?: NutritionInfo
): RecipeTag[] {
  const auto: RecipeTag[] = [];
  if (totalMins <= 30) auto.push("quick");
  if (nutrition?.protein != null && nutrition.protein >= 20) auto.push("high-protein");
  if (nutrition?.calories != null && nutrition.calories <= 400) auto.push("low-calorie");
  return Array.from(new Set([...manual, ...auto]));
}

/**
 * Maps legacy badge strings (from the existing RecipeRecord.badges array)
 * to the new RecipeTag type where possible.
 */
export function legacyBadgeToTag(badge: string): RecipeTag | null {
  const map: Record<string, RecipeTag> = {
    "Veg":           "veg",
    "Vegan":         "vegan",
    "Non-Veg":       "non-veg",
    "Spicy":         "spicy",
    "High Protein":  "high-protein",
    "Quick Meal":    "quick",
    "Festival":      "festive",
    "One Pot":       "comfort-food",
  };
  return map[badge] ?? null;
}

/** All tag values in priority order — useful for filter chips */
export const ALL_TAGS = Object.keys(TAG_META) as RecipeTag[];
