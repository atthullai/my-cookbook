"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { FormEvent } from "react";
import RecipeForm from "@/components/RecipeForm";
import { buildRecipePayload } from "@/lib/recipe-db";
import type {
  AppUser,
  EquipmentDraft,
  FaqDraft,
  IngredientDraft,
  IngredientGroupDraft,
  NutritionDraft,
  RecipeRecord,
  StepPhotoDraft,
  TroubleshootingDraft,
} from "@/lib/recipe-types";
import {
  EMPTY_EQUIPMENT,
  EMPTY_FAQ,
  EMPTY_INGREDIENT,
  EMPTY_INGREDIENT_GROUP,
  EMPTY_NUTRITION,
  EMPTY_STEP_PHOTO,
  EMPTY_TROUBLESHOOTING,
  normalizeRecipe,
  parseRecipeId,
} from "@/lib/recipe-types";
import { supabase } from "@/lib/supabase";
import { translateEnglishToGerman } from "@/lib/translate";

export default function EditRecipe() {
  // Edit keeps a draft copy of every field so users can make many changes before saving once.
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
  const [tipsEn, setTipsEn] = useState("");
  const [tipsDe, setTipsDe] = useState("");
  const [storageEn, setStorageEn] = useState("");
  const [storageDe, setStorageDe] = useState("");
  const [nutrition, setNutrition] = useState<NutritionDraft>({ ...EMPTY_NUTRITION });
  const [faq, setFaq] = useState<FaqDraft[]>([]);
  const [troubleshooting, setTroubleshooting] = useState<TroubleshootingDraft[]>([]);
  const [stepPhotos, setStepPhotos] = useState<StepPhotoDraft[]>([]);
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

      // Normalize the database row into the app's richer bilingual shape before filling the form.
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
      setTipsEn(normalizedRecipe.tips_en || "");
      setTipsDe(normalizedRecipe.tips_de || "");
      setStorageEn(normalizedRecipe.storage_en || "");
      setStorageDe(normalizedRecipe.storage_de || "");
      setNutrition(
        normalizedRecipe.nutrition
          ? {
              calories_kcal: normalizedRecipe.nutrition.calories_kcal,
              fat_g: normalizedRecipe.nutrition.fat_g,
              saturated_fat_g: normalizedRecipe.nutrition.saturated_fat_g,
              carbs_g: normalizedRecipe.nutrition.carbs_g,
              fiber_g: normalizedRecipe.nutrition.fiber_g,
              sugar_g: normalizedRecipe.nutrition.sugar_g,
              protein_g: normalizedRecipe.nutrition.protein_g,
              sodium_mg: normalizedRecipe.nutrition.sodium_mg,
              note_en: normalizedRecipe.nutrition.note_en,
              note_de: normalizedRecipe.nutrition.note_de,
            }
          : { ...EMPTY_NUTRITION }
      );
      setFaq(
        normalizedRecipe.faq?.length
          ? normalizedRecipe.faq.map((item) => ({
              question_en: item.question_en,
              question_de: item.question_de,
              answer_en: item.answer_en,
              answer_de: item.answer_de,
            }))
          : []
      );
      setTroubleshooting(
        normalizedRecipe.troubleshooting?.length
          ? normalizedRecipe.troubleshooting.map((item) => ({
              issue_en: item.issue_en,
              issue_de: item.issue_de,
              fix_en: item.fix_en,
              fix_de: item.fix_de,
            }))
          : []
      );
      setStepPhotos(
        normalizedRecipe.step_photos?.length
          ? normalizedRecipe.step_photos.map((item) => ({
              step_number: item.step_number,
              image_url: item.image_url,
              caption_en: item.caption_en,
              caption_de: item.caption_de,
            }))
          : []
      );
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
  const updateFaq = (index: number, field: keyof FaqDraft, value: string) => {
    setFaq((current) => current.map((item, currentIndex) => (currentIndex === index ? { ...item, [field]: value } : item)));
  };
  const updateTroubleshooting = (index: number, field: keyof TroubleshootingDraft, value: string) => {
    setTroubleshooting((current) => current.map((item, currentIndex) => (currentIndex === index ? { ...item, [field]: value } : item)));
  };
  const updateStepPhoto = (index: number, field: keyof StepPhotoDraft, value: string) => {
    setStepPhotos((current) => current.map((item, currentIndex) => (currentIndex === index ? { ...item, [field]: value } : item)));
  };
  const updateNutrition = (field: keyof NutritionDraft, value: string) => {
    setNutrition((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !recipeId || !recipe) {
      alert("Recipe is not ready to save yet.");
      return;
    }

    setSaving(true);

    const autoTitleDe = title.trim() ? await translateEnglishToGerman(title) : "";
    const autoDescriptionDe = descriptionEn.trim() ? await translateEnglishToGerman(descriptionEn) : "";
    const autoStepsDe = steps.trim() ? await translateEnglishToGerman(steps) : "";
    const autoNotesDe = notesEn.trim() ? await translateEnglishToGerman(notesEn) : "";
    const autoTipsDe = tipsEn.trim() ? await translateEnglishToGerman(tipsEn) : "";
    const autoStorageDe = storageEn.trim() ? await translateEnglishToGerman(storageEn) : "";

    const translatedGroups = await Promise.all(
      ingredientGroups.map(async (group) => ({
        group_en: group.group_en,
        group_de: group.group_en.trim() ? await translateEnglishToGerman(group.group_en) : "",
        items: await Promise.all(
          group.items.map(async (ingredient) => ({
            ...ingredient,
            name_de: ingredient.name_en.trim() ? await translateEnglishToGerman(ingredient.name_en) : "",
          }))
        ),
      }))
    );

    const translatedEquipment = await Promise.all(
      equipment.map(async (item) => ({
        label_en: item.label_en,
        label_de: item.label_en.trim() ? await translateEnglishToGerman(item.label_en) : "",
      }))
    );

    const translatedFaq = await Promise.all(
      faq.map(async (item) => ({
        question_en: item.question_en,
        question_de: item.question_en.trim() ? await translateEnglishToGerman(item.question_en) : "",
        answer_en: item.answer_en,
        answer_de: item.answer_en.trim() ? await translateEnglishToGerman(item.answer_en) : "",
      }))
    );

    const translatedTroubleshooting = await Promise.all(
      troubleshooting.map(async (item) => ({
        issue_en: item.issue_en,
        issue_de: item.issue_en.trim() ? await translateEnglishToGerman(item.issue_en) : "",
        fix_en: item.fix_en,
        fix_de: item.fix_en.trim() ? await translateEnglishToGerman(item.fix_en) : "",
      }))
    );

    const translatedStepPhotos = await Promise.all(
      stepPhotos.map(async (item) => ({
        ...item,
        caption_de: item.caption_en.trim() ? await translateEnglishToGerman(item.caption_en) : "",
      }))
    );

    // Rebuild the entire recipe payload from the current draft state before updating Supabase.
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
      tipsEn,
      tipsDe: autoTipsDe,
      storageEn,
      storageDe: autoStorageDe,
      nutrition,
      faq: translatedFaq,
      troubleshooting: translatedTroubleshooting,
      stepPhotos: translatedStepPhotos,
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

      {/* The edit page reuses the same form as create so there is only one editor to maintain. */}
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
        tipsEn={tipsEn}
        tipsDe={tipsDe}
        storageEn={storageEn}
        storageDe={storageDe}
        nutrition={nutrition}
        faq={faq}
        troubleshooting={troubleshooting}
        stepPhotos={stepPhotos}
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
        onTipsEnChange={setTipsEn}
        onTipsDeChange={setTipsDe}
        onStorageEnChange={setStorageEn}
        onStorageDeChange={setStorageDe}
        onNutritionChange={updateNutrition}
        onFaqAdd={() => setFaq((current) => [...current, { ...EMPTY_FAQ }])}
        onFaqRemove={(index) => setFaq((current) => current.filter((_, currentIndex) => currentIndex !== index))}
        onFaqChange={updateFaq}
        onTroubleshootingAdd={() => setTroubleshooting((current) => [...current, { ...EMPTY_TROUBLESHOOTING }])}
        onTroubleshootingRemove={(index) =>
          setTroubleshooting((current) => current.filter((_, currentIndex) => currentIndex !== index))
        }
        onTroubleshootingChange={updateTroubleshooting}
        onStepPhotoAdd={() => setStepPhotos((current) => [...current, { ...EMPTY_STEP_PHOTO }])}
        onStepPhotoRemove={(index) =>
          setStepPhotos((current) => current.filter((_, currentIndex) => currentIndex !== index))
        }
        onStepPhotoChange={updateStepPhoto}
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
