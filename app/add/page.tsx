"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AddRecipe() {
  const [title, setTitle] = useState("");
  const [titleDe, setTitleDe] = useState("");

  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");

  const [ingredients, setIngredients] = useState("");
  const [ingredientsDe, setIngredientsDe] = useState("");

  const [steps, setSteps] = useState("");
  const [stepsDe, setStepsDe] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in!");
      return;
    }

    const { error } = await supabase.from("recipes").insert([
      {
        user_id: user.id,

        // EN
        title_en: title,
        ingredients_en: ingredients,
        steps_en: steps,

        // DE
        title_de: titleDe,
        ingredients_de: ingredientsDe,
        steps_de: stepsDe,

        category,
        tags: tags.split(",").map((t) => t.trim()),
      },
    ]);

    if (error) {
      console.error(error);
      alert(error.message);
    } else {
      alert("Recipe saved!");
      window.location.href = "/";
    }
  };

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <Link href="/" className="inline-block mb-4 text-sm underline">
        ← Back to recipes
      </Link>

      <h1 className="text-3xl font-bold mb-6">Add Recipe</h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ENGLISH */}
        <h2 className="font-semibold text-lg">English 🇬🇧</h2>

        <input
          type="text"
          placeholder="Title (EN)"
          className="w-full p-2 border rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Ingredients (EN)"
          className="w-full p-2 border rounded"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
        />

        <textarea
          placeholder="Steps (EN)"
          className="w-full p-2 border rounded"
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
        />

        {/* GERMAN */}
        <h2 className="font-semibold text-lg mt-6">German 🇩🇪</h2>

        <input
          type="text"
          placeholder="Title (DE)"
          className="w-full p-2 border rounded"
          value={titleDe}
          onChange={(e) => setTitleDe(e.target.value)}
        />

        <textarea
          placeholder="Ingredients (DE)"
          className="w-full p-2 border rounded"
          value={ingredientsDe}
          onChange={(e) => setIngredientsDe(e.target.value)}
        />

        <textarea
          placeholder="Steps (DE)"
          className="w-full p-2 border rounded"
          value={stepsDe}
          onChange={(e) => setStepsDe(e.target.value)}
        />

        {/* SHARED */}
        <h2 className="font-semibold text-lg mt-6">General</h2>

        <input
          type="text"
          placeholder="Category"
          className="w-full p-2 border rounded"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <input
          type="text"
          placeholder="Tags (comma separated)"
          className="w-full p-2 border rounded"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />

        <button className="px-4 py-2 bg-black text-white rounded">
          Add Recipe
        </button>
      </form>
    </main>
  );
}