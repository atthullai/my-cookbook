"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { FormEvent } from "react";
import RecipeForm from "@/components/RecipeForm";
import type { AppUser, RecipeIngredient } from "@/lib/recipe-types";
import { EMPTY_INGREDIENT, parseTagInput } from "@/lib/recipe-types";
import { supabase } from "@/lib/supabase";
import type { IngredientDraft } from "@/lib/recipe-types";

export default function AddRecipe() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Keep the bilingual fields explicit now so DeepL can swap into the same flow later.
  const [title, setTitle] = useState("");
  const [titleDe, setTitleDe] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [steps, setSteps] = useState("");
  const [stepsDe, setStepsDe] = useState("");
  const [ingredientsList, setIngredientsList] = useState<IngredientDraft[]>([{ ...EMPTY_INGREDIENT }]);

  useEffect(() => {
    let isMounted = true;

    const checkUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);
      setLoading(false);
    };

    void checkUser();

    return () => {
      isMounted = false;
    };
  }, []);

  // Keep translation as a standalone helper so swapping MyMemory for DeepL stays easy.
  const translate = async (text: string) => {
    if (!text.trim()) {
      return "";
    }

    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|de`
      );
      const data = (await response.json()) as {
        responseData?: { translatedText?: string };
      };

      return data.responseData?.translatedText?.trim() || text;
    } catch {
      return text;
    }
  };

  const addIngredient = () => {
    setIngredientsList((currentIngredients) => [...currentIngredients, { ...EMPTY_INGREDIENT }]);
  };

  const removeIngredient = (index: number) => {
    setIngredientsList((currentIngredients) => {
      const nextIngredients = currentIngredients.filter((_, currentIndex) => currentIndex !== index);
      return nextIngredients.length > 0 ? nextIngredients : [{ ...EMPTY_INGREDIENT }];
    });
  };

  const updateIngredient = (index: number, field: keyof IngredientDraft, value: string) => {
    setIngredientsList((currentIngredients) =>
      currentIngredients.map((ingredient, currentIndex) =>
        currentIndex === index ? { ...ingredient, [field]: value } : ingredient
      )
    );
  };

  // Normalize ingredient rows before saving so create/edit/view pages all read the same structure.
  const buildIngredientPayload = (): RecipeIngredient[] =>
    ingredientsList
      .filter((ingredient) => ingredient.name.trim())
      .map((ingredient) => ({
        name: ingredient.name.trim(),
        unit: ingredient.unit.trim(),
        amount: ingredient.amount.trim() ? ingredient.amount.trim() : null,
      }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      alert("Please log in first.");
      return;
    }

    if (!title.trim()) {
      alert("Please add an English title.");
      return;
    }

    const cleanedIngredients = buildIngredientPayload();

    if (cleanedIngredients.length === 0) {
      alert("Please add at least one ingredient.");
      return;
    }

    setSaving(true);

    const autoTitleDe = titleDe.trim() || (await translate(title));
    const autoStepsDe = stepsDe.trim() || (await translate(steps));

    const { error } = await supabase.from("recipes").insert([
      {
        user_id: user.id,
        title_en: title.trim(),
        title_de: autoTitleDe,
        category: category.trim(),
        tags: parseTagInput(tags),
        ingredients: [
          {
            group: "Main",
            items: cleanedIngredients,
          },
        ],
        steps_en: steps.trim(),
        steps_de: autoStepsDe,
      },
    ]);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = "/";
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
      {/* Add and edit now share the same form component to avoid duplicated UI logic. */}
      <RecipeForm
        title={title}
        titleDe={titleDe}
        category={category}
        tags={tags}
        steps={steps}
        stepsDe={stepsDe}
        ingredients={ingredientsList}
        saving={saving}
        submitLabel="Save Recipe"
        onSubmit={handleSubmit}
        onTitleChange={setTitle}
        onTitleDeChange={setTitleDe}
        onCategoryChange={setCategory}
        onTagsChange={setTags}
        onStepsChange={setSteps}
        onStepsDeChange={setStepsDe}
        onIngredientAdd={addIngredient}
        onIngredientRemove={removeIngredient}
        onIngredientChange={updateIngredient}
      />
    </main>
  );
}
