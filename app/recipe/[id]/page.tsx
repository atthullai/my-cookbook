"use client";

// RECIPE ROUTE WRAPPER MAP
// This file reads the recipe id from the URL, loads that recipe from Supabase, and handles loading/not-found.
// The pretty recipe display is in RecipeClient.tsx so this wrapper stays small.

import { useCallback, useEffect, useState } from "react";
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
  const [errorMessage, setErrorMessage] = useState("");

  // Single fetch function used by both initial load (useEffect) and the Retry button.
  // Using useCallback so useEffect dependency stays stable across renders.
  const fetchRecipe = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    if (!recipeId) {
      setRecipe(null);
      setErrorMessage("Invalid recipe URL");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.from("recipes").select("*").eq("id", recipeId).single();

    if (error || !data) {
      setRecipe(null);
      setErrorMessage(error?.message || "This recipe may have been deleted");
    } else {
      setRecipe(normalizeRecipe(data));
    }

    setLoading(false);
  }, [recipeId]);

  useEffect(() => {
    // Guard against setting state if the component unmounts before Supabase returns.
    let isMounted = true;

    const run = async () => {
      await fetchRecipe();
      // fetchRecipe sets state synchronously after awaiting; if unmounted by then, bail out.
      // The isMounted guard here prevents the double-set of loading state on fast navigation.
      if (!isMounted) return;
    };

    void run();

    return () => {
      isMounted = false;
    };
  }, [fetchRecipe]);

  if (loading) {
    return (
      <main className="container">
        <div className="skeleton-page" aria-label="Recipe is still loading">
          <div className="skeleton-line wide" />
          <div className="skeleton-line" />
          <div className="skeleton-card" />
          <div className="skeleton-grid">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        </div>
      </main>
    );
  }

  if (!recipeId) {
    return (
      <main className="container">
        <Link href="/recipes" className="back-link">
          Back to cookbook
        </Link>
        <div className="empty-state empty-state-action">
          <h1>Invalid recipe URL</h1>
          <p>This recipe link does not include a valid recipe id.</p>
          <Link href="/recipes" className="button button-primary">Open recipe index</Link>
        </div>
      </main>
    );
  }

  if (!recipe) {
    return (
      <main className="container">
        <Link href="/recipes" className="back-link">
          Back to cookbook
        </Link>
        <div className="empty-state empty-state-action">
          <h1>Recipe not found</h1>
          <p>{errorMessage || "This recipe may have been deleted, private, still importing, or unavailable offline."}</p>
          <div className="section-link-grid">
            <button className="button button-primary" type="button" onClick={() => void fetchRecipe()}>
              Retry
            </button>
            <Link href="/recipes" className="button">Open recipe index</Link>
          </div>
        </div>
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
