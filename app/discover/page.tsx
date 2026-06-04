"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { mapRecipeRows } from "@/lib/recipe-db";
import { toRecipeSummaries } from "@/lib/recipe-adapter";
import { useRecipeSearch } from "@/hooks/useRecipeSearch";
import RecipeCard from "@/components/RecipeCard";
import { RecipeSearchBar } from "@/components/RecipeSearchBar";
import type { RecipeSummary } from "@/types";

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

export default function DiscoverPage() {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    setTitleQuery,
    ingredientFilter,
    setIngredientFilter,
    filteredRecipes,
    isFiltering,
  } = useRecipeSearch(recipes);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("recipes")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) {
        const rows = mapRecipeRows(data);
        setRecipes(toRecipeSummaries(rows));
      }
      setLoading(false);
    })();
  }, []);

  const displayed = isFiltering ? filteredRecipes : recipes;

  return (
    <main className="discover-page">
      <div className="discover-header">
        <h1 className="discover-title">Discover</h1>
        <p className="discover-subtitle">All recipes from the kitchen</p>
      </div>

      <div className="discover-search">
        <RecipeSearchBar
          onTitleSearch={setTitleQuery}
          onIngredientFilter={setIngredientFilter}
          activeIngredient={ingredientFilter}
          placeholder="Search recipes…"
        />
      </div>

      {loading ? (
        <p style={{ padding: "2rem", color: "var(--muted)" }}>Loading…</p>
      ) : displayed.length === 0 ? (
        <p style={{ padding: "2rem", color: "var(--muted)" }}>No recipes found.</p>
      ) : (
        <motion.div
          className="discover-grid"
          variants={gridVariants}
          initial="hidden"
          animate="visible"
        >
          {displayed.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </motion.div>
      )}
    </main>
  );
}
