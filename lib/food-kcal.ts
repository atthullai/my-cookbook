// Calorie estimation for ad-hoc "food" entries (planner) from the ingredient
// library's per-100g nutrition cache. A user-typed kcal always wins; this is
// the fallback for items the library knows (e.g. "milk", "banana").
import { supabase } from "@/lib/supabase";
import { convertToBase } from "@/lib/conversion";

export interface KcalIndexEntry {
  name: string;
  synonyms: string[];
  kcalPer100: number;
}

let cached: Promise<KcalIndexEntry[]> | null = null;

/** Cached fetch of the ingredient kcal index (name + synonyms + kcal/100g). */
export function getKcalIndex(): Promise<KcalIndexEntry[]> {
  if (!cached) {
    cached = (async () => {
      try {
        const { data } = await supabase
          .from("ingredients")
          .select("name_en, synonyms, kcal_per_100g")
          .not("kcal_per_100g", "is", null);
        return (data ?? [])
          .map((r) => ({
            name: String(r.name_en ?? "").toLowerCase(),
            synonyms: ((r.synonyms as string[] | null) ?? []).map((s) => s.toLowerCase()),
            kcalPer100: Number(r.kcal_per_100g) || 0,
          }))
          .filter((r) => r.name && r.kcalPer100 > 0);
      } catch {
        return []; // nutrition columns may not be populated yet
      }
    })();
  }
  return cached;
}

/**
 * Estimate kcal for a food entry, e.g. ("milk", 1, "glass") → ~160.
 * Returns null when the library doesn't know the food or the unit
 * can't be converted (treats ml ≈ g for the per-100g math).
 */
export function estimateFoodKcal(
  name: string,
  qty: number,
  unit: string,
  index: KcalIndexEntry[],
): number | null {
  const q = name.toLowerCase().trim();
  if (!q || !(qty > 0)) return null;

  const entry =
    index.find((e) => e.name === q || e.synonyms.includes(q)) ??
    // word-boundary containment: "whole milk" → milk
    index.find((e) => new RegExp(`(^|\\s)${e.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(s?)(\\s|$)`).test(q));
  if (!entry) return null;

  let { base, baseUnit, tier } = convertToBase(qty, unit, name);
  // Count units ("1 whole banana") need grams for per-100g math — retry by
  // ingredient name so tier-2 piece weights apply (banana ≈ 120 g).
  if (baseUnit === "whole") {
    const byName = convertToBase(qty, "", name);
    if (byName.tier === 2 && byName.baseUnit !== "whole" && byName.base > 0) {
      ({ base, baseUnit, tier } = byName);
    } else {
      return null; // unknown piece weight — let the user type kcal instead
    }
  }
  if (tier === 3 || base <= 0) return null;
  return Math.round((base / 100) * entry.kcalPer100);
}
