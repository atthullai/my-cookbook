"use client";

import { supabase } from "@/lib/supabase";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function EditRecipe() {
  const router = useRouter();
  const params = useParams();

  const recipeId = Number(params.id);

  const [recipe, setRecipe] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", recipeId)
        .single();

      if (error || !data) {
        alert("Recipe not found");
        router.push("/");
        return;
      }

      // 🔒 OWNER CHECK
      if (data.user_id !== user.id) {
        alert("Not allowed");
        router.push("/");
        return;
      }

      setRecipe(data);
      setLoading(false);
    };

    if (recipeId) fetchData();
  }, [recipeId, router]);

  // 🌍 translate helper
  const translate = async (text: string) => {
    if (!text) return "";

    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          text
        )}&langpair=en|de`
      );
      const data = await res.json();
      return data.responseData.translatedText;
    } catch {
      return text;
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // 🤖 auto translate only if empty
    const autoTitleDe =
      recipe.title_de || (await translate(recipe.title_en));
    const autoIngredientsDe =
      recipe.ingredients_de ||
      (await translate(recipe.ingredients_en));
    const autoStepsDe =
      recipe.steps_de || (await translate(recipe.steps_en));

    const { error } = await supabase
      .from("recipes")
      .update({
        title_en: recipe.title_en,
        title_de: autoTitleDe,
        category: recipe.category,
        tags: recipe.tags,
        ingredients_en: recipe.ingredients_en,
        ingredients_de: autoIngredientsDe,
        steps_en: recipe.steps_en,
        steps_de: autoStepsDe,
      })
      .eq("id", recipeId);

    if (error) {
      alert("Error updating recipe");
    } else {
      alert("Updated!");
      router.push("/");
    }
  };

  // ⏳ LOADING STATE (FIXES YOUR ISSUE)
  if (loading) {
    return (
      <main style={{ padding: 20 }}>
        <p>Loading recipe...</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 700, margin: "auto", padding: 20 }}>
      <Link href="/" style={{ marginBottom: 10, display: "inline-block" }}>
        ← Back
      </Link>

      <h1>Edit Recipe</h1>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 10 }}
      >
        {/* TITLE EN */}
        <input
          value={recipe.title_en}
          onChange={(e) =>
            setRecipe({ ...recipe, title_en: e.target.value })
          }
          placeholder="Title (EN)"
        />

        {/* TITLE DE */}
        <input
          value={recipe.title_de || ""}
          onChange={(e) =>
            setRecipe({ ...recipe, title_de: e.target.value })
          }
          placeholder="Title (DE)"
        />

        {/* CATEGORY */}
        <input
          value={recipe.category || ""}
          onChange={(e) =>
            setRecipe({ ...recipe, category: e.target.value })
          }
          placeholder="Category"
        />

        {/* TAGS */}
        <input
          value={(recipe.tags || []).join(", ")}
          onChange={(e) =>
            setRecipe({
              ...recipe,
              tags: e.target.value.split(",").map((t) => t.trim()),
            })
          }
          placeholder="Tags"
        />

        {/* INGREDIENTS EN */}
        <textarea
          value={recipe.ingredients_en}
          onChange={(e) =>
            setRecipe({
              ...recipe,
              ingredients_en: e.target.value,
            })
          }
          placeholder="Ingredients (EN)"
        />

        {/* INGREDIENTS DE */}
        <textarea
          value={recipe.ingredients_de || ""}
          onChange={(e) =>
            setRecipe({
              ...recipe,
              ingredients_de: e.target.value,
            })
          }
          placeholder="Ingredients (DE)"
        />

        {/* STEPS EN */}
        <textarea
          value={recipe.steps_en}
          onChange={(e) =>
            setRecipe({
              ...recipe,
              steps_en: e.target.value,
            })
          }
          placeholder="Steps (EN)"
        />

        {/* STEPS DE */}
        <textarea
          value={recipe.steps_de || ""}
          onChange={(e) =>
            setRecipe({
              ...recipe,
              steps_de: e.target.value,
            })
          }
          placeholder="Steps (DE)"
        />

        <button>Save Changes</button>
      </form>
    </main>
  );
}