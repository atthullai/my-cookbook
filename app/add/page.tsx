"use client";

import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import Link from "next/link";

// ✅ TYPE for ingredients (fixes your error)
type Ingredient = {
  name: string;
  amount: string;
  unit: string;
};

export default function AddRecipe() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ✅ BASIC FIELDS
  const [title, setTitle] = useState("");
  const [titleDe, setTitleDe] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");

  const [steps, setSteps] = useState("");
  const [stepsDe, setStepsDe] = useState("");

  // ✅ STRUCTURED INGREDIENTS
  const [ingredientsList, setIngredientsList] = useState<Ingredient[]>([
    { name: "", amount: "", unit: "" },
  ]);

  // 🔐 check login
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

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
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|de`
      );
      const data = await res.json();
      return data.responseData.translatedText;
    } catch {
      return text;
    }
  };

  // ➕ add ingredient row
  const addIngredient = () => {
    setIngredientsList([
      ...ingredientsList,
      { name: "", amount: "", unit: "" },
    ]);
  };

  // ✏️ update ingredient (FIXED TYPE)
  const updateIngredient = (
    index: number,
    field: keyof Ingredient,
    value: string
  ) => {
    const updated = [...ingredientsList];
    updated[index][field] = value;
    setIngredientsList(updated);
  };

  // 🚀 submit
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // ✅ remove empty ingredients
    const cleanedIngredients = ingredientsList.filter(
      (ing) => ing.name.trim() !== ""
    );

    if (cleanedIngredients.length === 0) {
      alert("Please add at least one ingredient");
      return;
    }

    // 🌍 translate if needed
    const autoTitleDe = titleDe || (await translate(title));
    const autoStepsDe = stepsDe || (await translate(steps));

    const { error } = await supabase.from("recipes").insert([
      {
        user_id: user.id,

        title_en: title,
        title_de: autoTitleDe,

        category,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],

        // ✅ New Structured Ingredients
        ingredients: [
          {
            group: "Main",
            items: ingredientsList,
          },
        ],

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

  // ⏳ loading
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

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        {/* TITLE */}
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (EN)"
        />

        <input
          className="input"
          value={titleDe}
          onChange={(e) => setTitleDe(e.target.value)}
          placeholder="Title (DE)"
        />

        {/* CATEGORY + TAGS */}
        <input
          className="input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
        />

        <input
          className="input"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (comma separated)"
        />

        {/* 🧠 INGREDIENTS */}
        <h3>Ingredients</h3>

        {ingredientsList.map((ing, i) => (
          <div key={i} style={{ display: "flex", gap: 8 }}>
            <input
              className="input"
              placeholder="Amount"
              value={ing.amount}
              onChange={(e) =>
                updateIngredient(i, "amount", e.target.value)
              }
            />

            <input
              className="input"
              placeholder="Unit"
              value={ing.unit}
              onChange={(e) =>
                updateIngredient(i, "unit", e.target.value)
              }
            />

            <input
              className="input"
              placeholder="Ingredient"
              value={ing.name}
              onChange={(e) =>
                updateIngredient(i, "name", e.target.value)
              }
            />
          </div>
        ))}

        <button
          type="button"
          className="button"
          onClick={addIngredient}
        >
          + Add Ingredient
        </button>

        {/* STEPS */}
        <textarea
          className="input"
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          placeholder="Steps (EN)"
        />

        <textarea
          className="input"
          value={stepsDe}
          onChange={(e) => setStepsDe(e.target.value)}
          placeholder="Steps (DE)"
        />

        <button className="button button-primary">
          Save Recipe
        </button>
      </form>
    </main>
  );
}