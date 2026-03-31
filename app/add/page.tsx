"use client";

import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import Link from "next/link";

type Ingredient = {
  name: string;
  amount: string;
  unit: string;
};

export default function AddRecipe() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [titleDe, setTitleDe] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");

  const [steps, setSteps] = useState("");
  const [stepsDe, setStepsDe] = useState("");

  const [ingredientsList, setIngredientsList] = useState<Ingredient[]>([
    { name: "", amount: "", unit: "" },
  ]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return (window.location.href = "/login");
      setUser(user);
      setLoading(false);
    };
    checkUser();
  }, []);

  // 🌍 translation (SAFE)
  const translate = async (text: string) => {
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

  const addIngredient = () => {
    setIngredientsList([...ingredientsList, { name: "", amount: "", unit: "" }]);
  };

  const updateIngredient = (i: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredientsList];
    updated[i][field] = value;
    setIngredientsList(updated);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // ✅ CLEAN DATA
    const cleaned = ingredientsList
      .filter((i) => i.name.trim() !== "")
      .map((i) => ({
        name: i.name.trim(),
        unit: i.unit || "",
        amount: i.amount === "" ? null : Number(i.amount),
      }));

    let autoTitleDe = titleDe;
    let autoStepsDe = stepsDe;

    // ⚠️ prevent API crash
    if (!autoTitleDe) autoTitleDe = await translate(title);
    if (!autoStepsDe && steps.length < 400)
      autoStepsDe = await translate(steps);

    await supabase.from("recipes").insert([
      {
        user_id: user.id,
        title_en: title,
        title_de: autoTitleDe,
        category,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        ingredients: [{ group: "Main", items: cleaned }],
        steps_en: steps,
        steps_de: autoStepsDe,
      },
    ]);

    window.location.href = "/";
  };

  if (loading) return <p>Loading...</p>;

  return (
    <main className="container">
      <Link href="/">← Back</Link>
      <h1>Add Recipe</h1>

      {/* FORM */}
      <form onSubmit={handleSubmit}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
        <input value={titleDe} onChange={(e) => setTitleDe(e.target.value)} />

        <h3>Ingredients</h3>

        {ingredientsList.map((ing, i) => (
          <div key={i}>
            <input value={ing.amount} onChange={(e) => updateIngredient(i, "amount", e.target.value)} />
            <input value={ing.unit} onChange={(e) => updateIngredient(i, "unit", e.target.value)} />
            <input value={ing.name} onChange={(e) => updateIngredient(i, "name", e.target.value)} />
          </div>
        ))}

        <button type="button" onClick={addIngredient}>+ Add</button>

        <textarea value={steps} onChange={(e) => setSteps(e.target.value)} />
        <textarea value={stepsDe} onChange={(e) => setStepsDe(e.target.value)} />

        <button>Save</button>
      </form>
    </main>
  );
}