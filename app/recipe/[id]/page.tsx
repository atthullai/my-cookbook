"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { RecipeRecord } from "@/lib/recipe-types";
import { normalizeRecipe, parseRecipeId } from "@/lib/recipe-types";
import { supabase } from "@/lib/supabase";
import RecipeClient from "./RecipeClient";

export default function RecipePage() {
  const params = useParams();
  const recipeId = parseRecipeId(params.id);

  const [recipe, setRecipe] = useState<RecipeRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchRecipe = async () => {
      if (!recipeId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from("recipes").select("*").eq("id", recipeId).single();

      if (!isMounted) return;

      if (error || !data) {
        setRecipe(null);
      } else {
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
      <RecipeClient recipe={recipe} />
    </main>
  );
}
