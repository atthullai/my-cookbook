"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { FormEvent } from "react";
import RecipeForm from "@/components/RecipeForm";
import { buildRecipePayload } from "@/lib/recipe-db";
import type { AppUser, EquipmentDraft, IngredientDraft, IngredientGroupDraft, RecipeRecord } from "@/lib/recipe-types";
import { EMPTY_EQUIPMENT, EMPTY_INGREDIENT, EMPTY_INGREDIENT_GROUP, normalizeRecipe, parseRecipeId } from "@/lib/recipe-types";
import { supabase } from "@/lib/supabase";

export default function EditRecipe() {
  const router = useRouter();
  const params = useParams();
  const recipeId = parseRecipeId(params.id);

  const [user, setUser] = useState<AppUser | null>(null);
  const [recipe, setRecipe] = useState<RecipeRecord | null>(null);
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
  const [ingredientGroups, setIngredientGroups] = useState<IngredientGroupDraft[]>([{ ...EMPTY_INGREDIENT_GROUP, items: [{ ...EMPTY_INGREDIENT }] }]);
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

    const fetchRecipe = async () => {
      if (!recipeId) {
        router.push("/");
        return;
      }

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!isMounted) return;
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);

      const { data, error } = await supabase.from("recipes").select("*").eq("id", recipeId).single();
      if (!isMounted) return;
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
      setTitle(normalizedRecipe.title_en);
      setTitleDe(normalizedRecipe.title_de || "");
      setAuthorName(normalizedRecipe.author_name || "Saran");
      setLearnedFrom(normalizedRecipe.learned_from || "");
      setDescriptionEn(normalizedRecipe.description_en || "");
      setDescriptionDe(normalizedRecipe.description_de || "");
      setCategory(normalizedRecipe.category || "");
      setTags(normalizedRecipe.tags.join(", "));
      setIngredientGroups(
        normalizedRecipe.ingredients.length
          ? normalizedRecipe.ingredients.map((group) => ({
              group_en: group.group_en,
              group_de: group.group_de,
              items: group.items.length
                ? group.items.map((item) => ({
                    name_en: item.name_en,
                    name_de: item.name_de,
                    amount: item.amount === null ? "" : String(item.amount),
                    unit: item.unit,
                  }))
                : [{ ...EMPTY_INGREDIENT }],
            }))
          : [{ ...EMPTY_INGREDIENT_GROUP, items: [{ ...EMPTY_INGREDIENT }] }]
      );
      setSteps(normalizedRecipe.steps_en);
      setStepsDe(normalizedRecipe.steps_de || "");
      setNotesEn(normalizedRecipe.notes_en || "");
      setNotesDe(normalizedRecipe.notes_de || "");
      setSourceUrl(normalizedRecipe.source_url || "");
      setVideoUrl(normalizedRecipe.video_url || "");
      setServings(normalizedRecipe.servings ? String(normalizedRecipe.servings) : "");
      setEquipment(
        normalizedRecipe.equipment.length
          ? normalizedRecipe.equipment.map((item) => ({ label_en: item.label_en, label_de: item.label_de }))
          : [{ ...EMPTY_EQUIPMENT }]
      );
      setImageUrls(normalizedRecipe.image_urls.join("\n"));
      setLoading(false);
    };

    void fetchRecipe();
    return () => {
      isMounted = false;
    };
  }, [recipeId, router]);

  const translate = async (text: string) => {
    if (!text.trim()) return "";
    try {
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|de`);
      const data = (await response.json()) as { responseData?: { translatedText?: string } };
      return data.responseData?.translatedText?.trim() || text;
    } catch {
      return text;
    }
  };

  const updateIngredientGroup = (groupIndex: number, field: keyof Omit<IngredientGroupDraft, "items">, value: string) => {
    setIngredientGroups((current) => current.map((group, index) => (index === groupIndex ? { ...group, [field]: value } : group)));
  };
  const updateIngredient = (groupIndex: number, ingredientIndex: number, field: keyof IngredientDraft, value: string) => {
    setIngredientGroups((current) =>
      current.map((group, currentGroupIndex) =>
        currentGroupIndex === groupIndex
          ? {
              ...group,
              items: group.items.map((ingredient, currentIngredientIndex) =>
                currentIngredientIndex === ingredientIndex ? { ...ingredient, [field]: value } : ingredient
              ),
            }
          : group
      )
    );
  };
  const updateEquipment = (index: number, field: keyof EquipmentDraft, value: string) => {
    setEquipment((current) => current.map((item, currentIndex) => (currentIndex === index ? { ...item, [field]: value } : item)));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !recipeId || !recipe) {
      alert("Recipe is not ready to save yet.");
      return;
    }

    setSaving(true);

    const autoTitleDe = titleDe.trim() || (await translate(title));
    const autoDescriptionDe = descriptionDe.trim() || (descriptionEn.trim() ? await translate(descriptionEn) : "");
    const autoStepsDe = stepsDe.trim() || (await translate(steps));
    const autoNotesDe = notesDe.trim() || (notesEn.trim() ? await translate(notesEn) : "");

    const translatedGroups = await Promise.all(
      ingredientGroups.map(async (group) => ({
        group_en: group.group_en,
        group_de: group.group_de.trim() || (group.group_en.trim() ? await translate(group.group_en) : ""),
        items: await Promise.all(
          group.items.map(async (ingredient) => ({
            ...ingredient,
            name_de: ingredient.name_de.trim() || (ingredient.name_en.trim() ? await translate(ingredient.name_en) : ""),
          }))
        ),
      }))
    );

    const translatedEquipment = await Promise.all(
      equipment.map(async (item) => ({
        label_en: item.label_en,
        label_de: item.label_de.trim() || (item.label_en.trim() ? await translate(item.label_en) : ""),
      }))
    );

    const payload = buildRecipePayload({
      slug: recipe.slug,
      titleEn: title,
      titleDe: autoTitleDe,
      authorName,
      learnedFrom,
      descriptionEn,
      descriptionDe: autoDescriptionDe,
      category,
      tags,
      ingredientGroups: translatedGroups,
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

    const { error } = await supabase.from("recipes").update(payload).eq("id", recipeId).eq("user_id", user.id);
    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push(`/recipe/${recipeId}`);
  };

  if (loading || !recipe) return <main className="container"><p>Loading recipe...</p></main>;

  return (
    <main className="container">
      <Link href="/">← Back</Link>
      <h1>Edit Recipe</h1>

      <RecipeForm
        title={title}
        titleDe={titleDe}
        authorName={authorName}
        learnedFrom={learnedFrom}
        descriptionEn={descriptionEn}
        descriptionDe={descriptionDe}
        category={category}
        tags={tags}
        ingredientGroups={ingredientGroups}
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
        submitLabel="Save Changes"
        onSubmit={handleSubmit}
        onTitleChange={setTitle}
        onTitleDeChange={setTitleDe}
        onAuthorNameChange={setAuthorName}
        onLearnedFromChange={setLearnedFrom}
        onDescriptionEnChange={setDescriptionEn}
        onDescriptionDeChange={setDescriptionDe}
        onCategoryChange={setCategory}
        onTagsChange={setTags}
        onIngredientGroupAdd={() =>
          setIngredientGroups((current) => [...current, { ...EMPTY_INGREDIENT_GROUP, items: [{ ...EMPTY_INGREDIENT }] }])
        }
        onIngredientGroupRemove={(groupIndex) =>
          setIngredientGroups((current) => {
            const next = current.filter((_, index) => index !== groupIndex);
            return next.length > 0 ? next : [{ ...EMPTY_INGREDIENT_GROUP, items: [{ ...EMPTY_INGREDIENT }] }];
          })
        }
        onIngredientGroupChange={updateIngredientGroup}
        onIngredientAdd={(groupIndex) =>
          setIngredientGroups((current) =>
            current.map((group, index) => index === groupIndex ? { ...group, items: [...group.items, { ...EMPTY_INGREDIENT }] } : group)
          )
        }
        onIngredientRemove={(groupIndex, ingredientIndex) =>
          setIngredientGroups((current) =>
            current.map((group, index) => {
              if (index !== groupIndex) return group;
              const nextItems = group.items.filter((_, currentIndex) => currentIndex !== ingredientIndex);
              return { ...group, items: nextItems.length > 0 ? nextItems : [{ ...EMPTY_INGREDIENT }] };
            })
          )
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
            const next = current.filter((_, currentIndex) => currentIndex !== index);
            return next.length > 0 ? next : [{ ...EMPTY_EQUIPMENT }];
          })
        }
        onEquipmentChange={updateEquipment}
        onImageUrlsChange={setImageUrls}
      />
    </main>
  );
}
