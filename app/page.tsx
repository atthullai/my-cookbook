"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AppLanguage, AppUser, RecipeRecord } from "@/lib/recipe-types";
import { getBadgeLabel, getRecipeCourse, getRecipeCuisine, getRecipeDifficulty, getRecipeTitle } from "@/lib/recipe-types";
import { mapRecipeRows } from "@/lib/recipe-db";
import { deriveNutritionClaimTags, getRecipeCoverImage } from "@/lib/recipe-view";
import { supabase } from "@/lib/supabase";

export default function Home() {
  // Home keeps just enough state for newest recipes plus quick filters.
  const [recipes, setRecipes] = useState<RecipeRecord[]>([]);
  const [user, setUser] = useState<AppUser | null>(null);
  const [lang, setLang] = useState<AppLanguage>("en");
  const [search, setSearch] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedBadge, setSelectedBadge] = useState("");
  const [loading, setLoading] = useState(true);

  const recipeLabel = (value: string, field: "cuisine" | "course") => {
    const recipeMatch = recipes.find((recipe) => recipe[field] === value);

    if (!recipeMatch) {
      return value;
    }

    return field === "cuisine" ? getRecipeCuisine(recipeMatch, "de") || value : getRecipeCourse(recipeMatch, "de") || value;
  };

  const fetchRecipes = async (currentUser: AppUser | null) => {
    // When nobody is logged in, the private cookbook should not show personal recipes.
    if (!currentUser) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.from("recipes").select("*").eq("user_id", currentUser.id).order("id", { ascending: false });

    if (error) {
      alert(error.message);
      setRecipes([]);
    } else {
      setRecipes(mapRecipeRows(data ?? []));
    }

    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      setUser(currentUser);

      // The UI defaults to the browser language, but users can still toggle manually later.
      const browserLang = navigator.language.toLowerCase();
      setLang(browserLang.includes("de") ? "de" : "en");

      await fetchRecipes(currentUser);
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

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
        recipe.category ?? "",
        recipe.cuisine ?? "",
        recipe.cuisine_de ?? "",
        recipe.course ?? "",
        recipe.course_de ?? "",
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

  const latestRecipes = filteredRecipes.slice(0, 6);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert(error.message);
      return;
    }
    window.location.reload();
  };

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

  const handleDeleteAllRecipes = async () => {
    if (!user) {
      alert("Please log in first.");
      return;
    }

    const confirmed = window.confirm("Delete all your saved recipes?");
    if (!confirmed) return;

    const { error } = await supabase.from("recipes").delete().eq("user_id", user.id);
    if (error) {
      alert(error.message);
      return;
    }

    setRecipes([]);
  };

  return (
    <main className="container">
      {/* This top block acts like a dashboard header: identity, auth, and big cookbook actions. */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1>My Cookbook</h1>
          <p style={{ marginBottom: 0 }}>
            A private family cookbook with bilingual recipes, cover photos, structured methods, and all the people I learned from.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {user?.email ? <span style={{ fontSize: 12, opacity: 0.75 }}>{user.email}</span> : null}

          {user ? (
            <button className="button" type="button" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <Link href="/login" className="button">
              Login
            </Link>
          )}

          <Link href="/add" className="button button-primary">
            + Add Recipe
          </Link>
          {user ? (
            <button className="button button-danger" type="button" onClick={() => void handleDeleteAllRecipes()}>
              Delete My Recipes
            </button>
          ) : null}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h2 style={{ marginBottom: 8 }}>Browse the Cookbook</h2>
        <p style={{ marginBottom: 12 }}>
          Home shows the newest recipes. The recipe index gives you the full structured collection with filtering and management.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/recipes" className="button">
            Open Recipe Index
          </Link>
          <Link href="/about" className="button">
            About Me
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, marginTop: 16 }}>
        <button className="button" type="button" onClick={() => setLang("en")} style={{ background: lang === "en" ? "#f0d6c5" : undefined }}>
          EN
        </button>
        <button className="button" type="button" onClick={() => setLang("de")} style={{ background: lang === "de" ? "#f0d6c5" : undefined }}>
          DE
        </button>
      </div>

      <input className="input" placeholder="Search recipes, cuisine, course, or badges..." value={search} onChange={(event) => setSearch(event.target.value)} />

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

      {loading ? <p style={{ marginTop: 12 }}>Loading recipes...</p> : null}
      {!loading && filteredRecipes.length === 0 ? <p style={{ marginTop: 12 }}>No recipes found yet.</p> : null}

      <div style={{ marginTop: 18 }}>
        <h2 style={{ marginBottom: 10 }}>Newest Recipes</h2>

        <div className="recipe-card-grid">
          {latestRecipes.map((recipe) => {
            const coverImage = getRecipeCoverImage(recipe);

            return (
              <div key={recipe.id} className="card" style={{ overflow: "hidden" }}>
                {coverImage ? <Image src={coverImage} alt={`${recipe.title_en} cover`} width={1200} height={800} className="recipe-card-photo" /> : null}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 16,
                    flexWrap: "wrap",
                    marginTop: coverImage ? 14 : 0,
                  }}
                >
                  <div style={{ flex: "1 1 280px", minWidth: 0 }}>
                    <Link href={`/recipe/${recipe.id}`}>
                      <h2 style={{ marginBottom: 6 }}>{getRecipeTitle(recipe, lang)}</h2>
                    </Link>
                    <p style={{ marginBottom: 6 }}>{[getRecipeCuisine(recipe, lang), getRecipeCourse(recipe, lang), getRecipeDifficulty(recipe, lang)].filter(Boolean).join(" • ")}</p>
                    <p style={{ marginBottom: 6 }}>{[recipe.prep_time, recipe.cook_time, recipe.total_time].filter(Boolean).join(" • ")}</p>
                    <p style={{ marginTop: 8, marginBottom: 0 }}>
                      By {recipe.author_name}
                      {recipe.learned_from ? ` • Learned from ${recipe.learned_from}` : ""}
                    </p>
                  </div>

                  {user?.id === recipe.user_id ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Link href={`/edit/${recipe.id}`} className="button">
                        Edit
                      </Link>
                      <button className="button button-danger" type="button" onClick={() => void handleDelete(recipe.id)}>
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>

                {[...recipe.badges, ...deriveNutritionClaimTags(recipe, "en")].length > 0 ? (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                    {[...new Set([...recipe.badges, ...deriveNutritionClaimTags(recipe, "en")])].map((badge) => (
                      <span key={`${recipe.id}-${badge}`} className="chip">
                        {getBadgeLabel(badge, lang)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
