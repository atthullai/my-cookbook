// hooks/useRecipeSearch.ts
// Manages title search + ingredient filter state for the recipes page.
// filteredRecipes applies both filters — pass it as the base for any
// further badge / cuisine / time filtering in the page's useMemo.

import { useState, useMemo } from "react";
import type { IngredientResult } from "@/components/RecipeSearchBar";

// Minimal shape the hook needs — the actual RecipeSummary has more fields,
// but we only touch these. Type intersection keeps everything compatible.
type FilterableRecipe = {
  id: string;
  title: string;
  title_de?: string;
  ingredients?: Array<{
    items?: Array<{
      libraryId?: string | null;
      name_en?: string;
    }>;
  }>;
  [key: string]: unknown;
};

function normalise(s: string | null | undefined): string {
  return (s ?? "").toLowerCase().trim().replace(/\s+/g, " ");
}

export function useRecipeSearch<T extends FilterableRecipe>(allRecipes: T[]) {
  const [titleQuery, setTitleQuery]         = useState("");
  const [ingredientFilter, setIngredientFilter] = useState<IngredientResult | null>(null);

  const filteredRecipes = useMemo(() => {
    let result = allRecipes;

    // ── Title filter ──────────────────────────────────────────────────────
    if (titleQuery.trim()) {
      const q = normalise(titleQuery);
      result = result.filter(
        (r) => normalise(r.title).includes(q) || normalise(r.title_de).includes(q)
      );
    }

    // ── Ingredient filter ─────────────────────────────────────────────────
    if (ingredientFilter) {
      const libId   = ingredientFilter.id;
      const nameNorm = normalise(ingredientFilter.name_en);

      result = result.filter((recipe) => {
        const items = (recipe.ingredients ?? []).flatMap((g) => g.items ?? []);
        return items.some((item) => {
          // Prefer libraryId exact match — covers newly linked ingredients
          if (item.libraryId && item.libraryId === libId) return true;
          // Fall back to name_en exact match — covers old unlinked ingredients
          if (normalise(item.name_en) === nameNorm) return true;
          return false;
        });
      });
    }

    return result;
  }, [allRecipes, titleQuery, ingredientFilter]);

  const isFiltering = titleQuery.trim().length > 0 || ingredientFilter !== null;

  return {
    titleQuery,
    setTitleQuery,
    ingredientFilter,
    setIngredientFilter,
    filteredRecipes,
    isFiltering,
    clearAll: () => { setTitleQuery(""); setIngredientFilter(null); },
  };
}
