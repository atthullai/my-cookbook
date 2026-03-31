"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { FormEvent } from "react";
import RecipeForm from "@/components/RecipeForm";
import type { AppUser, RecipeIngredient, RecipeRecord } from "@/lib/recipe-types";
import { EMPTY_INGREDIENT, normalizeRecipe, parseRecipeId, parseTagInput } from "@/lib/recipe-types";
import { supabase } from "@/lib/supabase";
import type { IngredientDraft } from "@/lib/recipe-types";

export default function EditRecipe() {
  const router = useRouter();
  const params = useParams();
  const recipeId = parseRecipeId(params.id);

  const [user, setUser] = useState<AppUser | null>(null);
  const [recipe, setRecipe] = useState<RecipeRecord | null>(null);
  const [ingredientsList, setIngredientsList] = useState<IngredientDraft[]>([{ ...EMPTY_INGREDIENT }]);
  const [tagsInput, setTagsInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchRecipe = async () => {
      if (!recipeId) {
        router.push("/");
        return;
      }

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

      const { data, error } = await supabase.from("recipes").select("*").eq("id", recipeId).single();

      if (!isMounted) {
        return;
      }

      if (error || !data) {
        router.push("/");
        return;
      }

      const normalizedRecipe = normalizeRecipe(data);

      if (normalizedRecipe.user_id !== currentUser.id) {
        router.push("/");
        return;
      }

      setRecipe(normalizedRecipe);
      setTagsInput(normalizedRecipe.tags.join(", "));

      const firstGroupItems = normalizedRecipe.ingredients[0]?.items ?? [];
      setIngredientsList(
        firstGroupItems.length > 0
          ? firstGroupItems.map((ingredient) => ({
              name: ingredient.name,
              unit: ingredient.unit,
              amount: ingredient.amount === null ? "" : String(ingredient.amount),
            }))
          : [{ ...EMPTY_INGREDIENT }]
      );

      setLoading(false);
    };

    void fetchRecipe();

    return () => {
      isMounted = false;
    };
  }, [recipeId, router]);

  // Keep translation isolated so you can replace this with DeepL without touching page structure.
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

  const updateIngredient = (index: number, field: keyof IngredientDraft, value: string) => {
    setIngredientsList((currentIngredients) =>
      currentIngredients.map((ingredient, currentIndex) =>
        currentIndex === index ? { ...ingredient, [field]: value } : ingredient
      )
    );
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

    if (!recipe || !recipeId || !user) {
      alert("Recipe is not ready to save yet.");
      return;
    }

    const cleanedIngredients = buildIngredientPayload();

    if (cleanedIngredients.length === 0) {
      alert("Please keep at least one ingredient.");
      return;
    }

    setSaving(true);

    const autoTitleDe = recipe.title_de?.trim() || (await translate(recipe.title_en));
    const autoStepsDe = recipe.steps_de?.trim() || (await translate(recipe.steps_en));

    const { error } = await supabase
      .from("recipes")
      .update({
        title_en: recipe.title_en.trim(),
        title_de: autoTitleDe,
        category: recipe.category?.trim() ?? "",
        tags: parseTagInput(tagsInput),
        ingredients: [
          {
            group: recipe.ingredients[0]?.group || "Main",
            items: cleanedIngredients,
          },
        ],
        steps_en: recipe.steps_en.trim(),
        steps_de: autoStepsDe,
      })
      .eq("id", recipeId)
      .eq("user_id", user.id);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push(`/recipe/${recipeId}`);
  };

  if (loading || !recipe) {
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
      {/* The shared form keeps add/edit aligned as the recipe model grows. */}
      <RecipeForm
        title={recipe.title_en}
        titleDe={recipe.title_de ?? ""}
        category={recipe.category ?? ""}
        tags={tagsInput}
        steps={recipe.steps_en}
        stepsDe={recipe.steps_de ?? ""}
        ingredients={ingredientsList}
        saving={saving}
        submitLabel="Save Changes"
        onSubmit={handleSubmit}
        onTitleChange={(value) => setRecipe((currentRecipe) => currentRecipe && { ...currentRecipe, title_en: value })}
        onTitleDeChange={(value) => setRecipe((currentRecipe) => currentRecipe && { ...currentRecipe, title_de: value })}
        onCategoryChange={(value) => setRecipe((currentRecipe) => currentRecipe && { ...currentRecipe, category: value })}
        onTagsChange={setTagsInput}
        onStepsChange={(value) => setRecipe((currentRecipe) => currentRecipe && { ...currentRecipe, steps_en: value })}
        onStepsDeChange={(value) => setRecipe((currentRecipe) => currentRecipe && { ...currentRecipe, steps_de: value })}
        onIngredientAdd={addIngredient}
        onIngredientRemove={removeIngredient}
        onIngredientChange={updateIngredient}
      />
    </main>
  );
}
