"use client";

// RECIPE ROUTE WRAPPER MAP
// This file reads the recipe id from the URL, loads that recipe from Supabase, and handles loading/not-found.
// The pretty recipe display is in RecipeClient.tsx so this wrapper stays small.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { RecipeRecord } from "@/lib/recipe-types";
import { normalizeRecipe, parseRecipeId } from "@/lib/recipe-types";
import { supabase } from "@/lib/supabase";
import RecipeClient from "./RecipeClient";

export default function RecipePage() {
  // Read the dynamic route param and normalize it into a numeric recipe id.
  const params = useParams();
  const recipeId = parseRecipeId(params.id);

  // This wrapper fetches the recipe; RecipeClient handles display logic and interactions.
  const [recipe, setRecipe] = useState<RecipeRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Guard against setting state if the component unmounts before Supabase returns.
    let isMounted = true;

    const fetchRecipe = async () => {
      if (!recipeId) {
        setLoading(false);
        return;
      }

      // Fetch the latest recipe row directly from Supabase so edits show immediately.
      const { data, error } = await supabase.from("recipes").select("*").eq("id", recipeId).single();

      if (!isMounted) return;

      if (error || !data) {
        setRecipe(null);
      } else {
        // Convert the raw DB row into the normalized front-end recipe shape.
        setRecipe(normalizeRecipe(data));
      }

      setLoading(false);
    };

    void fetchRecipe();

    return () => {
      isMounted = false;
    };
  }, [recipeId]);

  if (loading) {
    return (
      <main className="container">
        <div className="empty-state">Loading recipe...</div>
      </main>
    );
  }

  if (!recipe) {
    return (
      <main className="container">
        <Link href="/" className="back-link">
          Back to cookbook
        </Link>
        <div className="empty-state">Recipe not found.</div>
      </main>
    );
  }

  return (
    <main className="container">
      <Link href="/" className="back-link">
        Back to cookbook
      </Link>
      {/* The client component renders bilingual text, scaling, checklists, and print layout. */}
      <RecipeClient recipe={recipe} />
    </main>
  );
}
