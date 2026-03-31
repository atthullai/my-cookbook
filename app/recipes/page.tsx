"use client";

import { useEffect, useEffectEvent, useState } from "react";
import Link from "next/link";
import { starterRecipes } from "@/data/starter-recipes";
import { mapRecipeRows } from "@/lib/recipe-db";
import type { RecipeRecord } from "@/lib/recipe-types";
import { supabase } from "@/lib/supabase";

export default function RecipeIndexPage() {
  const [recipes, setRecipes] = useState<RecipeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const chouxTemplate = starterRecipes.find((recipe) => recipe.slug === "choux-au-craquelin");

  const loadRecipes = useEffectEvent(async () => {
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
      const normalizedRecipes = mapRecipeRows(data ?? []);
      const staleChouxRecipes = normalizedRecipes.filter(
        (recipe) =>
          recipe.slug === "choux-au-craquelin" &&
          chouxTemplate &&
          (recipe.image_urls.length < chouxTemplate.image_urls.length ||
            !recipe.video_url ||
            recipe.servings !== chouxTemplate.servings)
      );

      if (chouxTemplate && staleChouxRecipes.length > 0) {
        await Promise.all(
          staleChouxRecipes.map((recipe) =>
            supabase
              .from("recipes")
              .update({
                title_en: chouxTemplate.title_en,
                title_de: chouxTemplate.title_de,
                author_name: chouxTemplate.author_name,
                learned_from: chouxTemplate.learned_from,
                description_en: chouxTemplate.description_en,
                description_de: chouxTemplate.description_de,
                category: chouxTemplate.category,
                tags: chouxTemplate.tags,
                ingredients: chouxTemplate.ingredients,
                steps_en: chouxTemplate.steps_en,
                steps_de: chouxTemplate.steps_de,
                notes_en: chouxTemplate.notes_en,
                notes_de: chouxTemplate.notes_de,
                tips_en: chouxTemplate.tips_en,
                tips_de: chouxTemplate.tips_de,
                storage_en: chouxTemplate.storage_en,
                storage_de: chouxTemplate.storage_de,
                faq: chouxTemplate.faq,
                troubleshooting: chouxTemplate.troubleshooting,
                step_photos: chouxTemplate.step_photos,
                source_url: chouxTemplate.source_url,
                video_url: chouxTemplate.video_url,
                servings: chouxTemplate.servings,
                equipment: chouxTemplate.equipment,
                image_urls: chouxTemplate.image_urls,
              })
              .eq("id", recipe.id)
          )
        );

        setRecipes(
          normalizedRecipes.map((recipe) =>
            recipe.slug === "choux-au-craquelin"
              ? {
                  ...recipe,
                  ...chouxTemplate,
                }
              : recipe
          )
        );
      } else {
        setRecipes(normalizedRecipes);
      }
    }

    setLoading(false);
  });

  useEffect(() => {
    void loadRecipes();
  }, []);

  const categories = Array.from(new Set(recipes.map((recipe) => recipe.category).filter(Boolean)));

  const handleDelete = async (recipeId: number) => {
    const confirmed = window.confirm("Delete this recipe?");
    if (!confirmed) return;

    const { error } = await supabase.from("recipes").delete().eq("id", recipeId);
    if (error) {
      alert(error.message);
      return;
    }

    setRecipes((current) => current.filter((recipe) => recipe.id !== recipeId));
  };

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
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ flex: "1 1 320px", minWidth: 0 }}>
                      <Link href={`/recipe/${recipe.id}`}>
                        <h3 style={{ marginBottom: 8 }}>{recipe.title_en}</h3>
                      </Link>
                      <p style={{ marginBottom: 8 }}>{recipe.description_en}</p>
                      <p style={{ marginBottom: 0 }}>
                        By {recipe.author_name}
                        {recipe.learned_from ? ` • Learned from ${recipe.learned_from}` : ""}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Link href={`/edit/${recipe.id}`} className="button">
                        Edit
                      </Link>
                      <button className="button button-danger" type="button" onClick={() => void handleDelete(recipe.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>
      ))}
    </main>
  );
}
