"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { RecipeRecord } from "@/lib/recipe-types";
import { getCuratedRecipeBySlug } from "@/data/curated-recipes";
import { normalizeRecipe, parseRecipeId } from "@/lib/recipe-types";
import { supabase } from "@/lib/supabase";
import RecipeClient from "./RecipeClient";

export default function RecipePage() {
  const params = useParams();
  const rawRecipeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const recipeId = parseRecipeId(rawRecipeId);

  const [recipe, setRecipe] = useState<RecipeRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchRecipe = async () => {
      const curatedRecipe = rawRecipeId ? getCuratedRecipeBySlug(rawRecipeId) : null;

      if (curatedRecipe) {
        setRecipe(curatedRecipe);
        setLoading(false);
        return;
      }

      if (!recipeId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from("recipes").select("*").eq("id", recipeId).single();

      if (!isMounted) {
        return;
      }

      if (error || !data) {
        setRecipe(null);
      } else {
        const normalizedRecipe = normalizeRecipe(data);
        setRecipe(normalizedRecipe.title_en === "Choux Au Craquelin (Cream Puff)" ? null : normalizedRecipe);
      }

      setLoading(false);
    };

    void fetchRecipe();

    return () => {
      isMounted = false;
    };
  }, [rawRecipeId, recipeId]);

  if (loading) {
    return (
      <main className="container">
        <p>Loading...</p>
      </main>
    );
  }

  if (!recipe) {
    return (
      <main className="container">
        <Link href="/">← Back</Link>
        <p style={{ marginTop: 16 }}>Recipe not found.</p>
      </main>
    );
  }

  return (
    <main className="container">
      <Link href="/">← Back</Link>

      {/* Render the full interactive recipe view in a dedicated client component. */}
      <RecipeClient recipe={recipe} />
    </main>
  );
}
