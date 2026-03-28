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

  useEffect(() => {
  const fetchRecipe = async () => {
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("id", recipeId)
      .single();

    if (error) {
      console.error(error);
    } else {
      setRecipe(data);
    }
  };

  if (recipeId) fetchRecipe();
}, [recipeId]);

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

  if (!recipe) return <p className="p-6">Loading...</p>;

  return (
    <main className="p-6 max-w-2xl mx-auto">
      {/* Back */}
      <Link href="/" className="inline-block mb-4 underline">
        ← Back
      </Link>

      {/* Header with language toggle */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit Recipe</h1>

        <button
          onClick={() => setLang(lang === "en" ? "de" : "en")}
          className="px-3 py-1 border rounded-lg"
        >
          {lang === "en" ? "DE" : "EN"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* TITLE */}
        <input
          value={lang === "en" ? recipe.title_en : recipe.title_de}
          onChange={(e) =>
            setRecipe({
              ...recipe,
              [lang === "en" ? "title_en" : "title_de"]: e.target.value,
            })
          }
          className="w-full p-2 border rounded"
          placeholder={lang === "en" ? "Title" : "Titel"}
        />

        {/* CATEGORY */}
        <input
          value={recipe.category}
          onChange={(e) =>
            setRecipe({ ...recipe, category: e.target.value })
          }
          className="w-full p-2 border rounded"
          placeholder="Category"
        />

        {/* TAGS */}
        <input
          value={recipe.tags.join(", ")}
          onChange={(e) =>
            setRecipe({
              ...recipe,
              tags: e.target.value.split(",").map((t) => t.trim()),
            })
          }
          className="w-full p-2 border rounded"
          placeholder="Tags (comma separated)"
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
          className="w-full p-2 border rounded"
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
          className="w-full p-2 border rounded"
          placeholder={lang === "en" ? "Steps" : "Zubereitung"}
        />

        <button className="px-4 py-2 bg-black text-white rounded">
          Save Changes
        </button>
      </form>
    </main>
  );
}