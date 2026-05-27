"use client";

/**
 * Add Recipe — /add
 *
 * A streamlined single-language form.
 * - Cuisine selector with emoji preview (using CuisineOrigin)
 * - Dynamic ingredient rows
 * - Dynamic step rows (instruction + optional duration + optional tip)
 * - Clickable tag chips for all 16 RecipeTags
 * - "Calculate Nutrition" → calls /api/nutrition-estimate, shows NutritionPanel preview
 * - Manual nutrition override fields
 * - Save → upserts to Supabase in existing RecipeRecord schema → toast → /recipes/[id]
 */
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Trash2, Loader2, Calculator, ChevronDown, ChevronUp, Link2, X,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { supabase } from "@/lib/supabase";
import { ALL_CUISINE_ORIGINS, INDIAN_CUISINE_ORIGINS, getCuisineTheme } from "@/lib/cuisine-themes";
import { ALL_TAGS, TAG_META } from "@/lib/recipe-tags";
import NutritionPanel from "@/components/NutritionPanel";
import TadkaEffect from "@/components/TadkaEffect";
import type { CuisineOrigin, RecipeTag, NutritionInfo } from "@/types";

// ── Local draft types ─────────────────────────────────────────────────────────
interface IngredientRow {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  notes: string;
}

interface StepRow {
  id: string;
  instruction: string;
  duration: string;
  tip: string;
}

function uid() { return Math.random().toString(36).slice(2); }

function emptyIngredient(): IngredientRow {
  return { id: uid(), name: "", quantity: "", unit: "", notes: "" };
}
function emptyStep(): StepRow {
  return { id: uid(), instruction: "", duration: "", tip: "" };
}

