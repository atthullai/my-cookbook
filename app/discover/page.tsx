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
    <main className="container">
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700 }}>Discover</h1>
        <p style={{ color: "var(--muted)", marginTop: "4px", fontSize: "0.875rem" }}>
          All recipes from the kitchen
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "1.5rem" }}>
        <RecipeSearchBar
          onTitleSearch={setTitleQuery}
          onIngredientFilter={setIngredientFilter}
          activeIngredient={ingredientFilter}
          placeholder="Search recipes…"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      ) : displayed.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No recipes found.</p>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
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
