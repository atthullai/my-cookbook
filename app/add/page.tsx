"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { FormEvent } from "react";
import RecipeForm from "@/components/RecipeForm";
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
} from "@/lib/recipe-types";
import { supabase } from "@/lib/supabase";
import { translateEnglishToGerman } from "@/lib/translate";

// New recipes are authored through the same bilingual form shape that edit uses,
// so create and update stay in sync as the recipe model grows.
function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function AddRecipe() {
  // Each piece of form state mirrors one part of the Supabase recipe record.
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);

  const [title, setTitle] = useState("");
  const [titleDe, setTitleDe] = useState("");
  const [authorName, setAuthorName] = useState("Atthuzhai");
  const [learnedFrom, setLearnedFrom] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionDe, setDescriptionDe] = useState("");
  const [category, setCategory] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [course, setCourse] = useState("");
  const [difficulty, setDifficulty] = useState("");
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

  const applyImportedRecipe = (recipe: ImportedRecipeDraft) => {
    // Importing fills the same editor fields you already use manually, so the source recipe
    // becomes an editable draft instead of a separate opaque object.
    setTitle(recipe.title);
    setTitleDe("");
    setAuthorName("Atthuzhai");
    setLearnedFrom(recipe.learnedFrom);
    setDescriptionEn(recipe.description);
    setDescriptionDe("");
    setCategory(recipe.category);
    setCuisine(recipe.cuisine);
    setCourse(recipe.course);
    setDifficulty(recipe.difficulty);
    setPrepTime(recipe.prepTime);
    setCookTime(recipe.cookTime);
    setTotalTime(recipe.totalTime);
    setTags(recipe.tags);
    setBadges(recipe.badges);
    setIngredientGroups(
      recipe.ingredients.length
        ? recipe.ingredients.map((group) => ({
            group_en: group.group_en,
            group_de: "",
            items: group.items.map((item) => ({
              amount: item.amount,
              unit: item.unit,
              name_en: item.name_en,
              name_de: "",
            })),
          }))
        : [{ ...EMPTY_INGREDIENT_GROUP, items: [{ ...EMPTY_INGREDIENT }] }]
    );
    setInstructionSections(
      recipe.instructionSections.length
        ? recipe.instructionSections.map((section) => ({
            title_en: section.title_en,
            title_de: "",
            steps_en: section.steps_en.join("\n"),
            steps_de: "",
          }))
        : [{ ...EMPTY_INSTRUCTION_SECTION }]
    );
    setNotesEn(recipe.notesEn);
    setNotesDe("");
    setTipsEn("");
    setTipsDe("");
    setStorageEn("");
    setStorageDe("");
    setFaq([]);
    setTroubleshooting([]);
    setNutrition({ ...EMPTY_NUTRITION });
    // Imported links no longer auto-create process-photo rows; that section is now opt-in only.
    setStepPhotos([]);
    setSourceUrl(recipe.sourceUrl);
    setVideoUrl(recipe.videoUrl);
    setServings(recipe.servings);
    setEquipment([{ ...EMPTY_EQUIPMENT }]);
    setImageUrls(recipe.imageUrls.join("\n"));
    setCoverImageUrl(recipe.coverImageUrl);
  };

  useEffect(() => {
    let isMounted = true;

    const checkUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!isMounted) return;
      // Adding recipes is a private action, so anonymous visitors are sent to login.
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
    setEquipment((current) => current.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
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

    if (!user) {
      alert("Please log in first.");
      return;
    }

    if (!title.trim()) {
      alert("Please add an English title.");
      return;
    }

    if (!ingredientGroups.some((group) => group.items.some((ingredient) => ingredient.name_en.trim()))) {
      alert("Please add at least one ingredient.");
      return;
    }

    if (!instructionSections.some((section) => section.steps_en.trim())) {
      alert("Please add at least one instruction section with steps.");
      return;
    }

    setSaving(true);

    const autoTitleDe = title.trim() ? await translateEnglishToGerman(title) : "";
    const autoDescriptionDe = descriptionEn.trim() ? await translateEnglishToGerman(descriptionEn) : "";
    const autoNotesDe = notesEn.trim() ? await translateEnglishToGerman(notesEn) : "";
    const autoTipsDe = tipsEn.trim() ? await translateEnglishToGerman(tipsEn) : "";
    const autoStorageDe = storageEn.trim() ? await translateEnglishToGerman(storageEn) : "";
    // German fields are auto-generated from English on save so the two languages stay in sync.
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

    // Build the final database row in one place so the component stays readable.
    const payload = buildRecipePayload({
      slug: slugify(title),
      titleEn: title,
      titleDe: autoTitleDe,
      authorName,
      learnedFrom,
      descriptionEn,
      descriptionDe: autoDescriptionDe,
      category,
      cuisine,
      course,
      difficulty,
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

    const { error } = await supabase.from("recipes").insert([{ ...payload, user_id: user.id }]);
    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = "/recipes";
  };

  const handleImport = async () => {
    if (!importUrl.trim()) {
      alert("Please paste a recipe link first.");
      return;
    }

    setImporting(true);

    try {
      const response = await fetch("/api/import-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: importUrl.trim() }),
      });

      const result = (await response.json()) as { recipe?: ImportedRecipeDraft; error?: string };

      if (!response.ok || !result.recipe) {
        throw new Error(result.error || "Could not import recipe.");
      }

      applyImportedRecipe(result.recipe);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not import recipe.");
    } finally {
      setImporting(false);
    }
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

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginBottom: 8 }}>Import From Source URL</h2>
        <p style={{ marginBottom: 12 }}>
          Paste a recipe link to prefill the draft. Cover photo, timings, cuisine, course, and ingredients are imported when available. Step-by-step photos stay empty unless you add them yourself.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
          <input className="input" value={importUrl} onChange={(event) => setImportUrl(event.target.value)} placeholder="https://example.com/recipe" />
          <button className="button" type="button" onClick={() => void handleImport()} disabled={importing}>
            {importing ? "Importing..." : "Import Recipe"}
          </button>
        </div>
      </div>

      <RecipeForm
        title={title}
        titleDe={titleDe}
        authorName={authorName}
        learnedFrom={learnedFrom}
        descriptionEn={descriptionEn}
        descriptionDe={descriptionDe}
        category={category}
        cuisine={cuisine}
        course={course}
        difficulty={difficulty}
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
        submitLabel="Save Recipe"
        onSubmit={handleSubmit}
        onTitleChange={setTitle}
        onTitleDeChange={setTitleDe}
        onAuthorNameChange={setAuthorName}
        onLearnedFromChange={setLearnedFrom}
        onDescriptionEnChange={setDescriptionEn}
        onDescriptionDeChange={setDescriptionDe}
        onCategoryChange={setCategory}
        onCuisineChange={setCuisine}
        onCourseChange={setCourse}
        onDifficultyChange={setDifficulty}
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
      />
    </main>
  );
}
