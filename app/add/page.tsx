"use client";

import { supabase } from "@/lib/supabase";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function EditRecipe() {
  const router = useRouter();
  const params = useParams();

  const recipeId = Number(params.id);

  const [lang, setLang] = useState<"en" | "de">("en");
  const [recipe, setRecipe] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      // 🔐 get user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUser(user);

      // 📦 get recipe
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

      // 🔒 OWNER CHECK (VERY IMPORTANT)
      if (data.user_id !== user.id) {
        alert("Not allowed");
        router.push("/");
        return;
      }

      setRecipe(data);
    };

    if (recipeId) fetchData();
  }, [recipeId, router]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const { error } = await supabase
      .from("recipes")
      .update({
        title_en: recipe.title_en,
        title_de: recipe.title_de,
        category: recipe.category,
        tags: recipe.tags,
        ingredients_en: recipe.ingredients_en,
        ingredients_de: recipe.ingredients_de,
        steps_en: recipe.steps_en,
        steps_de: recipe.steps_de,
      })
      .eq("id", recipeId);

    if (error) {
      console.error(error);
      alert("Error updating recipe");
    } else {
      alert("Recipe updated!");
      router.push("/");
    }
  };

  if (!recipe) return <p style={{ padding: 20 }}>Loading...</p>;

  return (
    <main style={{ maxWidth: 700, margin: "auto", padding: 20 }}>
      {/* Back */}
      <Link href="/" style={{ display: "inline-block", marginBottom: 10 }}>
        ← Back
      </Link>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h1>Edit Recipe</h1>

        <button onClick={() => setLang(lang === "en" ? "de" : "en")}>
          {lang === "en" ? "DE" : "EN"}
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* TITLE */}
        <input
          value={lang === "en" ? recipe.title_en : recipe.title_de}
          onChange={(e) =>
            setRecipe({
              ...recipe,
              [lang === "en" ? "title_en" : "title_de"]: e.target.value,
            })
          }
          placeholder={lang === "en" ? "Title" : "Titel"}
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

        {/* INGREDIENTS */}
        <textarea
          value={
            lang === "en"
              ? recipe.ingredients_en
              : recipe.ingredients_de
          }
          onChange={(e) =>
            setRecipe({
              ...recipe,
              [
                lang === "en"
                  ? "ingredients_en"
                  : "ingredients_de"
              ]: e.target.value,
            })
          }
          placeholder={lang === "en" ? "Ingredients" : "Zutaten"}
        />

        {/* STEPS */}
        <textarea
          value={
            lang === "en" ? recipe.steps_en : recipe.steps_de
          }
          onChange={(e) =>
            setRecipe({
              ...recipe,
              [lang === "en" ? "steps_en" : "steps_de"]: e.target.value,
            })
          }
          placeholder={lang === "en" ? "Steps" : "Zubereitung"}
        />

        <button>Save Changes</button>
      </form>
    </main>
  );
}