// ── Cuisine picker ────────────────────────────────────────────────────────────
function CuisineSelector({
  value,
  onChange,
}: {
  value: CuisineOrigin;
  onChange: (v: CuisineOrigin) => void;
}) {
  const [open, setOpen] = useState(false);
  const theme = getCuisineTheme(value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${theme.borderColor} ${theme.accentBg} transition`}
      >
        <span className="text-2xl">{theme.emoji}</span>
        <span className={`flex-1 text-left text-sm font-medium ${theme.headingColor}`}>
          {theme.label}
        </span>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute z-50 top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-h-72 overflow-y-auto"
          >
            {/* Group: Indian Regional */}
            <div className="px-4 pt-3 pb-1">
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">🇮🇳 Indian Regional</p>
            </div>
            {INDIAN_CUISINE_ORIGINS.map((origin) => {
              const t = getCuisineTheme(origin);
              return (
                <button
                  key={origin}
                  type="button"
                  onClick={() => { onChange(origin); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left transition ${value === origin ? "bg-amber-50" : "hover:bg-gray-50"}`}
                >
                  <span className="text-lg">{t.emoji}</span>
                  <span className={`text-sm font-medium ${value === origin ? "text-amber-700" : "text-gray-700"}`}>
                    {t.label}
                  </span>
                  {value === origin && <span className="ml-auto text-amber-600">✓</span>}
                </button>
              );
            })}
            {/* Divider */}
            <div className="px-4 pt-3 pb-1 border-t border-gray-100 mt-1">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--accent)", opacity: 0.7 }}>🌍 World Kitchen</p>
            </div>
            {ALL_CUISINE_ORIGINS.filter((o) => !INDIAN_CUISINE_ORIGINS.includes(o)).map((origin) => {
              const t = getCuisineTheme(origin);
              const isSelected = value === origin;
              return (
                <button
                  key={origin}
                  type="button"
                  onClick={() => { onChange(origin); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left transition"
                  style={{ background: isSelected ? "rgba(184,92,53,0.08)" : "transparent" }}
                >
                  <span className="text-lg">{t.emoji}</span>
                  <span className="text-sm font-medium" style={{ color: isSelected ? "var(--accent)" : "var(--foreground)" }}>
                    {t.label}
                  </span>
                  {isSelected && <span className="ml-auto" style={{ color: "var(--accent)" }}>✓</span>}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AddRecipePage() {
  const router = useRouter();

  // ── Auth ────────────────────────────────────────────────────────────────────
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = "/login"; return; }
      setUserId(user.id);
    });
  }, []);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [cuisine,     setCuisine]     = useState<CuisineOrigin>("other");
  const [category,    setCategory]    = useState("");
  const [servings,    setServings]    = useState("4");
  const [prepTime,    setPrepTime]    = useState("");
  const [cookTime,    setCookTime]    = useState("");
  const [notes,       setNotes]       = useState("");
  const [learnedFrom, setLearnedFrom] = useState("");
  const [tags,        setTags]        = useState<RecipeTag[]>([]);
  const [ingredients, setIngredients] = useState<IngredientRow[]>([emptyIngredient()]);
  const [steps,       setSteps]       = useState<StepRow[]>([emptyStep()]);

  // ── URL import state ────────────────────────────────────────────────────────
  const [importUrl,      setImportUrl]      = useState("");
  const [isImporting,    setIsImporting]    = useState(false);

  const handleImport = useCallback(async () => {
    if (!importUrl.trim()) { toast.error("Paste a recipe URL first"); return; }
    setIsImporting(true);
    try {
      const res = await fetch("/api/import-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      const json = await res.json() as {
        recipe?: {
          title?: string; description?: string; cuisine?: string;
          prepTime?: string; cookTime?: string; servings?: string;
          notesEn?: string; sourceUrl?: string; learnedFrom?: string;
          ingredients?: Array<{ group_en?: string; items?: Array<{ amount?: string; unit?: string; name_en?: string }> }>;
          instructionSections?: Array<{ steps_en?: string[] }>;
        };
        error?: string;
      };
      if (!json.recipe) throw new Error(json.error ?? "Could not import recipe");

      const r = json.recipe;
      if (r.title)       setTitle(r.title);
      if (r.description) setDescription(r.description);
      if (r.prepTime)    setPrepTime(r.prepTime.replace(/\D/g, ""));
      if (r.cookTime)    setCookTime(r.cookTime.replace(/\D/g, ""));
      if (r.servings)    setServings(r.servings.replace(/\D/g, "") || "4");
      if (r.notesEn)     setNotes(r.notesEn);
      if (r.learnedFrom) setLearnedFrom(r.learnedFrom);

      // Flatten ingredient groups into rows
      const importedIngredients = (r.ingredients ?? []).flatMap((g) =>
        (g.items ?? []).map((item) => ({
          id:       uid(),
          name:     item.name_en ?? "",
          quantity: item.amount ?? "",
          unit:     item.unit ?? "",
          notes:    "",
        }))
      );
      if (importedIngredients.length > 0) setIngredients(importedIngredients);

      // Flatten instruction sections into step rows
      const importedSteps = (r.instructionSections ?? []).flatMap((sec) =>
        (sec.steps_en ?? []).map((instruction) => ({
          id:          uid(),
          instruction,
          duration:    "",
          tip:         "",
        }))
      );
      if (importedSteps.length > 0) setSteps(importedSteps);

      setImportUrl("");
      toast.success("Recipe imported! Review and save.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Import failed";
      toast.error(
        msg.includes("find recipe data")
          ? "Could not find recipe data. The site may not support structured data — try a different URL or add the recipe manually."
          : msg
      );
    } finally {
      setIsImporting(false);
    }
  }, [importUrl]);

  // ── Nutrition state ──────────────────────────────────────────────────────────
  const [nutritionPreview, setNutritionPreview] = useState<NutritionInfo | null>(null);
  const [nutritionStatus,  setNutritionStatus]  = useState<"idle"|"pending"|"calculated"|"failed">("idle");
  const [manualCalories,   setManualCalories]   = useState("");
  const [manualProtein,    setManualProtein]    = useState("");
  const [manualCarbs,      setManualCarbs]      = useState("");
  const [manualFat,        setManualFat]        = useState("");
  const [manualFiber,      setManualFiber]      = useState("");
  const [showManual,       setShowManual]       = useState(false);

  // ── Servings change: reset nutrition if already calculated ──────────────────
  const handleServingsChange = (val: string) => {
    setServings(val);
    if (nutritionStatus === "calculated") {
      setNutritionStatus("idle");
      setNutritionPreview(null);
      setManualCalories(""); setManualProtein(""); setManualCarbs("");
      setManualFat(""); setManualFiber("");
    }
  };

  // ── Saving ──────────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [tadkaBurst, setTadkaBurst] = useState(false);

  // ── Tag toggle ───────────────────────────────────────────────────────────────
  const toggleTag = (tag: RecipeTag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // ── Ingredient helpers ────────────────────────────────────────────────────────
  const updateIngredient = (id: string, field: keyof IngredientRow, value: string) => {
    setIngredients((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  };
  const removeIngredient = (id: string) => {
    setIngredients((prev) => prev.length > 1 ? prev.filter((r) => r.id !== id) : prev);
  };

  // ── Step helpers ──────────────────────────────────────────────────────────────
  const updateStep = (id: string, field: keyof StepRow, value: string) => {
    setSteps((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  };
  const removeStep = (id: string) => {
    setSteps((prev) => prev.length > 1 ? prev.filter((r) => r.id !== id) : prev);
  };

  // ── Calculate nutrition ───────────────────────────────────────────────────────
  const calculateNutrition = useCallback(async () => {
    const names = ingredients.filter((i) => i.name.trim()).map((i) => i.name.trim());
    if (names.length === 0) { toast.error("Add at least one ingredient first"); return; }

    setNutritionStatus("pending");
    try {
      const res = await fetch("/api/nutrition-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredientGroups: [{
            group_en: "",
            group_de: "",
            items: ingredients.filter((i) => i.name.trim()).map((i) => ({
              amount: i.quantity || "1",
              unit:   i.unit,
              name_en: i.name,
              name_de: "",
            })),
          }],
          servings: servings || "4",
        }),
      });

      const json = await res.json() as { nutrition?: { calories_per_serving?: string; protein_g?: string; carbs_g?: string; fat_g?: string; fiber_g?: string }; error?: string };
      if (!json.nutrition) throw new Error(json.error ?? "Could not estimate");

      const n = json.nutrition;
      const info: NutritionInfo = {
        calories:      parseFloat(n.calories_per_serving ?? "0") || 0,
        protein:       parseFloat(n.protein_g ?? "0") || 0,
        carbohydrates: parseFloat(n.carbs_g ?? "0") || 0,
        fat:           parseFloat(n.fat_g ?? "0") || 0,
        fiber:         parseFloat(n.fiber_g ?? "0") || 0,
        sugar:         0,
        sodium:        0,
        servingSize:   0,
      };

      setNutritionPreview(info);
      setNutritionStatus("calculated");
      setManualCalories(String(info.calories));
      setManualProtein(String(info.protein));
      setManualCarbs(String(info.carbohydrates));
      setManualFat(String(info.fat));
      setManualFiber(String(info.fiber));
      toast.success("Nutrition estimated!");
    } catch (err) {
      setNutritionStatus("failed" as const);
      toast.error(err instanceof Error ? err.message : "Failed to estimate nutrition");
    }
  }, [ingredients, servings]);

  // ── Save ──────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!userId) { toast.error("Please log in first"); return; }
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!ingredients.some((i) => i.name.trim())) { toast.error("Add at least one ingredient"); return; }
    if (!steps.some((s) => s.instruction.trim())) { toast.error("Add at least one step"); return; }

    setSaving(true);

    // Build the final nutrition object (manual overrides take precedence)
    const finalCalories = manualCalories  ? parseFloat(manualCalories)  : (nutritionPreview?.calories       ?? null);
    const finalProtein  = manualProtein   ? parseFloat(manualProtein)   : (nutritionPreview?.protein        ?? null);
    const finalCarbs    = manualCarbs     ? parseFloat(manualCarbs)     : (nutritionPreview?.carbohydrates  ?? null);
    const finalFat      = manualFat       ? parseFloat(manualFat)       : (nutritionPreview?.fat            ?? null);
    const finalFiber    = manualFiber     ? parseFloat(manualFiber)     : (nutritionPreview?.fiber          ?? null);

    const nutritionRecord = (finalCalories !== null) ? {
      calories_per_serving: String(finalCalories),
      protein_g:  String(finalProtein ?? ""),
      carbs_g:    String(finalCarbs   ?? ""),
      fat_g:      String(finalFat     ?? ""),
      fiber_g:    String(finalFiber   ?? ""),
      note_en: "",
      note_de: "",
    } : null;

    // Ingredient groups (one default group)
    const ingredientGroups = [{
      group_en: "",
      group_de: "",
      items: ingredients
        .filter((i) => i.name.trim())
        .map((i) => ({
          amount:  i.quantity,
          unit:    i.unit,
          name_en: i.name,
          name_de: "",
          notes_en: i.notes,
        })),
    }];

    // Instruction sections (one section, newline-separated steps)
    const stepLines = steps
      .filter((s) => s.instruction.trim())
      .map((s) => s.instruction.trim());

    const instructionSections = [{
      title_en: "",
      title_de: "",
      steps_en: stepLines.join("\n"),
      steps_de: "",
    }];

    // Slug
    const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    const payload = {
      user_id:               userId,
      slug,
      title_en:              title.trim(),
      title_de:              "",
      description_en:        description.trim(),
      description_de:        "",
      category:              category.trim(),
      cuisine:               getCuisineTheme(cuisine).label,
      cuisine_de:            "",
      origin:                cuisine,
      course:                "",
      course_de:             "",
      difficulty:            "",
      difficulty_de:         "",
      prep_time_min:         parseInt(prepTime) || null,
      cook_time_min:         parseInt(cookTime) || null,
      servings:              servings.trim(),
      tags:                  "",
      badges:                tags as string[],
      ingredient_groups:     ingredientGroups,
      instruction_sections:  instructionSections,
      notes_en:              notes.trim(),
      notes_de:              "",
      nutrition:             nutritionRecord,
      calories:              finalCalories,
      protein_g:             finalProtein,
      carbs_g:               finalCarbs,
      fat_g:                 finalFat,
      fiber_g:               finalFiber,
      is_veg:                tags.includes("veg") || tags.includes("vegan"),
      is_vegan:              tags.includes("vegan"),
      is_high_protein:       tags.includes("high-protein"),
      spice_level:           tags.includes("very-spicy") ? 3 : tags.includes("spicy") ? 2 : 0,
      equipment:             [],
      source_url:            "",
      video_url:             "",
      image_urls:            [],
      cover_image_url:       "",
      author_name:           "",
      learned_from:          learnedFrom.trim(),
    };

    try {
      const { data, error } = await supabase
        .from("recipes")
        .insert([payload])
        .select("id")
        .single();

      if (error) throw error;
      toast.success("Recipe saved!");
      setTadkaBurst(true);
      setTimeout(() => router.push(`/recipes/${data.id}`), 950);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save recipe");
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <Toaster position="top-right" />
      <main className="max-w-2xl mx-auto px-4 py-8 min-h-screen">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/recipes"
            className="p-2 rounded-xl border transition"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-0.5"
              style={{ color: "var(--accent)", opacity: 0.8 }}>
              Your Cookbook
            </p>
            <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Add Recipe</h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Your kitchen, your story</p>
          </div>
        </div>

        <div className="space-y-8">

          {/* ── Import from URL ────────────────────────────────────────────── */}
          <section className="rounded-2xl p-5"
            style={{
              background: "linear-gradient(135deg, rgba(212,160,23,0.07) 0%, rgba(184,92,53,0.05) 100%)",
              border: "1px solid rgba(212,160,23,0.2)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Link2 size={16} style={{ color: "var(--accent)" }} />
              <h2 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                Import from a website or blog
              </h2>
            </div>
            <p className="text-xs mb-3 leading-relaxed" style={{ color: "var(--muted)" }}>
              Paste a URL from any cooking website — ingredients, steps, and timings will be imported automatically.
            </p>
            <div className="flex gap-2">
              <input
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void handleImport(); }}
                placeholder="https://www.example.com/recipe/..."
                className="flex-1 px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--foreground)",
                }}
              />
              {importUrl && (
                <button type="button" onClick={() => setImportUrl("")}
                  className="p-2.5 transition" style={{ color: "var(--muted)" }}>
                  <X size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleImport()}
                disabled={isImporting || !importUrl.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50 flex-shrink-0"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {isImporting
                  ? <><Loader2 size={14} className="animate-spin" /> Importing…</>
                  : <><Link2 size={14} /> Import</>}
              </button>
            </div>
          </section>

          {/* ── Basics ─────────────────────────────────────────────────────── */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">Basics</h2>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Recipe Title <span className="text-red-400">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Amma's Lemon Rice"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="A short description or story behind this recipe"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Category</label>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Lunch, Dessert"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Servings</label>
                <input
                  value={servings}
                  onChange={(e) => handleServingsChange(e.target.value)}
                  placeholder="4"
                  type="number"
                  min="1"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:outline-none"
                />
                {nutritionStatus === "idle" && servings && (
                  <p className="text-[11px] text-gray-400 mt-1">Change servings to recalculate nutrition</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Prep Time (min)</label>
                <input
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  placeholder="15"
                  type="number"
                  min="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Cook Time (min)</label>
                <input
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                  placeholder="30"
                  type="number"
                  min="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* ── Cuisine ────────────────────────────────────────────────────── */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Cuisine Origin</h2>
            <CuisineSelector value={cuisine} onChange={setCuisine} />
          </section>

          {/* ── Tags ───────────────────────────────────────────────────────── */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map((tag) => {
                const meta     = TAG_META[tag];
                const selected = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={[
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition",
                      selected
                        ? `${meta.color} ${meta.textColor} ${meta.borderColor}`
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100",
                    ].join(" ")}
                  >
                    <span>{meta.emoji}</span>
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Ingredients ────────────────────────────────────────────────── */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Ingredients <span className="text-red-400 text-sm">*</span>
            </h2>

            <div className="space-y-2">
              <AnimatePresence>
                {ingredients.map((ing, idx) => (
                  <motion.div
                    key={ing.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-[1fr_80px_80px_1fr_auto] gap-2 items-center"
                  >
                    <input
                      value={ing.name}
                      onChange={(e) => updateIngredient(ing.id, "name", e.target.value)}
                      placeholder={idx === 0 ? "e.g. Lemon" : "Ingredient"}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:outline-none"
                    />
                    <input
                      value={ing.quantity}
                      onChange={(e) => updateIngredient(ing.id, "quantity", e.target.value)}
                      placeholder="Qty"
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:outline-none"
                    />
                    <input
                      value={ing.unit}
                      onChange={(e) => updateIngredient(ing.id, "unit", e.target.value)}
                      placeholder="Unit"
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:outline-none"
                    />
                    <input
                      value={ing.notes}
                      onChange={(e) => updateIngredient(ing.id, "notes", e.target.value)}
                      placeholder="Notes (optional)"
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeIngredient(ing.id)}
                      className="p-2 text-gray-300 hover:text-red-400 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() => setIngredients((prev) => [...prev, emptyIngredient()])}
              className="mt-3 flex items-center gap-1.5 text-sm transition"
              style={{ color: "var(--accent)" }}
            >
              <Plus size={14} /> Add ingredient
            </button>
          </section>

          {/* ── Steps ──────────────────────────────────────────────────────── */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Method <span className="text-red-400 text-sm">*</span>
            </h2>

            <div className="space-y-3">
              <AnimatePresence>
                {steps.map((step, idx) => (
                  <motion.div
                    key={step.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-50 rounded-xl p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0"
                        style={{ background: "rgba(184,92,53,0.12)", color: "var(--accent)" }}
                      >
                        {idx + 1}
                      </span>
                      <textarea
                        value={step.instruction}
                        onChange={(e) => updateStep(step.id, "instruction", e.target.value)}
                        rows={2}
                        placeholder="Describe this step…"
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 bg-white resize-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeStep(step.id)}
                        className="p-1.5 text-gray-300 hover:text-red-400 transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pl-8">
                      <input
                        value={step.duration}
                        onChange={(e) => updateStep(step.id, "duration", e.target.value)}
                        placeholder="Duration (min)"
                        type="number"
                        min="0"
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-indigo-400 bg-white"
                      />
                      <input
                        value={step.tip}
                        onChange={(e) => updateStep(step.id, "tip", e.target.value)}
                        placeholder="💡 Tip (optional)"
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-indigo-400 bg-white"
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() => setSteps((prev) => [...prev, emptyStep()])}
              className="mt-3 flex items-center gap-1.5 text-sm transition"
              style={{ color: "var(--accent)" }}
            >
              <Plus size={14} /> Add step
            </button>
          </section>

          {/* ── Notes ──────────────────────────────────────────────────────── */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div>
              <h2 className="font-semibold text-gray-900 mb-4">Notes</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Storage tips, variations, family stories…"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Learned from / Source
              </label>
              <input
                value={learnedFrom}
                onChange={(e) => setLearnedFrom(e.target.value)}
                placeholder="e.g. Amma, Grandma, Hebbar's Kitchen, www...."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:outline-none"
              />
              <p className="text-[11px] text-gray-400 mt-1">Who taught you this recipe or where did you learn it?</p>
            </div>
          </section>

          {/* ── Nutrition ──────────────────────────────────────────────────── */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Nutrition</h2>
              <button
                type="button"
                onClick={() => void calculateNutrition()}
                disabled={nutritionStatus === "pending"}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50"
                style={{ color: "var(--accent)", border: "1px solid rgba(184,92,53,0.3)" }}
              >
                {nutritionStatus === "pending" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Calculator size={14} />
                )}
                {nutritionStatus === "pending" ? "Calculating…" : "Calculate Nutrition"}
              </button>
            </div>

            {(nutritionStatus === "calculated" || nutritionStatus === "failed") && (
              <div className="mb-4">
                <NutritionPanel
                  nutrition={nutritionPreview ?? undefined}
                  status={nutritionStatus === "calculated" ? "calculated" : "failed"}
                  onRetry={() => void calculateNutrition()}
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowManual((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition"
            >
              {showManual ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showManual ? "Hide" : "Manually enter"} nutrition values
            </button>

            <AnimatePresence>
              {showManual && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-3"
                >
                  {[
                    { label: "Calories",  value: manualCalories, set: setManualCalories },
                    { label: "Protein g", value: manualProtein,  set: setManualProtein  },
                    { label: "Carbs g",   value: manualCarbs,    set: setManualCarbs    },
                    { label: "Fat g",     value: manualFat,      set: setManualFat      },
                    { label: "Fiber g",   value: manualFiber,    set: setManualFiber    },
                  ].map(({ label, value, set }) => (
                    <div key={label}>
                      <label className="block text-xs text-gray-500 mb-1">{label}</label>
                      <input
                        value={value}
                        onChange={(e) => set(e.target.value)}
                        type="number"
                        min="0"
                        placeholder="–"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:outline-none"
                      />
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* ── Save ───────────────────────────────────────────────────────── */}
          <div className="flex justify-end gap-3 pb-8">
            <Link
              href="/recipes"
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
            <div className="relative overflow-visible">
              <TadkaEffect
                trigger={tadkaBurst}
                onComplete={() => setTadkaBurst(false)}
              />
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60 shadow-sm"
              style={{ background: "var(--accent)", color: "#fff" }}
              >
                {saving && <Loader2 size={15} className="animate-spin" />}
                {saving ? "Saving…" : "Save Recipe"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
