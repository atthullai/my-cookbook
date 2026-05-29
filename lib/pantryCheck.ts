/**
 * Pantry sufficiency check — recipe vs available pantry stock.
 * Runs client-side after fetching pantry_items once.
 * Uses FIFO ordering (oldest expiry first) and virtual reservations.
 */
import { convertToBase } from "@/lib/conversion";

export interface PantryStockItem {
  name:         string;
  quantity_base: number;
  base_unit:    string;
  expiry_date:  string | null;
  depleted:     boolean;
}

export interface RecipeIngredientRow {
  name:       string;
  quantity:   number | null;
  unit:       string | null;
  pantry_ref: string | null;
}

export interface Reservation {
  meal_id:      string;
  pantry_ref:   string;
  reserved_base: number;
}

export type IngredientStatus = {
  name:           string;
  pantry_ref:     string | null;
  needed_base:    number;
  available_base: number;
  base_unit:      string;
  status:         "sufficient" | "partial" | "unavailable" | "skipped";
};

export type MealCheckResult = {
  overall:     "sufficient" | "partial" | "unavailable";
  ingredients: IngredientStatus[];
};

export function checkMeal(
  ingredients:    RecipeIngredientRow[],
  planned_servings: number,
  base_servings:  number,
  pantryItems:    PantryStockItem[],
  reservations:   Reservation[],
  this_meal_id:   string
): MealCheckResult {
  const scale = planned_servings / Math.max(base_servings, 1);

  const results: IngredientStatus[] = ingredients.map((ing) => {
    const qty = (ing.quantity ?? 1) * scale;
    const { base, baseUnit, tier } = convertToBase(qty, ing.unit ?? "", ing.name);

    // Tier 3 or no pantry ref → skip
    if (tier === 3 || base <= 0) {
      return {
        name: ing.name,
        pantry_ref: ing.pantry_ref,
        needed_base: 0,
        available_base: 0,
        base_unit: baseUnit,
        status: "skipped",
      };
    }

    const ref = (ing.pantry_ref ?? ing.name).toLowerCase();

    // Sum available stock, FIFO order (oldest expiry first)
    const entries = pantryItems
      .filter((p) => p.name.toLowerCase() === ref && !p.depleted && p.quantity_base > 0)
      .sort((a, b) => {
        if (!a.expiry_date && !b.expiry_date) return 0;
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return a.expiry_date < b.expiry_date ? -1 : 1;
      });

    // Subtract reservations from other meals
    const otherReserved = reservations
      .filter((r) => r.pantry_ref.toLowerCase() === ref && r.meal_id !== this_meal_id)
      .reduce((s, r) => s + r.reserved_base, 0);

    const totalStock = entries.reduce((s, e) => s + e.quantity_base, 0);
    const available  = Math.max(0, totalStock - otherReserved);

    const status: IngredientStatus["status"] =
      available <= 0    ? "unavailable" :
      available < base  ? "partial"     :
                          "sufficient";

    return {
      name:           ing.name,
      pantry_ref:     ing.pantry_ref,
      needed_base:    Math.round(base),
      available_base: Math.round(available),
      base_unit:      baseUnit,
      status,
    };
  });

  const statuses = results.map((r) => r.status).filter((s) => s !== "skipped");
  const overall: MealCheckResult["overall"] =
    statuses.includes("unavailable") ? "unavailable" :
    statuses.includes("partial")     ? "partial"     :
                                       "sufficient";

  return { overall, ingredients: results };
}

/** Build initial reservations from already-checked meals */
export function buildReservations(
  meals: Array<{ id: string; checkResult: MealCheckResult }>
): Reservation[] {
  const reservations: Reservation[] = [];
  for (const { id, checkResult } of meals) {
    for (const ing of checkResult.ingredients) {
      if (ing.status === "sufficient" || ing.status === "partial") {
        if (ing.pantry_ref && ing.needed_base > 0) {
          reservations.push({
            meal_id:       id,
            pantry_ref:    ing.pantry_ref,
            reserved_base: Math.min(ing.needed_base, ing.available_base),
          });
        }
      }
    }
  }
  return reservations;
}
