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
  /** Flat ingredient links added by toRecipeSummary — used for ingredient filtering */
  ingredientLinks?: Array<{
    libraryId?: string | null;
    name_en?: string;
  }>;
  [key: string]: unknown;
};

function normalise(s: string | null | undefined): string {
  return (s ?? "").toLowerCase().trim().replace(/\s+/g, " ");
}

export function useRecipeSearch<T extends FilterableRecipe>(allRecipes: T[]) {
  const [titleQuery, setTitleQuery]             = useState("");
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
      const libId    = ingredientFilter.id;
      const nameNorm = normalise(ingredientFilter.name_en);

      result = result.filter((recipe) => {
        const links = recipe.ingredientLinks ?? [];
        return links.some((link) => {
          // Prefer libraryId exact match — covers library-linked ingredients
          if (link.libraryId && link.libraryId === libId) return true;
          // Fall back to normalised name_en match — covers manually entered ingredients
          if (normalise(link.name_en) === nameNorm) return true;
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
