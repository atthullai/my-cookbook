"use client";

import Image from "next/image";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import Link from "next/link";
import AppIcon from "@/components/AppIcon";
import BadgeChip from "@/components/BadgeChip";
import { buildRecipePayload, mapRecipeRows } from "@/lib/recipe-db";
import type { AppLanguage, RecipeRecord } from "@/lib/recipe-types";
import { EMPTY_NUTRITION, getRecipeCourse, getRecipeCuisine, getRecipeDifficulty } from "@/lib/recipe-types";
import type { ImportedRecipeDraft } from "@/lib/recipe-import";
import { deriveNutritionClaimTags, getRecipeCoverImage } from "@/lib/recipe-view";
import { supabase } from "@/lib/supabase";

export default function RecipeIndexPage() {
  const [recipes, setRecipes] = useState<RecipeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedBadge, setSelectedBadge] = useState("");
  const [upgrading, setUpgrading] = useState(false);
  const [lang, setLang] = useState<AppLanguage>(() =>
    typeof navigator !== "undefined" && navigator.language.toLowerCase().includes("de") ? "de" : "en"
  );

  const loadRecipes = useEffectEvent(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("user_id", user.id)
      .order("category", { ascending: true })
      .order("title_en", { ascending: true });

    if (error) {
      alert(error.message);
      setRecipes([]);
    } else {
      setRecipes(mapRecipeRows(data ?? []));
    }

    setLoading(false);
  });

  useEffect(() => {
    void loadRecipes();
  }, []);

  const recipeNeedsUpgrade = (recipe: RecipeRecord) =>
    Boolean(
      recipe.source_url &&
        (!recipe.cover_image_url ||
          recipe.equipment.length === 0 ||
          recipe.instruction_sections.length === 0 ||
          recipe.steps_en.includes("## "))
    );

  const upgradeRecipes = useEffectEvent(async () => {
    const candidates = recipes.filter(recipeNeedsUpgrade);

    if (candidates.length === 0 || upgrading) {
      return;
    }

    setUpgrading(true);

    try {
      for (const recipe of candidates) {
        const importResponse = await fetch("/api/import-recipe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: recipe.source_url }),
        });

        const importResult = (await importResponse.json()) as { recipe?: ImportedRecipeDraft; error?: string };

        if (!importResponse.ok || !importResult.recipe) {
          continue;
        }

        const imported = importResult.recipe;
        const nutritionResponse = !recipe.nutrition
          ? await fetch("/api/nutrition-estimate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ingredientGroups:
                  recipe.ingredients.length > 0
                    ? recipe.ingredients.map((group) => ({
                        group_en: group.group_en,
                        group_de: group.group_de,
                        items: group.items.map((item) => ({
                          amount: item.amount === null ? "" : String(item.amount),
                          unit: item.unit,
                          name_en: item.name_en,
                          name_de: item.name_de,
                        })),
                      }))
                    : imported.ingredients.map((group) => ({
                        group_en: group.group_en,
                        group_de: "",
                        items: group.items.map((item) => ({
                          amount: item.amount,
                          unit: item.unit,
                          name_en: item.name_en,
                          name_de: "",
                        })),
                      })),
                servings: recipe.servings ? String(recipe.servings) : imported.servings,
              }),
            })
          : null;

        const nutritionResult = nutritionResponse ? ((await nutritionResponse.json()) as { nutrition?: typeof EMPTY_NUTRITION }) : null;
        const upgradedPayload = buildRecipePayload({
          slug: recipe.slug,
          titleEn: recipe.title_en,
          titleDe: recipe.title_de || "",
          authorName: recipe.author_name || "Atthuzhai",
          learnedFrom: recipe.learned_from || imported.learnedFrom,
          descriptionEn: recipe.description_en || imported.description,
          descriptionDe: recipe.description_de || "",
          category: recipe.category || imported.category,
          cuisine: recipe.cuisine || imported.cuisine,
          cuisineDe: recipe.cuisine_de || "",
          course: recipe.course || imported.course,
          courseDe: recipe.course_de || "",
          difficulty: recipe.difficulty || imported.difficulty,
          difficultyDe: recipe.difficulty_de || "",
          prepTime: recipe.prep_time || imported.prepTime,
          cookTime: recipe.cook_time || imported.cookTime,
          totalTime: recipe.total_time || imported.totalTime,
          tags: recipe.tags.length > 0 ? recipe.tags.join(", ") : imported.tags,
          badges: recipe.badges.length > 0 ? recipe.badges : imported.badges,
          ingredientGroups:
            recipe.ingredients.length > 0
              ? recipe.ingredients.map((group) => ({
                  group_en: group.group_en,
                  group_de: group.group_de,
                  items: group.items.map((item) => ({
                    amount: item.amount === null ? "" : String(item.amount),
                    unit: item.unit,
                    name_en: item.name_en,
                    name_de: item.name_de,
                  })),
                }))
              : imported.ingredients.map((group) => ({
                  group_en: group.group_en,
                  group_de: "",
                  items: group.items.map((item) => ({
                    amount: item.amount,
                    unit: item.unit,
                    name_en: item.name_en,
                    name_de: "",
                  })),
                })),
          instructionSections:
            recipe.instruction_sections.length > 0 && !recipe.steps_en.includes("## ")
              ? recipe.instruction_sections.map((section) => ({
                  title_en: section.title_en,
                  title_de: section.title_de,
                  steps_en: section.steps_en.join("\n"),
                  steps_de: section.steps_de.join("\n"),
                }))
              : imported.instructionSections.map((section) => ({
                  title_en: section.title_en,
                  title_de: "",
                  steps_en: section.steps_en.join("\n"),
                  steps_de: "",
                })),
          notesEn: recipe.notes_en || imported.notesEn,
          notesDe: recipe.notes_de || "",
          tipsEn: recipe.tips_en || imported.tipsEn,
          tipsDe: recipe.tips_de || "",
          storageEn: recipe.storage_en || "",
          storageDe: recipe.storage_de || "",
          nutrition: recipe.nutrition ? { ...EMPTY_NUTRITION, ...recipe.nutrition } : nutritionResult?.nutrition || { ...EMPTY_NUTRITION },
          faq:
            recipe.faq && recipe.faq.length > 0
              ? recipe.faq.map((item) => ({
                  question_en: item.question_en,
                  question_de: item.question_de,
                  answer_en: item.answer_en,
                  answer_de: item.answer_de,
                }))
              : imported.faq.map((item) => ({
                  question_en: item.question_en,
                  question_de: "",
                  answer_en: item.answer_en,
                  answer_de: "",
                })),
          troubleshooting:
            recipe.troubleshooting?.map((item) => ({
              issue_en: item.issue_en,
              issue_de: item.issue_de,
              fix_en: item.fix_en,
              fix_de: item.fix_de,
            })) || [],
          stepPhotos:
            recipe.step_photos?.map((item) => ({
              step_number: item.step_number,
              image_url: item.image_url,
              caption_en: item.caption_en,
              caption_de: item.caption_de,
            })) || [],
          sourceUrl: recipe.source_url || imported.sourceUrl,
          videoUrl: recipe.video_url || imported.videoUrl,
          servings: recipe.servings ? String(recipe.servings) : imported.servings,
          equipment:
            recipe.equipment.length > 0
              ? recipe.equipment.map((item) => ({
                  label_en: item.label_en,
                  label_de: item.label_de,
                }))
              : imported.equipment.map((item) => ({
                  label_en: item.label_en,
                  label_de: "",
                })),
          imageUrls: recipe.cover_image_url || imported.coverImageUrl,
          coverImageUrl: recipe.cover_image_url || imported.coverImageUrl,
        });

        await supabase.from("recipes").update(upgradedPayload).eq("id", recipe.id);
      }

      await loadRecipes();
    } finally {
      setUpgrading(false);
    }
  });

  useEffect(() => {
    if (!loading && recipes.length > 0) {
      void upgradeRecipes();
    }
  }, [loading, recipes]);

  const recipeLabel = (value: string, field: "cuisine" | "course") => {
    const recipeMatch = recipes.find((recipe) => recipe[field] === value);

    if (!recipeMatch) {
      return value;
    }

    return field === "cuisine" ? getRecipeCuisine(recipeMatch, "de") || value : getRecipeCourse(recipeMatch, "de") || value;
  };

  const cuisines = useMemo(() => Array.from(new Set(recipes.map((recipe) => recipe.cuisine).filter(Boolean))) as string[], [recipes]);
  const courses = useMemo(() => Array.from(new Set(recipes.map((recipe) => recipe.course).filter(Boolean))) as string[], [recipes]);
  const badges = useMemo(
    () => Array.from(new Set(recipes.flatMap((recipe) => [...recipe.badges, ...deriveNutritionClaimTags(recipe, "en")]))).sort(),
    [recipes]
  );

  const filteredRecipes = recipes.filter((recipe) => {
    const searchValue = search.trim().toLowerCase();
    const matchesSearch =
      !searchValue ||
      [
        recipe.title_en,
        recipe.title_de ?? "",
        recipe.description_en ?? "",
        recipe.category ?? "",
        recipe.cuisine ?? "",
        recipe.cuisine_de ?? "",
        recipe.course ?? "",
        recipe.course_de ?? "",
        recipe.difficulty ?? "",
        recipe.difficulty_de ?? "",
        recipe.tags.join(" "),
        recipe.badges.join(" "),
        deriveNutritionClaimTags(recipe, "en").join(" "),
        deriveNutritionClaimTags(recipe, "de").join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchValue);

    const matchesCuisine = !selectedCuisine || recipe.cuisine === selectedCuisine;
    const matchesCourse = !selectedCourse || recipe.course === selectedCourse;
    const matchesBadge = !selectedBadge || [...recipe.badges, ...deriveNutritionClaimTags(recipe, "en")].includes(selectedBadge);

    return matchesSearch && matchesCuisine && matchesCourse && matchesBadge;
  });

  const categories = Array.from(new Set(filteredRecipes.map((recipe) => recipe.category).filter(Boolean)));

  const handleDelete = async (recipeId: number) => {
    const confirmed = window.confirm("Delete this recipe?");
    if (!confirmed) return;

    const { error } = await supabase.from("recipes").delete().eq("id", recipeId);
    if (error) {
      alert(error.message);
      return;
    }

    setRecipes((current) => current.filter((recipe) => recipe.id !== recipeId));
  };

  return (
    <main className="container">
      <h1>Recipe Index</h1>
      <p>A structured overview of your Supabase cookbook with filters for cuisine, course, and quick badge labels.</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, marginTop: 16 }}>
        <button className="button" type="button" onClick={() => setLang("en")} style={{ background: lang === "en" ? "#f0d6c5" : undefined }}>
          EN
        </button>
        <button className="button" type="button" onClick={() => setLang("de")} style={{ background: lang === "de" ? "#f0d6c5" : undefined }}>
          DE
        </button>
      </div>

      <input className="input" placeholder="Search title, cuisine, course, difficulty, tags..." value={search} onChange={(event) => setSearch(event.target.value)} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, marginTop: 12 }}>
        <select className="input" value={selectedCuisine} onChange={(event) => setSelectedCuisine(event.target.value)}>
          <option value="">All cuisines</option>
          {cuisines.map((cuisine) => (
            <option key={cuisine} value={cuisine}>
              {lang === "de" ? recipeLabel(cuisine, "cuisine") : cuisine}
            </option>
          ))}
        </select>
        <select className="input" value={selectedCourse} onChange={(event) => setSelectedCourse(event.target.value)}>
          <option value="">All courses</option>
          {courses.map((course) => (
            <option key={course} value={course}>
              {lang === "de" ? recipeLabel(course, "course") : course}
            </option>
          ))}
        </select>
      </div>

      {badges.length > 0 ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <button className="button" type="button" onClick={() => setSelectedBadge("")} style={{ background: selectedBadge === "" ? "#f0d6c5" : undefined }}>
            All badges
          </button>
          {badges.map((badge) => (
            <BadgeChip key={badge} badge={badge} lang={lang} active={selectedBadge === badge} asButton onClick={() => setSelectedBadge(badge)} />
          ))}
        </div>
      ) : null}

      {loading ? <p>Loading recipes...</p> : null}
      {!loading && upgrading ? <p>Refreshing older imported recipes...</p> : null}

      {categories.map((category) => (
        <section key={category} style={{ marginTop: 28 }}>
          <h2 style={{ marginBottom: 12 }}>{category}</h2>
          <div className="recipe-card-grid">
            {filteredRecipes
              .filter((recipe) => recipe.category === category)
              .map((recipe) => {
                const coverImage = getRecipeCoverImage(recipe);

                return (
                  <article key={recipe.id} className="card recipe-preview-card" style={{ overflow: "hidden" }}>
                    {coverImage ? <Image src={coverImage} alt={`${recipe.title_en} cover`} width={1200} height={800} className="recipe-card-photo" /> : <div className="recipe-card-photo recipe-card-photo-placeholder"><AppIcon name="recipe" size={30} /></div>}

                    <div style={{ marginTop: coverImage ? 14 : 0 }}>
                      <Link href={`/recipe/${recipe.id}`}>
                        <h3 style={{ marginBottom: 8 }}>{lang === "de" && recipe.title_de ? recipe.title_de : recipe.title_en}</h3>
                      </Link>
                      <p style={{ marginBottom: 8 }}>{lang === "de" && recipe.description_de ? recipe.description_de : recipe.description_en}</p>
                      <p style={{ marginBottom: 8 }}>{[getRecipeCuisine(recipe, lang), getRecipeCourse(recipe, lang), getRecipeDifficulty(recipe, lang)].filter(Boolean).join(" • ")}</p>
                      <p style={{ marginBottom: 8 }}>{[recipe.prep_time, recipe.cook_time, recipe.total_time].filter(Boolean).join(" • ")}</p>
                      <p style={{ marginBottom: 8 }}>
                        By {recipe.author_name}
                        {recipe.learned_from ? ` • Learned from ${recipe.learned_from}` : ""}
                      </p>

                      {[...recipe.badges, ...deriveNutritionClaimTags(recipe, "en")].length > 0 ? (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                          {[...new Set([...recipe.badges, ...deriveNutritionClaimTags(recipe, "en")])].map((badge) => (
                            <BadgeChip key={`${recipe.id}-${badge}`} badge={badge} lang={lang} />
                          ))}
                        </div>
                      ) : null}

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Link href={`/edit/${recipe.id}`} className="button">
                          <AppIcon name="edit" size={16} />
                          Edit
                        </Link>
                        <button className="button button-danger" type="button" onClick={() => void handleDelete(recipe.id)}>
                          <AppIcon name="delete" size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
          </div>
        </section>
      ))}
    </main>
  );
}
