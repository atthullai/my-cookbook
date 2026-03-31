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

  // ✅ Always store ingredients as simple flat list (UI friendly)
  const [ingredientsList, setIngredientsList] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  // ✅ FETCH RECIPE
  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", recipeId)
        .single();

      if (error || !data) {
        router.push("/");
        return;
      }

      if (data.user_id !== user.id) {
        router.push("/");
        return;
      }

      setRecipe(data);

      // ✅ IMPORTANT: flatten ingredients for editing
      const flatIngredients =
        data.ingredients?.[0]?.items || [];

      setIngredientsList(flatIngredients);

      setLoading(false);
    };

    if (recipeId) fetchData();
  }, [recipeId, router]);

  // 🌍 TRANSLATE (unchanged)
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

  // ✅ UPDATE INGREDIENT
  const updateIngredient = (
    index: number,
    field: "amount" | "unit" | "name",
    value: string
  ) => {
    const updated = [...ingredientsList];
    updated[index][field] = value;
    setIngredientsList(updated);
  };

  // ✅ ADD
  const addIngredient = () => {
    setIngredientsList([
      ...ingredientsList,
      { amount: "", unit: "", name: "" },
    ]);
  };

  // ✅ DELETE
  const removeIngredient = (index: number) => {
    setIngredientsList(
      ingredientsList.filter((_, i) => i !== index)
    );
  };

  // ✅ SAVE
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const autoTitleDe =
      recipe.title_de || (await translate(recipe.title_en));

    const autoStepsDe =
      recipe.steps_de || (await translate(recipe.steps_en));

    // ✅ CLEAN INGREDIENTS (THIS FIXES NaN)
    const cleanIngredients = ingredientsList.map((i) => ({
      name: i.name || "",
      unit: i.unit || "",
      amount:
        i.amount === "" || i.amount === null
          ? null
          : Number(i.amount),
    }));

    const { error } = await supabase
      .from("recipes")
      .update({
        title_en: recipe.title_en,
        title_de: autoTitleDe,
        category: recipe.category,
        tags: recipe.tags,

        // ✅ ALWAYS SAVE STRUCTURED
        ingredients: [
          {
            group: "Main",
            items: cleanIngredients,
          },
        ],

        steps_en: recipe.steps_en,
        steps_de: autoStepsDe,
      })
      .eq("id", recipeId);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/");
  };

  if (loading) {
    return (
      <main className="container">
        <p>Loading recipe...</p>
      </main>
    );
  }

  return (
    <main className="container">
      <Link href="/">← Back</Link>

      <h1>Edit Recipe</h1>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        {/* TITLE */}
        <input
          className="input"
          value={recipe.title_en}
          onChange={(e) =>
            setRecipe({ ...recipe, title_en: e.target.value })
          }
        />

        <input
          className="input"
          value={recipe.title_de || ""}
          onChange={(e) =>
            setRecipe({ ...recipe, title_de: e.target.value })
          }
        />

        {/* CATEGORY */}
        <input
          className="input"
          value={recipe.category || ""}
          onChange={(e) =>
            setRecipe({ ...recipe, category: e.target.value })
          }
        />

        {/* TAGS */}
        <input
          className="input"
          value={(recipe.tags || []).join(", ")}
          onChange={(e) =>
            setRecipe({
              ...recipe,
              tags: e.target.value.split(",").map((t) => t.trim()),
            })
          }
        />

        {/* INGREDIENTS */}
        <div>
          <h3>Ingredients</h3>

          {ingredientsList.map((ing, i) => (
            <div
              key={i}
              style={{ display: "flex", gap: 6, marginBottom: 6 }}
            >
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
                placeholder="Name"
                value={ing.name}
                onChange={(e) =>
                  updateIngredient(i, "name", e.target.value)
                }
              />

              <button
                type="button"
                onClick={() => removeIngredient(i)}
              >
                ❌
              </button>
            </div>
          ))}

          <button type="button" onClick={addIngredient}>
            + Add Ingredient
          </button>
        </div>

        {/* STEPS */}
        <textarea
          className="input"
          value={recipe.steps_en}
          onChange={(e) =>
            setRecipe({ ...recipe, steps_en: e.target.value })
          }
        />

        <textarea
          className="input"
          value={recipe.steps_de || ""}
          onChange={(e) =>
            setRecipe({ ...recipe, steps_de: e.target.value })
          }
        />

        <button className="button button-primary">
          Save Changes
        </button>
      </form>
    </main>
  );
}