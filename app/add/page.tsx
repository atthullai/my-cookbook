"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { FormEvent } from "react";
import RecipeForm from "@/components/RecipeForm";
import { buildRecipePayload } from "@/lib/recipe-db";
import type { AppUser, EquipmentDraft, IngredientDraft } from "@/lib/recipe-types";
import { EMPTY_EQUIPMENT, EMPTY_INGREDIENT } from "@/lib/recipe-types";
import { supabase } from "@/lib/supabase";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AddRecipe() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [titleDe, setTitleDe] = useState("");
  const [authorName, setAuthorName] = useState("Saran");
  const [learnedFrom, setLearnedFrom] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionDe, setDescriptionDe] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [ingredientGroupEn, setIngredientGroupEn] = useState("Main");
  const [ingredientGroupDe, setIngredientGroupDe] = useState("Hauptteil");
  const [ingredientsList, setIngredientsList] = useState<IngredientDraft[]>([{ ...EMPTY_INGREDIENT }]);
  const [steps, setSteps] = useState("");
  const [stepsDe, setStepsDe] = useState("");
  const [notesEn, setNotesEn] = useState("");
  const [notesDe, setNotesDe] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [servings, setServings] = useState("");
  const [equipment, setEquipment] = useState<EquipmentDraft[]>([{ ...EMPTY_EQUIPMENT }]);
  const [imageUrls, setImageUrls] = useState("");

  useEffect(() => {
    let isMounted = true;

    const checkUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!isMounted) return;

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

  const translate = async (text: string) => {
    if (!text.trim()) return "";

    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|de`
      );
      const data = (await response.json()) as { responseData?: { translatedText?: string } };
      return data.responseData?.translatedText?.trim() || text;
    } catch {
      return text;
    }
  };

  const updateIngredient = (index: number, field: keyof IngredientDraft, value: string) => {
    setIngredientsList((current) => current.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const updateEquipment = (index: number, field: keyof EquipmentDraft, value: string) => {
    setEquipment((current) => current.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

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

    if (!ingredientsList.some((ingredient) => ingredient.name_en.trim())) {
      alert("Please add at least one ingredient.");
      return;
    }

    setSaving(true);

    const autoTitleDe = titleDe.trim() || (await translate(title));
    const autoDescriptionDe = descriptionDe.trim() || (descriptionEn.trim() ? await translate(descriptionEn) : "");
    const autoStepsDe = stepsDe.trim() || (await translate(steps));
    const autoNotesDe = notesDe.trim() || (notesEn.trim() ? await translate(notesEn) : "");
    const translatedEquipment = await Promise.all(
      equipment.map(async (item) => ({
        label_en: item.label_en,
        label_de: item.label_de.trim() || (item.label_en.trim() ? await translate(item.label_en) : ""),
      }))
    );
    const translatedIngredients = await Promise.all(
      ingredientsList.map(async (item) => ({
        ...item,
        name_de: item.name_de.trim() || (item.name_en.trim() ? await translate(item.name_en) : ""),
      }))
    );

    const payload = buildRecipePayload({
      slug: slugify(title),
      titleEn: title,
      titleDe: autoTitleDe,
      authorName,
      learnedFrom,
      descriptionEn,
      descriptionDe: autoDescriptionDe,
      category,
      tags,
      ingredients: translatedIngredients,
      ingredientGroupEn,
      ingredientGroupDe,
      stepsEn: steps,
      stepsDe: autoStepsDe,
      notesEn,
      notesDe: autoNotesDe,
      sourceUrl,
      videoUrl,
      servings,
      equipment: translatedEquipment,
      imageUrls,
    });

    const { error } = await supabase.from("recipes").insert([{ ...payload, user_id: user.id }]);

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

      <RecipeForm
        title={title}
        titleDe={titleDe}
        authorName={authorName}
        learnedFrom={learnedFrom}
        descriptionEn={descriptionEn}
        descriptionDe={descriptionDe}
        category={category}
        tags={tags}
        ingredientGroupEn={ingredientGroupEn}
        ingredientGroupDe={ingredientGroupDe}
        ingredients={ingredientsList}
        steps={steps}
        stepsDe={stepsDe}
        notesEn={notesEn}
        notesDe={notesDe}
        sourceUrl={sourceUrl}
        videoUrl={videoUrl}
        servings={servings}
        equipment={equipment}
        imageUrls={imageUrls}
        saving={saving}
        submitLabel="Save Recipe"
        onSubmit={handleSubmit}
        onTitleChange={setTitle}
        onTitleDeChange={setTitleDe}
        onAuthorNameChange={setAuthorName}
        onLearnedFromChange={setLearnedFrom}
        onDescriptionEnChange={setDescriptionEn}
        onDescriptionDeChange={setDescriptionDe}
        onCategoryChange={setCategory}
        onTagsChange={setTags}
        onIngredientGroupEnChange={setIngredientGroupEn}
        onIngredientGroupDeChange={setIngredientGroupDe}
        onIngredientAdd={() => setIngredientsList((current) => [...current, { ...EMPTY_INGREDIENT }])}
        onIngredientRemove={(index) =>
          setIngredientsList((current) => {
            const next = current.filter((_, i) => i !== index);
            return next.length > 0 ? next : [{ ...EMPTY_INGREDIENT }];
          })
        }
        onIngredientChange={updateIngredient}
        onStepsChange={setSteps}
        onStepsDeChange={setStepsDe}
        onNotesEnChange={setNotesEn}
        onNotesDeChange={setNotesDe}
        onSourceUrlChange={setSourceUrl}
        onVideoUrlChange={setVideoUrl}
        onServingsChange={setServings}
        onEquipmentAdd={() => setEquipment((current) => [...current, { ...EMPTY_EQUIPMENT }])}
        onEquipmentRemove={(index) =>
          setEquipment((current) => {
            const next = current.filter((_, i) => i !== index);
            return next.length > 0 ? next : [{ ...EMPTY_EQUIPMENT }];
          })
        }
        onEquipmentChange={updateEquipment}
        onImageUrlsChange={setImageUrls}
      />
    </main>
  );
}
