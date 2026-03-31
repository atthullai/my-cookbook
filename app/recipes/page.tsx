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

  const starterRecipeBySlug = new Map(starterRecipes.map((recipe) => [recipe.slug, recipe]));

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
      const staleStarterRecipes = normalizedRecipes.filter((recipe) => {
        const starterTemplate = starterRecipeBySlug.get(recipe.slug);

        if (!starterTemplate) {
          return false;
        }

        return (
          (!recipe.tips_en && !!starterTemplate.tips_en) ||
          (!recipe.storage_en && !!starterTemplate.storage_en) ||
          ((recipe.faq?.length ?? 0) < (starterTemplate.faq?.length ?? 0)) ||
          ((recipe.troubleshooting?.length ?? 0) < (starterTemplate.troubleshooting?.length ?? 0)) ||
          ((recipe.step_photos?.length ?? 0) < (starterTemplate.step_photos?.length ?? 0)) ||
          (!recipe.nutrition && !!starterTemplate.nutrition) ||
          recipe.image_urls.length < starterTemplate.image_urls.length ||
          (!recipe.video_url && !!starterTemplate.video_url) ||
          recipe.equipment.length < starterTemplate.equipment.length ||
          recipe.servings !== starterTemplate.servings
        );
      });

      if (staleStarterRecipes.length > 0) {
        await Promise.all(
          staleStarterRecipes.map((recipe) => {
            const starterTemplate = starterRecipeBySlug.get(recipe.slug);

            if (!starterTemplate) {
              return Promise.resolve();
            }

            return supabase
              .from("recipes")
              .update({
                title_en: starterTemplate.title_en,
                title_de: starterTemplate.title_de,
                author_name: starterTemplate.author_name,
                learned_from: starterTemplate.learned_from,
                description_en: starterTemplate.description_en,
                description_de: starterTemplate.description_de,
                category: starterTemplate.category,
                tags: starterTemplate.tags,
                ingredients: starterTemplate.ingredients,
                steps_en: starterTemplate.steps_en,
                steps_de: starterTemplate.steps_de,
                notes_en: starterTemplate.notes_en,
                notes_de: starterTemplate.notes_de,
                tips_en: starterTemplate.tips_en,
                tips_de: starterTemplate.tips_de,
                storage_en: starterTemplate.storage_en,
                storage_de: starterTemplate.storage_de,
                nutrition: starterTemplate.nutrition,
                faq: starterTemplate.faq,
                troubleshooting: starterTemplate.troubleshooting,
                step_photos: starterTemplate.step_photos,
                source_url: starterTemplate.source_url,
                video_url: starterTemplate.video_url,
                servings: starterTemplate.servings,
                equipment: starterTemplate.equipment,
                image_urls: starterTemplate.image_urls,
              })
              .eq("id", recipe.id)
          })
        );

        setRecipes(
          normalizedRecipes.map((recipe) => {
            const starterTemplate = starterRecipeBySlug.get(recipe.slug);

            return starterTemplate && staleStarterRecipes.some((item) => item.id === recipe.id)
              ? {
                  ...recipe,
                  ...starterTemplate,
                }
              : recipe;
          })
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
