"use client";

import Image from "next/image";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import Link from "next/link";
import { mapRecipeRows } from "@/lib/recipe-db";
import type { AppLanguage, RecipeRecord } from "@/lib/recipe-types";
import { getBadgeLabel, getRecipeCourse, getRecipeCuisine, getRecipeDifficulty } from "@/lib/recipe-types";
import { deriveNutritionClaimTags, getRecipeCoverImage } from "@/lib/recipe-view";
import { supabase } from "@/lib/supabase";

export default function RecipeIndexPage() {
  const [recipes, setRecipes] = useState<RecipeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedBadge, setSelectedBadge] = useState("");
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
            <button key={badge} className="button" type="button" onClick={() => setSelectedBadge(badge)} style={{ background: selectedBadge === badge ? "#f0d6c5" : undefined }}>
              {getBadgeLabel(badge, lang)}
            </button>
          ))}
        </div>
      ) : null}

      {loading ? <p>Loading recipes...</p> : null}

      {categories.map((category) => (
        <section key={category} style={{ marginTop: 28 }}>
          <h2 style={{ marginBottom: 12 }}>{category}</h2>
          <div className="recipe-card-grid">
            {filteredRecipes
              .filter((recipe) => recipe.category === category)
              .map((recipe) => {
                const coverImage = getRecipeCoverImage(recipe);

                return (
                  <div key={recipe.id} className="card" style={{ overflow: "hidden" }}>
                    {coverImage ? <Image src={coverImage} alt={`${recipe.title_en} cover`} width={1200} height={800} className="recipe-card-photo" /> : null}

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
                            <span key={`${recipe.id}-${badge}`} className="chip">
                              {getBadgeLabel(badge, lang)}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Link href={`/edit/${recipe.id}`} className="button">
                          Edit
                        </Link>
                        <button className="button button-danger" type="button" onClick={() => void handleDelete(recipe.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      ))}
    </main>
  );
}
