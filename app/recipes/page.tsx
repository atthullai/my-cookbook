"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { mapRecipeRows } from "@/lib/recipe-db";
import type { RecipeRecord } from "@/lib/recipe-types";
import { supabase } from "@/lib/supabase";

export default function RecipeIndexPage() {
  const [recipes, setRecipes] = useState<RecipeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecipes = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    // The index page is meant to be structured and browsable, so we sort first by category
    // and then alphabetically inside each category.
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("user_id", user.id)
      .order("category", { ascending: true })
      .order("title_en", { ascending: true });

    if (error) {
      alert(error.message);
      setRecipes([]);
    } else {
      setRecipes(mapRecipeRows(data ?? []));
    }

    setLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      await loadRecipes();
    };

    void load();
  }, []);

  const categories = Array.from(new Set(recipes.map((recipe) => recipe.category).filter(Boolean)));

  return (
    <main className="container">
      <h1>Recipe Index</h1>
      <p>A structured overview of your Supabase cookbook, grouped by category.</p>

      {loading ? <p>Loading recipes...</p> : null}

      {categories.map((category) => (
        <section key={category} style={{ marginTop: 28 }}>
          <h2 style={{ marginBottom: 12 }}>{category}</h2>
          <div style={{ display: "grid", gap: 14 }}>
            {recipes
              .filter((recipe) => recipe.category === category)
              .map((recipe) => (
                <div key={recipe.id} className="card">
                  <Link href={`/recipe/${recipe.id}`}>
                    <h3 style={{ marginBottom: 8 }}>{recipe.title_en}</h3>
                  </Link>
                  <p style={{ marginBottom: 8 }}>{recipe.description_en}</p>
                  <p style={{ marginBottom: 0 }}>
                    By {recipe.author_name}
                    {recipe.learned_from ? ` • Learned from ${recipe.learned_from}` : ""}
                  </p>
                </div>
              ))}
          </div>
        </section>
      ))}
    </main>
  );
}
