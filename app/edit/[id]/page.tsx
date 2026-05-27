"use client";

// EDIT RECIPE PAGE MAP
// This page is almost the same as Add Recipe, but it starts by loading an existing recipe.
// It fills the shared RecipeForm with saved values, then updates the same Supabase row on save.
// If add/edit behavior should match, change both app/add/page.tsx and this file carefully.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { FormEvent } from "react";
import RecipeForm from "@/components/RecipeForm";
import { useToast } from "@/components/ToastProvider";
import { apiRequest } from "@/lib/api-client";
import { buildRecipePayload } from "@/lib/recipe-db";
import type { ImportedRecipeDraft } from "@/lib/recipe-import";
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
  const { notify } = useToast();
  const params = useParams();
  const recipeId = parseRecipeId(params.id);

  const [user, setUser] = useState<AppUser | null>(null);
  const [recipe, setRecipe] = useState<RecipeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [estimatingNutrition, setEstimatingNutrition] = useState(false);
  const [nutritionEstimateMessage, setNutritionEstimateMessage] = useState("");
  const [refreshingCoverPhoto, setRefreshingCoverPhoto] = useState(false);

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
  const updateIngredient = (groupIndex: number, ingredientIndex: number, field: keyof IngredientDraft, value: string | boolean) => {
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
        group_de: group.group_de || (group.group_en.trim() ? await translateEnglishToGerman(group.group_en) : ""),
        items: await Promise.all(
          group.items.map(async (ingredient) => ({
            ...ingredient,
            name_de: ingredient.name_de || (ingredient.name_en.trim() ? await translateEnglishToGerman(ingredient.name_en) : ""),
          }))
        ),
      }))
    );

    const translatedInstructionSections = await Promise.all(
      instructionSections.map(async (section) => ({
        title_en: section.title_en,
        title_de: section.title_de || (section.title_en.trim() ? await translateEnglishToGerman(section.title_en) : ""),
        steps_en: section.steps_en,
        steps_de: section.steps_de || (section.steps_en.trim() ? await translateEnglishToGerman(section.steps_en) : ""),
      }))
    );

    const translatedEquipment = await Promise.all(
      equipment.map(async (item) => ({
        label_en: item.label_en,
        label_de: item.label_de || (item.label_en.trim() ? await translateEnglishToGerman(item.label_en) : ""),
      }))
    );

    const translatedFaq = await Promise.all(
      faq.map(async (item) => ({
        question_en: item.question_en,
        question_de: item.question_de || (item.question_en.trim() ? await translateEnglishToGerman(item.question_en) : ""),
        answer_en: item.answer_en,
        answer_de: item.answer_de || (item.answer_en.trim() ? await translateEnglishToGerman(item.answer_en) : ""),
      }))
    );

    const translatedTroubleshooting = await Promise.all(
      troubleshooting.map(async (item) => ({
        issue_en: item.issue_en,
        issue_de: item.issue_de || (item.issue_en.trim() ? await translateEnglishToGerman(item.issue_en) : ""),
        fix_en: item.fix_en,
        fix_de: item.fix_de || (item.fix_en.trim() ? await translateEnglishToGerman(item.fix_en) : ""),
      }))
    );

    const translatedStepPhotos = await Promise.all(
      stepPhotos.map(async (item) => ({
        ...item,
        caption_de: item.caption_de || (item.caption_en.trim() ? await translateEnglishToGerman(item.caption_en) : ""),
      }))
    );

    const translatedNutrition = {
      ...nutrition,
      note_de: nutrition.note_de || (nutrition.note_en.trim() ? await translateEnglishToGerman(nutrition.note_en) : ""),
    };

    // Rebuild the entire recipe payload from the current draft state before updating Supabase.
    const payload = buildRecipePayload({
      slug: recipe.slug,
      titleEn: title,
      titleDe: titleDe || autoTitleDe,
      authorName,
      learnedFrom,
      descriptionEn,
      descriptionDe: descriptionDe || autoDescriptionDe,
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
      notesDe: notesDe || autoNotesDe,
      tipsEn,
      tipsDe: tipsDe || autoTipsDe,
      storageEn,
      storageDe: storageDe || autoStorageDe,
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
      notify({ tone: "error", title: "Recipe was not updated", message: error.message });
      return;
    }

    notify({ tone: "success", title: "Recipe updated", message: "Your changes are saved." });
    router.push(`/recipe/${recipeId}`);
  };

  const handleEstimateNutrition = async () => {
    if (!ingredientGroups.some((group) => group.items.some((ingredient) => ingredient.name_en.trim()))) {
      setNutritionEstimateMessage("Add at least one ingredient before estimating nutrition.");
      return;
    }

    setEstimatingNutrition(true);
    setNutritionEstimateMessage("");

    try {
      const result = await apiRequest<{
        nutrition?: NutritionDraft;
        meta?: {
          ingredientCount: number;
          matchedIngredients: number;
          localFallbackIngredients?: number;
          confidence: string;
          unmatchedIngredients?: string[];
        };
        error?: string;
      }>("/api/nutrition-estimate", {
        method: "POST",
        body: {
          ingredientGroups,
          servings,
        },
      });

      if (!result.nutrition) {
        throw new Error(result.error || "Could not estimate nutrition.");
      }

      setNutrition(result.nutrition);
      const matched = result.meta ? `${result.meta.matchedIngredients} of ${result.meta.ingredientCount}` : "Some";
      const confidence = result.meta?.confidence ? ` ${result.meta.confidence}` : "";
      const fallback = result.meta?.localFallbackIngredients ? ` ${result.meta.localFallbackIngredients} used the pantry fallback.` : "";
      setNutritionEstimateMessage(`Estimated per serving: ${matched} ingredients matched.${fallback}${confidence ? ` Confidence: ${confidence.trim()}.` : ""}`);
      notify({ tone: "success", title: "Nutrition estimated", message: "Review the per-serving values before saving." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not estimate nutrition.";
      setNutritionEstimateMessage(message);
      notify({ tone: "error", title: "Nutrition estimate failed", message });
    } finally {
      setEstimatingNutrition(false);
    }
  };

  const handleUseSourceCoverPhoto = async () => {
    const lookupUrl = sourceUrl.trim();

    if (!lookupUrl) {
      notify({ tone: "info", title: "Add a source URL first" });
      return;
    }

    setRefreshingCoverPhoto(true);

    try {
      const result = await apiRequest<{ recipe?: ImportedRecipeDraft; error?: string }>("/api/import-recipe", {
        method: "POST",
        body: { url: lookupUrl },
        timeoutMs: 18000,
      });

      if (!result.recipe?.coverImageUrl) {
        throw new Error(result.error || "Could not find a cover photo from the source page.");
      }

      setSourceUrl(result.recipe.sourceUrl);
      setCoverImageUrl(result.recipe.coverImageUrl);
      setImageUrls(`${result.recipe.coverImageUrl}\n`);
      notify({ tone: "success", title: "Cover photo refreshed" });
    } catch (error) {
      notify({ tone: "error", title: "Cover refresh failed", message: error instanceof Error ? error.message : "Could not refresh the cover photo." });
    } finally {
      setRefreshingCoverPhoto(false);
    }
  };

  if (loading || !recipe) {
    return (
      <main className="edit-shell max-w-3xl mx-auto px-4 py-12 min-h-screen">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-40 bg-gray-100 rounded-2xl" />
          {[...Array(4)].map((_, i) => <div key={i} className="h-4 bg-gray-100 rounded" />)}
        </div>
      </main>
    );
  }

  return (
    <>
    <main className="edit-shell max-w-3xl mx-auto px-4 py-8 min-h-screen">
      {/* ── Modern header ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/recipes/${recipe.id}`}
          className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Recipe</h1>
          <p className="text-sm text-gray-500">{recipe.title_en}</p>
        </div>
      </div>

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
        nutritionEstimateMessage={nutritionEstimateMessage}
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
        refreshingCoverPhoto={refreshingCoverPhoto}
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
        onUseSourceCoverPhoto={() => void handleUseSourceCoverPhoto()}
      />
    </main>
    <style>{`
      /* Scope old CSS-class styles inside the edit shell to match the modern theme */
      .edit-shell { background: #f9fafb; }
      .edit-shell .card,
      .edit-shell .card-accent {
        background: #ffffff !important;
        border: 1px solid #f3f4f6 !important;
        border-radius: 1rem !important;
        padding: 1.5rem !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.06) !important;
        margin-bottom: 1.25rem;
      }
      .edit-shell .input {
        background: #ffffff !important;
        border: 1px solid #e5e7eb !important;
        border-radius: 0.75rem !important;
        padding: 0.6rem 1rem !important;
        font-size: 0.875rem !important;
        color: #111827 !important;
        line-height: 1.5 !important;
      }
      .edit-shell .input:focus {
        outline: none !important;
        border-color: #818cf8 !important;
        box-shadow: 0 0 0 3px rgba(129,140,248,0.18) !important;
      }
      .edit-shell .button {
        background: #f9fafb !important;
        border: 1px solid #e5e7eb !important;
        border-radius: 0.75rem !important;
        padding: 0.5rem 1rem !important;
        font-size: 0.875rem !important;
        font-weight: 500 !important;
        color: #374151 !important;
        cursor: pointer;
        transition: background 0.15s;
      }
      .edit-shell .button:hover { background: #f3f4f6 !important; }
      .edit-shell .button-primary {
        background: #4f46e5 !important;
        border-color: #4f46e5 !important;
        color: #ffffff !important;
      }
      .edit-shell .button-primary:hover { background: #4338ca !important; }
      .edit-shell .button-soft {
        background: #eff6ff !important;
        border-color: #bfdbfe !important;
        color: #1d4ed8 !important;
      }
      .edit-shell .button-danger {
        background: #fef2f2 !important;
        border-color: #fecaca !important;
        color: #dc2626 !important;
      }
      .edit-shell h2 { color: #111827 !important; font-size: 1rem !important; font-weight: 600 !important; }
      .edit-shell .eyebrow { color: #6366f1 !important; font-size: 0.7rem !important; font-weight: 700 !important; text-transform: uppercase; letter-spacing: 0.1em; }
      .edit-shell .section-heading-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
      .edit-shell .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; }
      .edit-shell .form-grid-compact { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.75rem; }
      .edit-shell .filter-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem; }
      .edit-shell .filter-chips .button { padding: 0.3rem 0.75rem !important; font-size: 0.75rem !important; border-radius: 9999px !important; }
      .edit-shell .import-panel { background: #f0fdf4 !important; border-color: #bbf7d0 !important; }
      .edit-shell .import-row { display: flex; gap: 0.75rem; }
      .edit-shell .import-row .input { flex: 1; }
    `}</style>
    </>
  );
}
