"use client";

// RECIPE INDEX MAP
// This page is the full recipe library.
// It loads every recipe for the logged-in user, groups recipes by category, and keeps the filters here.
// Edit this file when you want to change the full browsing/searching experience.

import Image from "next/image";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import Link from "next/link";
import AppIcon from "@/components/AppIcon";
import BadgeChip from "@/components/BadgeChip";
import { useToast } from "@/components/ToastProvider";
import { apiRequest } from "@/lib/api-client";
import { buildRecipePayload, mapRecipeRows } from "@/lib/recipe-db";
import type { AppLanguage, RecipeRecord } from "@/lib/recipe-types";
import { EMPTY_NUTRITION, getRecipeCourse, getRecipeCuisine, getRecipeDifficulty } from "@/lib/recipe-types";
import type { ImportedRecipeDraft } from "@/lib/recipe-import";
import { deriveNutritionClaimTags, getRecipeCoverImage } from "@/lib/recipe-view";
import { nutritionTagId, recipeBadgeId, recipeTimingId, stableCompositeId } from "@/lib/stable-ids";
import { supabase } from "@/lib/supabase";

export default function RecipeIndexPage() {
  // This page has more state than home because it also upgrades older imported recipes.
  // State is just "what the screen remembers right now".
  const [recipes, setRecipes] = useState<RecipeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedBadge, setSelectedBadge] = useState("");
  const [upgrading, setUpgrading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const { notify } = useToast();
  const [lang, setLang] = useState<AppLanguage>(() =>
    typeof navigator !== "undefined" && navigator.language.toLowerCase().includes("de") ? "de" : "en"
  );

  const loadRecipes = useEffectEvent(async () => {
    // Only show recipes owned by the logged-in Supabase user.
    // This keeps the private cookbook private on the client side too.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setRecipes([]);
      setLoadError("");
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
      setLoadError(error.message);
      notify({ tone: "error", title: "Could not load recipe index", message: "Please retry when the connection settles." });
      setRecipes([]);
    } else {
      setLoadError("");
      setRecipes(mapRecipeRows(data ?? []));
    }

    setLoading(false);
  });

  useEffect(() => {
    void loadRecipes();
  }, []);

  const recipeNeedsUpgrade = (recipe: RecipeRecord) =>
    // Older imports may be missing cover photos, equipment, or structured instructions.
    // Returning true here means "try to refresh this recipe quietly in the background".
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
        const importResult = await apiRequest<{ recipe?: ImportedRecipeDraft; error?: string }>("/api/import-recipe", {
          method: "POST",
          body: { url: recipe.source_url },
          retries: 1,
          timeoutMs: 18000,
        });

        if (!importResult.recipe) {
          continue;
        }

        const imported = importResult.recipe;
        const nutritionResult = !recipe.nutrition
          ? await apiRequest<{ nutrition?: typeof EMPTY_NUTRITION }>("/api/nutrition-estimate", {
              method: "POST",
              body: {
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
              },
              retries: 1,
            })
          : null;

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
    } catch {
      notify({ tone: "info", title: "Background refresh paused", message: "Imported recipe enrichment will retry next time." });
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
    // The index filter is intentionally broad: title, description, cuisine, difficulty, tags, and badges all count.
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
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Cookbook Library</p>
          <h1>Recipe Index</h1>
          <p>A structured overview of your saved recipes with quick filters for cuisine, course, and badge labels.</p>
        </div>
        <div className="hero-actions">
          <Link href="/add" className="button button-primary">
            <AppIcon name="add" size={16} />
            Add Recipe
          </Link>
        </div>
      </section>

      <div className="dashboard-strip">
        <div className="stat-tile">
          <strong>{recipes.length}</strong>
          <span>saved recipes</span>
        </div>
        <div className="stat-tile">
          <strong>{categories.length}</strong>
          <span>visible categories</span>
        </div>
        <div className="stat-tile">
          <strong>{filteredRecipes.length}</strong>
          <span>current matches</span>
        </div>
      </div>

      <div className="card toolbar-panel">
        <div className="section-heading-row">
          <div>
            <h2 style={{ marginBottom: 6 }}>Filter the collection</h2>
            <p>Search title, cuisine, course, difficulty, tags, or badge names.</p>
          </div>
          <div className="segmented-control" aria-label="Recipe language">
            <button className={lang === "en" ? "button active" : "button"} type="button" onClick={() => setLang("en")}>
              EN
            </button>
            <button className={lang === "de" ? "button active" : "button"} type="button" onClick={() => setLang("de")}>
              DE
            </button>
          </div>
        </div>

        <div className="toolbar-row">
          <input className="input" placeholder="Search title, cuisine, course, difficulty, tags..." value={search} onChange={(event) => setSearch(event.target.value)} />

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
          <div className="filter-chips">
            <button className={selectedBadge === "" ? "button button-soft" : "button"} type="button" onClick={() => setSelectedBadge("")}>
              All badges
            </button>
            {badges.map((badge) => (
              <BadgeChip key={stableCompositeId("index-filter", badge)} badge={badge} lang={lang} active={selectedBadge === badge} asButton onClick={() => setSelectedBadge(badge)} />
            ))}
          </div>
        ) : null}
      </div>

      {loading ? <div className="skeleton-page" style={{ marginTop: 16 }}><div className="skeleton-line" /><div className="skeleton-card" /></div> : null}
      {!loading && upgrading ? <div className="empty-state" style={{ marginTop: 16 }}>Refreshing older imported recipes...</div> : null}
      {!loading && loadError ? (
        <div className="empty-state empty-state-action illustrated-empty" style={{ marginTop: 16 }}>
          <div className="empty-illustration steam-cup" aria-hidden="true"><span /><span /><span /></div>
          <h2>Recipe index could not load</h2>
          <p>{loadError}</p>
          <button className="button button-primary" type="button" onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : null}
      {!loading && !loadError && filteredRecipes.length === 0 ? <div className="empty-state" style={{ marginTop: 16 }}>No recipes match these filters yet.</div> : null}

      {categories.map((category) => (
        <section key={category} style={{ marginTop: 28 }}>
          <div className="section-heading-row">
            <div>
              <h2 style={{ marginBottom: 6 }}>{category}</h2>
              <p>{filteredRecipes.filter((recipe) => recipe.category === category).length} recipe{filteredRecipes.filter((recipe) => recipe.category === category).length === 1 ? "" : "s"}</p>
            </div>
          </div>
          <div className="recipe-card-grid">
            {filteredRecipes
              .filter((recipe) => recipe.category === category)
              .map((recipe) => {
                const coverImage = getRecipeCoverImage(recipe);

                return (
                  <article key={recipe.id} className="card recipe-preview-card" style={{ overflow: "hidden" }}>
                    {coverImage ? <Image src={coverImage} alt={`${recipe.title_en} cover`} width={1200} height={800} className="recipe-card-photo" /> : <div className="recipe-card-photo recipe-card-photo-placeholder"><AppIcon name="recipe" size={30} /></div>}

                    <div className="recipe-card-body">
                      <h3 className="recipe-card-title">
                        <Link href={`/recipe/${recipe.id}`}>{lang === "de" && recipe.title_de ? recipe.title_de : recipe.title_en}</Link>
                      </h3>
                      <p className="recipe-card-description" style={{ marginBottom: 0 }}>{lang === "de" && recipe.description_de ? recipe.description_de : recipe.description_en}</p>
                      <div className="recipe-card-meta">
                        {[getRecipeCuisine(recipe, lang), getRecipeCourse(recipe, lang), getRecipeDifficulty(recipe, lang)].filter(Boolean).map((item) => (
                          <span className="meta-pill" key={stableCompositeId(recipe.id, "meta", item)}>{item}</span>
                        ))}
                        {[
                          ["prep", recipe.prep_time],
                          ["cook", recipe.cook_time],
                          ["total", recipe.total_time],
                        ].filter((item): item is [string, string] => Boolean(item[1])).map(([slot, item]) => (
                          <span className="meta-pill" key={recipeTimingId(recipe.id, slot, item)}>{item}</span>
                        ))}
                      </div>
                      <p style={{ marginBottom: 0 }}>
                        By {recipe.author_name}
                        {recipe.learned_from ? ` • Learned from ${recipe.learned_from}` : ""}
                      </p>

                      {[...recipe.badges, ...deriveNutritionClaimTags(recipe, "en")].length > 0 ? (
                        <div className="filter-chips" style={{ marginTop: 0 }}>
                          {[...new Set([...recipe.badges, ...deriveNutritionClaimTags(recipe, "en")])].map((badge) => (
                            <BadgeChip key={badge.startsWith("Good") || badge.startsWith("Excellent") ? nutritionTagId(recipe.id, badge) : recipeBadgeId(recipe.id, badge)} badge={badge} lang={lang} />
                          ))}
                        </div>
                      ) : null}

                      <div className="recipe-card-actions">
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
