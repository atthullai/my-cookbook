"use client";

import { useState } from "react";

import Link from "next/link";

import { supabase } from "@/lib/supabase";

export default function AddRecipe() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");

  const handleSubmit = async (e: any) => {
  e.preventDefault();

    const user = await supabase.auth.getUser();

    const { error } = await supabase.from("recipes").insert([
      {
        user_id: user.data.user?.id, // 👈 THIS IS THE IMPORTANT LINE
        title_en: title,
        title_de: title,
        category,
        tags: tags.split(",").map((t) => t.trim()),
        ingredients_en: ingredients,
        ingredients_de: ingredients,
        steps_en: steps,
        steps_de: steps,
      },
   ]);

    if (error) {
      console.error(error);
      if (error) {
        console.error(error);
        alert(error.message);
      }
    } else {
      alert("Recipe saved!");
     window.location.href = "/";
    }
  };

  return (
    <main className="p-6 max-w-2xl mx-auto">

        <Link
            href="/"
            className="inline-block mb-4 text-sm underline"
        >
            ← Back to recipes
        </Link>

      <h1 className="text-3xl font-bold mb-6">Add Recipe</h1>

        {/* form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          className="w-full p-2 border rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          type="text"
          placeholder="Category (Breakfast, Lunch...)"
          className="w-full p-2 border rounded"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <input
          type="text"
          placeholder="Tags (comma separated: rice, spicy)"
          className="w-full p-2 border rounded"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />

        <textarea
          placeholder="Ingredients"
          className="w-full p-2 border rounded"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
        />

        <textarea
          placeholder="Steps"
          className="w-full p-2 border rounded"
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
        />

        <button className="px-4 py-2 bg-black text-white rounded">
          Add Recipe
        </button>
      </form>
    </main>
  );
}