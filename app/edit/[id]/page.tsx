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
  InstructionSectionDraft,
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
  EMPTY_INSTRUCTION_SECTION,
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
  const [estimatingNutrition, setEstimatingNutrition] = useState(false);

  const [title, setTitle] = useState("");
  const [titleDe, setTitleDe] = useState("");
  const [authorName, setAuthorName] = useState("Atthuzhai");
  const [learnedFrom, setLearnedFrom] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionDe, setDescriptionDe] = useState("");
  const [category, setCategory] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [cuisineDe, setCuisineDe] = useState("");
  const [course, setCourse] = useState("");
  const [courseDe, setCourseDe] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [difficultyDe, setDifficultyDe] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [totalTime, setTotalTime] = useState("");
  const [tags, setTags] = useState("");
  const [badges, setBadges] = useState<string[]>([]);
  const [ingredientGroups, setIngredientGroups] = useState<IngredientGroupDraft[]>([{ ...EMPTY_INGREDIENT_GROUP, items: [{ ...EMPTY_INGREDIENT }] }]);
  const [instructionSections, setInstructionSections] = useState<InstructionSectionDraft[]>([{ ...EMPTY_INSTRUCTION_SECTION }]);
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
  const [coverImageUrl, setCoverImageUrl] = useState("");

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
      setAuthorName(normalizedRecipe.author_name || "Atthuzhai");
      setLearnedFrom(normalizedRecipe.learned_from || "");
      setDescriptionEn(normalizedRecipe.description_en || "");
      setDescriptionDe(normalizedRecipe.description_de || "");
      setCategory(normalizedRecipe.category || "");
      setCuisine(normalizedRecipe.cuisine || "");
      setCuisineDe(normalizedRecipe.cuisine_de || "");
      setCourse(normalizedRecipe.course || "");
      setCourseDe(normalizedRecipe.course_de || "");
      setDifficulty(normalizedRecipe.difficulty || "");
      setDifficultyDe(normalizedRecipe.difficulty_de || "");
      setPrepTime(normalizedRecipe.prep_time || "");
      setCookTime(normalizedRecipe.cook_time || "");
      setTotalTime(normalizedRecipe.total_time || "");
      setTags(normalizedRecipe.tags.join(", "));
      setBadges(normalizedRecipe.badges);
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
      setInstructionSections(
        normalizedRecipe.instruction_sections.length
          ? normalizedRecipe.instruction_sections.map((section) => ({
              title_en: section.title_en,
              title_de: section.title_de,
              steps_en: section.steps_en.join("\n"),
              steps_de: section.steps_de.join("\n"),
            }))
          : [{ ...EMPTY_INSTRUCTION_SECTION }]
      );
      setNotesEn(normalizedRecipe.notes_en || "");
      setNotesDe(normalizedRecipe.notes_de || "");
      setTipsEn(normalizedRecipe.tips_en || "");
      setTipsDe(normalizedRecipe.tips_de || "");
      setStorageEn(normalizedRecipe.storage_en || "");
      setStorageDe(normalizedRecipe.storage_de || "");
      setNutrition(normalizedRecipe.nutrition ? { ...EMPTY_NUTRITION, ...normalizedRecipe.nutrition } : { ...EMPTY_NUTRITION });
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
      setCoverImageUrl(normalizedRecipe.cover_image_url || "");
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
  const updateInstructionSection = (index: number, field: keyof InstructionSectionDraft, value: string) => {
    setInstructionSections((current) => current.map((section, currentIndex) => (currentIndex === index ? { ...section, [field]: value } : section)));
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
  const toggleBadge = (badge: string) => {
    setBadges((current) => (current.includes(badge) ? current.filter((item) => item !== badge) : [...current, badge]));
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
    const autoNotesDe = notesEn.trim() ? await translateEnglishToGerman(notesEn) : "";
    const autoTipsDe = tipsEn.trim() ? await translateEnglishToGerman(tipsEn) : "";
    const autoStorageDe = storageEn.trim() ? await translateEnglishToGerman(storageEn) : "";
    const autoCuisineDe = cuisine.trim() ? await translateEnglishToGerman(cuisine) : "";
    const autoCourseDe = course.trim() ? await translateEnglishToGerman(course) : "";
    const autoDifficultyDe = difficulty.trim() ? await translateEnglishToGerman(difficulty) : "";

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

    const translatedInstructionSections = await Promise.all(
      instructionSections.map(async (section) => ({
        title_en: section.title_en,
        title_de: section.title_en.trim() ? await translateEnglishToGerman(section.title_en) : "",
        steps_en: section.steps_en,
        steps_de: section.steps_en.trim() ? await translateEnglishToGerman(section.steps_en) : "",
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

    const translatedNutrition = {
      ...nutrition,
      note_de: nutrition.note_en.trim() ? await translateEnglishToGerman(nutrition.note_en) : "",
    };

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
      cuisine,
      cuisineDe: cuisineDe || autoCuisineDe,
      course,
      courseDe: courseDe || autoCourseDe,
      difficulty,
      difficultyDe: difficultyDe || autoDifficultyDe,
      prepTime,
      cookTime,
      totalTime,
      tags,
      badges,
      ingredientGroups: translatedGroups,
      instructionSections: translatedInstructionSections,
      notesEn,
      notesDe: autoNotesDe,
      tipsEn,
      tipsDe: autoTipsDe,
      storageEn,
      storageDe: autoStorageDe,
      nutrition: translatedNutrition,
      faq: translatedFaq,
      troubleshooting: translatedTroubleshooting,
      stepPhotos: translatedStepPhotos,
      sourceUrl,
      videoUrl,
      servings,
      equipment: translatedEquipment,
      imageUrls,
      coverImageUrl,
    });

    const { error } = await supabase.from("recipes").update(payload).eq("id", recipeId).eq("user_id", user.id);
    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push(`/recipe/${recipeId}`);
  };

  const handleEstimateNutrition = async () => {
    if (!ingredientGroups.some((group) => group.items.some((ingredient) => ingredient.name_en.trim()))) {
      alert("Please add ingredients first.");
      return;
    }

    setEstimatingNutrition(true);

    try {
      const response = await fetch("/api/nutrition-estimate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ingredientGroups,
          servings,
        }),
      });

      const result = (await response.json()) as { nutrition?: NutritionDraft; error?: string };

      if (!response.ok || !result.nutrition) {
        throw new Error(result.error || "Could not estimate nutrition.");
      }

      setNutrition(result.nutrition);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not estimate nutrition.");
    } finally {
      setEstimatingNutrition(false);
    }
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

      {/* The edit page reuses the same form as create so there is only one editor to maintain. */}
      <RecipeForm
        title={title}
        titleDe={titleDe}
        authorName={authorName}
        learnedFrom={learnedFrom}
        descriptionEn={descriptionEn}
        descriptionDe={descriptionDe}
        category={category}
        cuisine={cuisine}
        cuisineDe={cuisineDe}
        course={course}
        courseDe={courseDe}
        difficulty={difficulty}
        difficultyDe={difficultyDe}
        prepTime={prepTime}
        cookTime={cookTime}
        totalTime={totalTime}
        tags={tags}
        badges={badges}
        ingredientGroups={ingredientGroups}
        instructionSections={instructionSections}
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
        coverImageUrl={coverImageUrl}
        saving={saving}
        estimatingNutrition={estimatingNutrition}
        submitLabel="Save Changes"
        onSubmit={handleSubmit}
        onTitleChange={setTitle}
        onTitleDeChange={setTitleDe}
        onAuthorNameChange={setAuthorName}
        onLearnedFromChange={setLearnedFrom}
        onDescriptionEnChange={setDescriptionEn}
        onDescriptionDeChange={setDescriptionDe}
        onCategoryChange={setCategory}
        onCuisineChange={setCuisine}
        onCuisineDeChange={setCuisineDe}
        onCourseChange={setCourse}
        onCourseDeChange={setCourseDe}
        onDifficultyChange={setDifficulty}
        onDifficultyDeChange={setDifficultyDe}
        onPrepTimeChange={setPrepTime}
        onCookTimeChange={setCookTime}
        onTotalTimeChange={setTotalTime}
        onTagsChange={setTags}
        onBadgeToggle={toggleBadge}
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
            current.map((group, index) => (index === groupIndex ? { ...group, items: [...group.items, { ...EMPTY_INGREDIENT }] } : group))
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
        onInstructionSectionAdd={() => setInstructionSections((current) => [...current, { ...EMPTY_INSTRUCTION_SECTION, title_en: "", title_de: "" }])}
        onInstructionSectionRemove={(index) =>
          setInstructionSections((current) => {
            const next = current.filter((_, currentIndex) => currentIndex !== index);
            return next.length > 0 ? next : [{ ...EMPTY_INSTRUCTION_SECTION }];
          })
        }
        onInstructionSectionChange={updateInstructionSection}
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
        onStepPhotoRemove={(index) => setStepPhotos((current) => current.filter((_, currentIndex) => currentIndex !== index))}
        onStepPhotoChange={updateStepPhoto}
        onSourceUrlChange={setSourceUrl}
        onVideoUrlChange={setVideoUrl}
        onServingsChange={setServings}
        onEquipmentAdd={() => setEquipment((current) => [...current, { ...EMPTY_EQUIPMENT }])}
        onEquipmentRemove={(index) => setEquipment((current) => current.filter((_, currentIndex) => currentIndex !== index))}
        onEquipmentChange={updateEquipment}
        onImageUrlsChange={setImageUrls}
        onCoverImageUrlChange={setCoverImageUrl}
        onEstimateNutrition={() => void handleEstimateNutrition()}
      />
    </main>
  );
}
