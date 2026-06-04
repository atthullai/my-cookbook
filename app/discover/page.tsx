"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { mapRecipeRows } from "@/lib/recipe-db";
import { toRecipeSummaries } from "@/lib/recipe-adapter";
import { useRecipeSearch } from "@/hooks/useRecipeSearch";
import RecipeCard from "@/components/RecipeCard";
import { RecipeSearchBar } from "@/components/RecipeSearchBar";
import ConfirmDialog from "@/components/ConfirmDialog";
import { isCreator } from "@/lib/creator";
import type { RecipeSummary } from "@/types";

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

export default function DiscoverPage() {
  const router = useRouter();
  const [recipes, setRecipes]           = useState<RecipeSummary[]>([]);
  const [loading, setLoading]           = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RecipeSummary | null>(null);

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
      // Get current user (may be null if not logged in)
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      const { data } = await supabase
        .from("recipes")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false });
      if (data) {
        const rows = mapRecipeRows(data);
        setRecipes(toRecipeSummaries(rows));
      }
      setLoading(false);
    })();
  }, []);

  async function handleDelete(recipe: RecipeSummary) {
    await supabase.from("recipes").delete().eq("id", parseInt(recipe.id));
    setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
    setPendingDelete(null);
  }

  const creatorLoggedIn = isCreator(currentUserId);

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
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onEdit={creatorLoggedIn ? () => router.push(`/edit/${recipe.id}`) : undefined}
              onDelete={creatorLoggedIn ? () => setPendingDelete(recipe) : undefined}
            />
          ))}
        </motion.div>
      )}
      {pendingDelete && (
        <ConfirmDialog
          open={true}
          title="Delete recipe?"
          message={`"${pendingDelete.title}" will be permanently removed from Discover.`}
          confirmLabel="Delete"
          onConfirm={() => handleDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </main>
  );
}
