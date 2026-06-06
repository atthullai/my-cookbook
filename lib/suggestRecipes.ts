// lib/suggestRecipes.ts
// Cross-matches pantry items against all recipes.
// Returns recipes ranked by required-ingredient coverage — 100% first, then by % desc.

import type { RecipeRecord } from "@/lib/recipe-types";
import type { PantryItem } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RecipeMatch = {
  recipe: RecipeRecord;
  matchedCount: number;       // required ingredients found in pantry
  totalRequired: number;      // non-optional, non-garnish ingredients
  coveragePercent: number;    // matchedCount / totalRequired * 100
  missingIngredients: string[];
  canMakeNow: boolean;        // coveragePercent === 100
  expiringUsed: number;       // matched ingredients that are expiring soon
};

const EXPIRY_SOON_DAYS = 3;

// ─── Normalise helper ─────────────────────────────────────────────────────────

function norm(s: string | null | undefined): string {
  return (s ?? "").toLowerCase().trim().replace(/\s+/g, " ");
}

// ─── Main function ────────────────────────────────────────────────────────────

export function suggestRecipes(
  pantryItems: PantryItem[],
  allRecipes: RecipeRecord[],
  options: { minCoverage?: number; maxResults?: number } = {}
): RecipeMatch[] {
  const { minCoverage = 40, maxResults = 20 } = options;

  // Build lookup sets from pantry for fast O(1) matching
  const pantryLibraryIds = new Set(
    pantryItems
      .map((p) => (p as PantryItem & { libraryId?: string }).libraryId)
      .filter(Boolean) as string[]
  );
  const pantryNormNames = new Set(pantryItems.map((p) => norm(p.name)));

  // Names/ids of pantry items that are expiring soon (or already past) — used to
  // boost recipes that help "use them up".
  const now = Date.now();
  const isExpiringSoon = (p: PantryItem) => {
    if (!p.expiryDate) return false;
    const daysLeft = Math.ceil((new Date(p.expiryDate).getTime() - now) / 86_400_000);
    return daysLeft <= EXPIRY_SOON_DAYS;
  };
  const expiringNames = new Set(pantryItems.filter(isExpiringSoon).map((p) => norm(p.name)));
  const expiringLibraryIds = new Set(
    pantryItems.filter(isExpiringSoon)
      .map((p) => (p as PantryItem & { libraryId?: string }).libraryId)
      .filter(Boolean) as string[],
  );
  const isExpiringMatch = (item: { libraryId?: string | null; name_en?: string }): boolean => {
    if (item.libraryId && expiringLibraryIds.has(item.libraryId)) return true;
    return Boolean(norm(item.name_en) && expiringNames.has(norm(item.name_en)));
  };

  function isPantryMatch(item: {
    libraryId?: string | null;
    name_en?: string;
    optional?: boolean;
    garnish?: boolean;
  }): boolean {
    if (item.libraryId && pantryLibraryIds.has(item.libraryId)) return true;
    if (norm(item.name_en) && pantryNormNames.has(norm(item.name_en))) return true;
    return false;
  }

  const matches: RecipeMatch[] = [];

  for (const recipe of allRecipes) {
    const allItems = (recipe.ingredients ?? []).flatMap((g) => g.items ?? []);
    const requiredItems = allItems.filter((item) => !item.optional && !item.garnish);

    if (requiredItems.length === 0) continue;

    const matchedItems  = requiredItems.filter(isPantryMatch);
    const missingItems  = requiredItems.filter((item) => !isPantryMatch(item));
    const matchedCount  = matchedItems.length;
    const totalRequired = requiredItems.length;
    const coveragePercent = Math.round((matchedCount / totalRequired) * 100);

    if (coveragePercent < minCoverage) continue;

    const missingIngredients = [
      ...new Set(missingItems.map((i) => i.name_en ?? "").filter(Boolean)),
    ];

    matches.push({
      recipe,
      matchedCount,
      totalRequired,
      coveragePercent,
      missingIngredients,
      canMakeNow: coveragePercent === 100,
      expiringUsed: matchedItems.filter(isExpiringMatch).length,
    });
  }

  // Sort: can-make-now first → uses more expiring items → coverage % desc → fewest missing
  matches.sort((a, b) => {
    if (a.canMakeNow !== b.canMakeNow) return a.canMakeNow ? -1 : 1;
    if (b.expiringUsed !== a.expiringUsed) return b.expiringUsed - a.expiringUsed;
    if (b.coveragePercent !== a.coveragePercent) return b.coveragePercent - a.coveragePercent;
    return a.missingIngredients.length - b.missingIngredients.length;
  });

  return matches.slice(0, maxResults);
}
