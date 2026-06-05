"use client";

// ADD RECIPE PAGE
// Mirrors app/edit/[id]/page.tsx exactly — same RecipeForm, same state shape, same save logic.
// Only difference: starts with empty state, inserts a new row instead of updating an existing one.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import RecipeForm from "@/components/RecipeForm";
import { useToast } from "@/components/ToastProvider";
import { apiRequest } from "@/lib/api-client";
import { buildRecipePayload } from "@/lib/recipe-db";
import { saveRecipeDb } from "@/lib/library";
import { isCreator } from "@/lib/creator";
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
import TadkaEffect from "@/components/TadkaEffect";

export default function AddRecipe() {
  const router = useRouter();
  const { notify } = useToast();

  const [user, setUser] = useState<AppUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [tadkaBurst, setTadkaBurst] = useState(false);
  const [estimatingNutrition, setEstimatingNutrition] = useState(false);
  const [nutritionEstimateMessage, setNutritionEstimateMessage] = useState("");
  const [refreshingCoverPhoto, setRefreshingCoverPhoto] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);

  // ── Form state (identical shape to Edit page) ───────────────────────────────
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

  // Auth check — redirect to login if not signed in
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
    });
  // router is stable from useRouter — safe to omit
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Updater helpers (same as Edit page) ─────────────────────────────────────
  const updateIngredientGroup = (groupIndex: number, field: keyof Omit<IngredientGroupDraft, "items">, value: string) => {
    setIngredientGroups((cur) => cur.map((g, i) => (i === groupIndex ? { ...g, [field]: value } : g)));
  };
  const updateIngredient = (groupIndex: number, ingredientIndex: number, field: keyof IngredientDraft, value: string | boolean) => {
    setIngredientGroups((cur) =>
      cur.map((g, gi) =>
        gi === groupIndex
          ? { ...g, items: g.items.map((item, ii) => (ii === ingredientIndex ? { ...item, [field]: value } : item)) }
          : g
      )
    );
  };
  const selectIngredient = (groupIndex: number, ingredientIndex: number, updates: Partial<IngredientDraft>) => {
    setIngredientGroups((cur) =>
      cur.map((g, gi) =>
        gi === groupIndex
          ? { ...g, items: g.items.map((item, ii) => (ii === ingredientIndex ? { ...item, ...updates } : item)) }
          : g
      )
    );
  };
  const updateInstructionSection = (index: number, field: keyof InstructionSectionDraft, value: string) => {
    setInstructionSections((cur) => cur.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };
  const updateEquipment = (index: number, field: keyof EquipmentDraft, value: string) => {
    setEquipment((cur) => cur.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };
  const updateFaq = (index: number, field: keyof FaqDraft, value: string) => {
    setFaq((cur) => cur.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };
  const updateTroubleshooting = (index: number, field: keyof TroubleshootingDraft, value: string) => {
    setTroubleshooting((cur) => cur.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };
  const updateStepPhoto = (index: number, field: keyof StepPhotoDraft, value: string) => {
    setStepPhotos((cur) => cur.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };
  const updateNutrition = (field: keyof NutritionDraft, value: string) => {
    setNutrition((cur) => ({ ...cur, [field]: value }));
  };
  const toggleBadge = (badge: string) => {
    setBadges((cur) => (cur.includes(badge) ? cur.filter((b) => b !== badge) : [...cur, badge]));
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) { notify({ tone: "error", title: "Not signed in", message: "Please sign in before saving." }); return; }
    if (!title.trim()) { notify({ tone: "error", title: "Title required", message: "Please enter a recipe title." }); return; }

    setSaving(true);

    const [
      autoTitleDe, autoDescriptionDe, autoNotesDe, autoTipsDe, autoStorageDe,
      autoCuisineDe, autoCourseDe, autoDifficultyDe,
    ] = await Promise.all([
      (!titleDe.trim()       && title.trim())         ? translateEnglishToGerman(title)          : Promise.resolve(""),
      (!descriptionDe.trim() && descriptionEn.trim()) ? translateEnglishToGerman(descriptionEn)  : Promise.resolve(""),
      (!notesDe.trim()       && notesEn.trim())       ? translateEnglishToGerman(notesEn)        : Promise.resolve(""),
      (!tipsDe.trim()        && tipsEn.trim())        ? translateEnglishToGerman(tipsEn)         : Promise.resolve(""),
      (!storageDe.trim()     && storageEn.trim())     ? translateEnglishToGerman(storageEn)      : Promise.resolve(""),
      (!cuisineDe.trim()     && cuisine.trim())       ? translateEnglishToGerman(cuisine)        : Promise.resolve(""),
      (!courseDe.trim()      && course.trim())        ? translateEnglishToGerman(course)         : Promise.resolve(""),
      (!difficultyDe.trim()  && difficulty.trim())    ? translateEnglishToGerman(difficulty)     : Promise.resolve(""),
    ]);

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

    const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    const payload = buildRecipePayload({
      slug,
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

    const creatorAdding = isCreator(user.id);

    const { data, error } = await supabase
      .from("recipes")
      .insert([{ user_id: user.id, is_public: creatorAdding, ...payload }])
      .select("id")
      .single();

    setSaving(false);

    if (error) {
      notify({ tone: "error", title: "Recipe not saved", message: error.message });
      return;
    }

    if (!creatorAdding) {
      // Regular user → auto-save to Library
      await saveRecipeDb(String(data.id));
      notify({ tone: "success", title: "Recipe saved to your Library!", message: "Find it under Library → My Recipes." });
    } else {
      notify({ tone: "success", title: "Recipe published!", message: "It is now live on Discover." });
    }

    setTadkaBurst(true);
    setTimeout(() => router.push(`/recipe/${data.id}`), 950);
  };

  // ── Estimate nutrition ────────────────────────────────────────────────────────
  const handleEstimateNutrition = async () => {
    if (!ingredientGroups.some((g) => g.items.some((item) => item.name_en.trim()))) {
      setNutritionEstimateMessage("Add at least one ingredient before estimating nutrition.");
      return;
    }
    setEstimatingNutrition(true);
    setNutritionEstimateMessage("");
    try {
      const result = await apiRequest<{
        nutrition?: NutritionDraft;
        meta?: { ingredientCount: number; matchedIngredients: number; localFallbackIngredients?: number; confidence: string; unmatchedIngredients?: string[] };
        error?: string;
      }>("/api/nutrition-estimate", { method: "POST", body: { ingredientGroups, servings } });

      if (!result.nutrition) throw new Error(result.error || "Could not estimate nutrition.");

      setNutrition(result.nutrition);
      const matched = result.meta ? `${result.meta.matchedIngredients} of ${result.meta.ingredientCount}` : "Some";
      const fallback = result.meta?.localFallbackIngredients ? ` ${result.meta.localFallbackIngredients} used the pantry fallback.` : "";
      const confidence = result.meta?.confidence ? ` Confidence: ${result.meta.confidence}.` : "";
      setNutritionEstimateMessage(`Estimated per serving: ${matched} ingredients matched.${fallback}${confidence}`);
      notify({ tone: "success", title: "Nutrition estimated", message: "Review the per-serving values before saving." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not estimate nutrition.";
      setNutritionEstimateMessage(message);
      notify({ tone: "error", title: "Nutrition estimate failed", message });
    } finally {
      setEstimatingNutrition(false);
    }
  };

  // ── Cover photo from source URL ───────────────────────────────────────────────
  const handleUseSourceCoverPhoto = async () => {
    if (!sourceUrl.trim()) { notify({ tone: "info", title: "Add a source URL first" }); return; }
    setRefreshingCoverPhoto(true);
    try {
      const result = await apiRequest<{ recipe?: ImportedRecipeDraft; error?: string }>("/api/import-recipe", {
        method: "POST",
        body: { url: sourceUrl.trim() },
        timeoutMs: 18000,
      });
      if (!result.recipe?.coverImageUrl) throw new Error(result.error || "Could not find a cover photo.");
      setSourceUrl(result.recipe.sourceUrl);
      setCoverImageUrl(result.recipe.coverImageUrl);
      setImageUrls(`${result.recipe.coverImageUrl}\n`);
      notify({ tone: "success", title: "Cover photo set" });
    } catch (err) {
      notify({ tone: "error", title: "Cover photo failed", message: err instanceof Error ? err.message : "Could not fetch photo." });
    } finally {
      setRefreshingCoverPhoto(false);
    }
  };

  // ── Import recipe from URL ─────────────────────────────────────────────────
  const handleImportFromUrl = async () => {
    const url = importUrl.trim();
    if (!url) { notify({ tone: "info", title: "Paste a recipe URL first" }); return; }
    setImporting(true);
    try {
      const result = await apiRequest<{ recipe?: ImportedRecipeDraft; error?: string }>(
        "/api/import-recipe",
        { method: "POST", body: { url }, timeoutMs: 30000 }
      );
      if (!result.recipe) throw new Error(result.error || "Could not import recipe.");

      const draft = result.recipe;
      setTitle(draft.title || "");
      setDescriptionEn(draft.description || "");
      setCategory(draft.category || "");
      setCuisine(draft.cuisine || "");
      setCourse(draft.course || "");
      setDifficulty(draft.difficulty || "");
      setTags(draft.tags || "");
      setBadges(draft.badges || []);
      setLearnedFrom(draft.learnedFrom || "");
      setServings(draft.servings || "");
      setPrepTime(draft.prepTime || "");
      setCookTime(draft.cookTime || "");
      setTotalTime(draft.totalTime || "");
      setNotesEn(draft.notesEn || "");
      setTipsEn(draft.tipsEn || "");
      setSourceUrl(draft.sourceUrl || "");
      setVideoUrl(draft.videoUrl || "");
      setCoverImageUrl(draft.coverImageUrl || "");
      setImageUrls(draft.imageUrls?.join("\n") || "");

      if (draft.ingredients?.length > 0) {
        setIngredientGroups(
          draft.ingredients.map((g) => ({
            ...EMPTY_INGREDIENT_GROUP,
            group_en: g.group_en || "",
            items: g.items?.length > 0
              ? g.items.map((i) => ({ ...EMPTY_INGREDIENT, name_en: i.name_en || "", amount: i.amount || "", unit: i.unit || "" }))
              : [{ ...EMPTY_INGREDIENT }],
          }))
        );
      }

      if (draft.instructionSections?.length > 0) {
        setInstructionSections(
          draft.instructionSections.map((s) => ({
            ...EMPTY_INSTRUCTION_SECTION,
            title_en: s.title_en || "",
            steps_en: Array.isArray(s.steps_en) ? s.steps_en.join("\n") : (s.steps_en || ""),
          }))
        );
      }

      if (draft.faq?.length > 0) {
        setFaq(
          draft.faq.map((f) => ({ ...EMPTY_FAQ, question_en: f.question_en || "", answer_en: f.answer_en || "" }))
        );
      }

      if (draft.equipment?.length > 0) {
        setEquipment(
          draft.equipment.map((e) => ({ ...EMPTY_EQUIPMENT, label_en: e.label_en || "" }))
        );
      }

      notify({ tone: "success", title: "Recipe imported!", message: `"${draft.title}" is ready to review and save.` });
    } catch (err) {
      notify({ tone: "error", title: "Import failed", message: err instanceof Error ? err.message : "Could not import recipe." });
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <main className="edit-shell max-w-3xl mx-auto px-4 py-8 min-h-screen">
        <div className="relative flex items-center gap-3 mb-8 overflow-visible">
          <TadkaEffect trigger={tadkaBurst} onComplete={() => setTadkaBurst(false)} />
          <Link
            href="/recipes"
            className="p-2 rounded-xl border transition"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-0.5" style={{ color: "var(--accent)", opacity: 0.8 }}>
              Your Cookbook
            </p>
            <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Add Recipe</h1>
          </div>
        </div>

        {/* Import from URL panel */}
        <div className="card import-panel mb-6">
          <p className="eyebrow mb-2">Import from URL</p>
          <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
            Paste a recipe URL to auto-fill the form from another blog or website.
          </p>
          <div className="import-row">
            <input
              type="url"
              className="input"
              placeholder="https://example.com/recipe/..."
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handleImportFromUrl(); } }}
            />
            <button
              type="button"
              className="button button-primary"
              onClick={() => void handleImportFromUrl()}
              disabled={importing}
              style={{ whiteSpace: "nowrap" }}
            >
              {importing ? "Importing…" : "Import Recipe"}
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
            setIngredientGroups((cur) => [...cur, { ...EMPTY_INGREDIENT_GROUP, items: [{ ...EMPTY_INGREDIENT }] }])
          }
          onIngredientGroupRemove={(gi) =>
            setIngredientGroups((cur) => {
              const next = cur.filter((_, i) => i !== gi);
              return next.length > 0 ? next : [{ ...EMPTY_INGREDIENT_GROUP, items: [{ ...EMPTY_INGREDIENT }] }];
            })
          }
          onIngredientGroupChange={updateIngredientGroup}
          onIngredientAdd={(gi) =>
            setIngredientGroups((cur) =>
              cur.map((g, i) => (i === gi ? { ...g, items: [...g.items, { ...EMPTY_INGREDIENT }] } : g))
            )
          }
          onIngredientRemove={(gi, ii) =>
            setIngredientGroups((cur) =>
              cur.map((g, i) => {
                if (i !== gi) return g;
                const next = g.items.filter((_, idx) => idx !== ii);
                return { ...g, items: next.length > 0 ? next : [{ ...EMPTY_INGREDIENT }] };
              })
            )
          }
          onIngredientChange={updateIngredient}
          onIngredientSelect={selectIngredient}
          onIngredientBulkAdd={(gi, items) =>
            setIngredientGroups((cur) =>
              cur.map((g, i) => (i === gi ? { ...g, items: [...g.items.filter((it) => it.name_en.trim() || it.amount.trim()), ...items] } : g))
            )
          }
          onInstructionSectionAdd={() =>
            setInstructionSections((cur) => [...cur, { ...EMPTY_INSTRUCTION_SECTION, title_en: "", title_de: "" }])
          }
          onInstructionSectionRemove={(i) =>
            setInstructionSections((cur) => {
              const next = cur.filter((_, idx) => idx !== i);
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
          onFaqAdd={() => setFaq((cur) => [...cur, { ...EMPTY_FAQ }])}
          onFaqRemove={(i) => setFaq((cur) => cur.filter((_, idx) => idx !== i))}
          onFaqChange={updateFaq}
          onTroubleshootingAdd={() => setTroubleshooting((cur) => [...cur, { ...EMPTY_TROUBLESHOOTING }])}
          onTroubleshootingRemove={(i) => setTroubleshooting((cur) => cur.filter((_, idx) => idx !== i))}
          onTroubleshootingChange={updateTroubleshooting}
          onStepPhotoAdd={() => setStepPhotos((cur) => [...cur, { ...EMPTY_STEP_PHOTO }])}
          onStepPhotoRemove={(i) => setStepPhotos((cur) => cur.filter((_, idx) => idx !== i))}
          onStepPhotoChange={updateStepPhoto}
          onSourceUrlChange={setSourceUrl}
          onVideoUrlChange={setVideoUrl}
          onServingsChange={setServings}
          onEquipmentAdd={() => setEquipment((cur) => [...cur, { ...EMPTY_EQUIPMENT }])}
          onEquipmentRemove={(i) => setEquipment((cur) => cur.filter((_, idx) => idx !== i))}
          onEquipmentChange={updateEquipment}
          onEquipmentSet={setEquipment}
          onImageUrlsChange={setImageUrls}
          onCoverImageUrlChange={setCoverImageUrl}
          onEstimateNutrition={() => void handleEstimateNutrition()}
          onUseSourceCoverPhoto={() => void handleUseSourceCoverPhoto()}
        />
      </main>
      <style>{`
        .edit-shell { background: var(--parchment); }
        .edit-shell .card,
        .edit-shell .card-accent {
          background: var(--surface) !important;
          border: 1px solid var(--border) !important;
          border-radius: 1rem !important;
          padding: 1.5rem !important;
          box-shadow: var(--shadow-soft) !important;
          margin-bottom: 1.25rem;
        }
        .edit-shell .input {
          background: var(--surface) !important;
          border: 1px solid var(--border) !important;
          border-radius: 0.75rem !important;
          padding: 0.6rem 1rem !important;
          font-size: 0.875rem !important;
          color: var(--foreground) !important;
          line-height: 1.5 !important;
        }
        .edit-shell .input::placeholder { color: var(--muted) !important; opacity: 0.6; }
        .edit-shell .input:focus {
          outline: none !important;
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 3px var(--accent-soft) !important;
        }
        .edit-shell .button {
          background: var(--surface-strong) !important;
          border: 1px solid var(--border) !important;
          border-radius: 0.75rem !important;
          padding: 0.5rem 1rem !important;
          font-size: 0.875rem !important;
          font-weight: 500 !important;
          color: var(--foreground) !important;
          cursor: pointer;
          transition: background 0.15s;
        }
        .edit-shell .button:hover { background: var(--surface) !important; opacity: 0.9; }
        .edit-shell .button-primary {
          background: var(--accent) !important;
          border-color: var(--accent) !important;
          color: #ffffff !important;
        }
        .edit-shell .button-primary:hover { background: var(--accent-strong) !important; opacity: 1; }
        .edit-shell .button-soft {
          background: var(--accent-soft) !important;
          border-color: rgba(184,92,53,0.28) !important;
          color: var(--accent) !important;
        }
        .edit-shell .button-danger {
          background: rgba(220,38,38,0.06) !important;
          border-color: rgba(220,38,38,0.22) !important;
          color: #dc2626 !important;
        }
        .edit-shell h2 { color: var(--foreground) !important; font-size: 1rem !important; font-weight: 600 !important; }
        .edit-shell h3 { color: var(--foreground) !important; }
        .edit-shell p { color: var(--muted) !important; }
        .edit-shell .eyebrow { color: var(--accent) !important; font-size: 0.7rem !important; font-weight: 700 !important; text-transform: uppercase; letter-spacing: 0.1em; }
        .edit-shell .section-heading-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
        .edit-shell .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; }
        .edit-shell .form-grid-compact { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.75rem; }
        .edit-shell .filter-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem; }
        .edit-shell .filter-chips .button { padding: 0.3rem 0.75rem !important; font-size: 0.75rem !important; border-radius: 9999px !important; }
        .edit-shell .import-panel { background: var(--surface-strong) !important; border-color: var(--border) !important; }
        .edit-shell .import-row { display: flex; gap: 0.75rem; }
        .edit-shell .import-row .input { flex: 1; }
        .edit-shell span[style*="background: #f3f4f6"] { background: var(--surface-strong) !important; }
        .edit-shell .nutrition-estimate-status {
          background: var(--surface-strong) !important;
          border: 1px solid var(--border) !important;
          color: var(--foreground) !important;
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          margin-bottom: 0.75rem;
          font-size: 0.8rem;
        }
        .edit-shell .editor-subcard {
          background: var(--surface-strong) !important;
          border: 1px solid var(--border) !important;
        }
        .edit-shell .mini-check { color: var(--muted) !important; font-size: 0.75rem !important; }
        .edit-shell .recipe-cover-photo { border-radius: 0.75rem; width: 100%; }
      `}</style>
    </>
  );
}
