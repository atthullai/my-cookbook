"use client";

// HOME PAGE MAP
// This is the first screen after opening the site.
// It loads the logged-in user's recipes, lets you search/filter them, and shows the newest cards.
// If you want to change the homepage wording, hero buttons, stats, or recipe-card layout, start here.

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppIcon from "@/components/AppIcon";
import BadgeChip from "@/components/BadgeChip";
import type { AppLanguage, AppUser, RecipeRecord } from "@/lib/recipe-types";
import { getRecipeCourse, getRecipeCuisine, getRecipeDifficulty, getRecipeTitle } from "@/lib/recipe-types";
import { mapRecipeRows } from "@/lib/recipe-db";
import { deriveNutritionClaimTags, getRecipeCoverImage } from "@/lib/recipe-view";
import { supabase } from "@/lib/supabase";

export default function Home() {
  // These state values are the little memory boxes React keeps for this page.
  // When a user types, clicks a filter, logs in, or data loads, these values change and the page redraws.
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
    // This combines the search text and the dropdown/chip filters.
    // If a recipe passes every check below, it appears on the home page.
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
  const cuisineCount = cuisines.length;
  const badgeCount = badges.length;

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
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Private Recipe Studio</p>
          <h1>My Cookbook</h1>
          <p>A warm, private place for family recipes, bilingual notes, cover photos, and the cooks who taught each dish.</p>
        </div>

        <div className="hero-side">
          <div className="cookbook-graphic" aria-hidden="true">
            <span className="steam-line steam-one" />
            <span className="steam-line steam-two" />
            <div className="plate-graphic">
              <span className="plate-section plate-protein" />
              <span className="plate-section plate-carb" />
              <span className="plate-section plate-fiber" />
            </div>
            <div className="graphic-bars">
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="hero-actions">
            {user?.email ? <span className="user-pill">{user.email}</span> : null}

            {user ? (
              <button className="button" type="button" onClick={handleLogout}>
                <AppIcon name="logout" size={16} />
                Logout
              </button>
            ) : (
              <Link href="/login" className="button">
                <AppIcon name="login" size={16} />
                Login
              </Link>
            )}

            <Link href="/add" className="button button-primary">
              <AppIcon name="add" size={16} />
              Add Recipe
            </Link>
          </div>
        </div>
      </section>

      <div className="dashboard-strip">
        <div className="stat-tile">
          <strong>{recipes.length}</strong>
          <span>saved recipes</span>
        </div>
        <div className="stat-tile">
          <strong>{cuisineCount}</strong>
          <span>cuisines</span>
        </div>
        <div className="stat-tile">
          <strong>{badgeCount}</strong>
          <span>helpful badges</span>
        </div>
      </div>

      <div className="card card-accent browse-panel">
        <div>
          <h2 style={{ marginBottom: 8 }}>Browse the Cookbook</h2>
          <p style={{ marginBottom: 0 }}>Start with the newest recipes here, or open the full index for category browsing and management.</p>
        </div>
        <div className="section-link-grid">
          <Link href="/recipes" className="button">
            <AppIcon name="book" size={16} />
            Open Recipe Index
          </Link>
          <Link href="/about" className="button">
            <AppIcon name="about" size={16} />
            About Me
          </Link>
          {user ? (
            <button className="button button-danger" type="button" onClick={() => void handleDeleteAllRecipes()}>
              <AppIcon name="delete" size={16} />
              Delete My Recipes
            </button>
          ) : null}
        </div>
      </div>

      <div className="card toolbar-panel">
        <div className="section-heading-row">
          <div>
            <h2 style={{ marginBottom: 6 }}>Find something good</h2>
            <p>Search by title, cuisine, course, tag, or nutrition badge.</p>
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
          <input className="input" placeholder="Search recipes, cuisine, course, or badges..." value={search} onChange={(event) => setSearch(event.target.value)} />

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
              <BadgeChip key={badge} badge={badge} lang={lang} active={selectedBadge === badge} asButton onClick={() => setSelectedBadge(badge)} />
            ))}
          </div>
        ) : null}
      </div>

      {loading ? <div className="empty-state" style={{ marginTop: 16 }}>Loading recipes...</div> : null}
      {!loading && filteredRecipes.length === 0 ? <div className="empty-state" style={{ marginTop: 16 }}>No recipes found yet.</div> : null}

      <div style={{ marginTop: 18 }}>
        <div className="section-heading-row">
          <div>
            <h2 style={{ marginBottom: 6 }}>Newest Recipes</h2>
            <p>{filteredRecipes.length} matching recipe{filteredRecipes.length === 1 ? "" : "s"}</p>
          </div>
          <Link href="/recipes" className="button button-soft">
            <AppIcon name="book" size={16} />
            View All
          </Link>
        </div>

        <div className="recipe-card-grid">
          {latestRecipes.map((recipe) => {
            const coverImage = getRecipeCoverImage(recipe);

            return (
              <article key={recipe.id} className="card recipe-preview-card" style={{ overflow: "hidden" }}>
                {coverImage ? <Image src={coverImage} alt={`${recipe.title_en} cover`} width={1200} height={800} className="recipe-card-photo" /> : <div className="recipe-card-photo recipe-card-photo-placeholder"><AppIcon name="recipe" size={30} /></div>}

                <div className="recipe-card-body">
                  <div>
                    <h2 className="recipe-card-title">
                      <Link href={`/recipe/${recipe.id}`}>{getRecipeTitle(recipe, lang)}</Link>
                    </h2>
                    <div className="recipe-card-meta">
                      {[getRecipeCuisine(recipe, lang), getRecipeCourse(recipe, lang), getRecipeDifficulty(recipe, lang)].filter(Boolean).map((item) => (
                        <span className="meta-pill" key={item}>{item}</span>
                      ))}
                      {[recipe.prep_time, recipe.cook_time, recipe.total_time].filter(Boolean).map((item) => (
                        <span className="meta-pill" key={item}>{item}</span>
                      ))}
                    </div>
                    <p style={{ marginTop: 10, marginBottom: 0 }}>
                      By {recipe.author_name}
                      {recipe.learned_from ? ` • Learned from ${recipe.learned_from}` : ""}
                    </p>
                  </div>

                  {user?.id === recipe.user_id ? (
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
                  ) : null}

                  {[...recipe.badges, ...deriveNutritionClaimTags(recipe, "en")].length > 0 ? (
                    <div className="filter-chips" style={{ marginTop: 0 }}>
                      {[...new Set([...recipe.badges, ...deriveNutritionClaimTags(recipe, "en")])].map((badge) => (
                        <BadgeChip key={`${recipe.id}-${badge}`} badge={badge} lang={lang} />
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
