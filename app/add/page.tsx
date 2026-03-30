"use client";

import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function AddRecipe() {
  const [user, setUser] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [titleDe, setTitleDe] = useState("");

  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");

  const [ingredients, setIngredients] = useState("");
  const [ingredientsDe, setIngredientsDe] = useState("");

  const [steps, setSteps] = useState("");
  const [stepsDe, setStepsDe] = useState("");

  const [loading, setLoading] = useState(true);

  // 🔐 check login
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUser(user);
      setLoading(false);
    };

    checkUser();
  }, []);

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

    const autoTitleDe = titleDe || (await translate(title));
    const autoIngredientsDe =
      ingredientsDe || (await translate(ingredients));
    const autoStepsDe = stepsDe || (await translate(steps));

    const { error } = await supabase.from("recipes").insert([
      {
        user_id: user.id,
        title_en: title,
        title_de: autoTitleDe,
        category,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        ingredients_en: ingredients,
        ingredients_de: autoIngredientsDe,
        steps_en: steps,
        steps_de: autoStepsDe,
      },
    ]);

    if (error) {
      alert(error.message);
    } else {
      alert("Recipe added!");
      window.location.href = "/";
    }
  };

  if (loading) {
    return (
      <main className="container">
        <p>Checking login...</p>
      </main>
    );
  }

  return (
    <main className="container">
      <Link href="/">← Back</Link>

      <h1>Add Recipe</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>

        {/* EN */}
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (EN)" />
        <textarea className="input" value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="Ingredients (EN)" />
        <textarea className="input" value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="Steps (EN)" />

        {/* DE */}
        <input className="input" value={titleDe} onChange={(e) => setTitleDe(e.target.value)} placeholder="Title (DE)" />
        <textarea className="input" value={ingredientsDe} onChange={(e) => setIngredientsDe(e.target.value)} placeholder="Ingredients (DE)" />
        <textarea className="input" value={stepsDe} onChange={(e) => setStepsDe(e.target.value)} placeholder="Steps (DE)" />

        {/* GENERAL */}
        <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" />
        <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags" />

        <button className="button button-primary">Add Recipe</button>
      </form>
    </main>
  );
}