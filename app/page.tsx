"use client";

// HOME PAGE MAP
// This is the first screen after opening the site.
// It loads the logged-in user's recipes, lets you search/filter them, and shows the newest cards.
// If you want to change the homepage wording, hero buttons, stats, or recipe-card layout, start here.

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppIcon from "@/components/AppIcon";
import BadgeChip from "@/components/BadgeChip";
import { FadeUp, Stagger, StaggerItem } from "@/components/MotionPrimitives";
import { useToast } from "@/components/ToastProvider";
import type { AppLanguage, AppUser, RecipeRecord } from "@/lib/recipe-types";
import { getRecipeCourse, getRecipeCuisine, getRecipeDifficulty, getRecipeTitle } from "@/lib/recipe-types";
import { mapRecipeRows } from "@/lib/recipe-db";
import { deriveNutritionClaimTags, getRecipeCoverImage } from "@/lib/recipe-view";
import { nutritionTagId, recipeBadgeId, recipeTimingId, stableCompositeId } from "@/lib/stable-ids";
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
  const [loadError, setLoadError] = useState("");
  const { notify } = useToast();

  const recipeLabel = (value: string, field: "cuisine" | "course") => {
    const recipeMatch = recipes.find((recipe) => recipe[field] === value);

    if (!recipeMatch) {
      return value;
    }

    return field === "cuisine" ? getRecipeCuisine(recipeMatch, "de") || value : getRecipeCourse(recipeMatch, "de") || value;
  };

  const fetchRecipes = useCallback(async (currentUser: AppUser | null) => {
    // When nobody is logged in, the private cookbook should not show personal recipes.
    if (!currentUser) {
      setRecipes([]);
      setLoading(false);
      setLoadError("");
      return;
    }

    const { data, error } = await supabase.from("recipes").select("*").eq("user_id", currentUser.id).order("id", { ascending: false });

    if (error) {
      setLoadError(error.message);
      notify({ tone: "error", title: "Could not load recipes", message: "Check your connection and try again." });
      setRecipes([]);
    } else {
      setLoadError("");
      setRecipes(mapRecipeRows(data ?? []));
    }

    setLoading(false);
  }, [notify]);

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
  }, [fetchRecipes]);

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
  const todayPick = filteredRecipes.find((recipe) => recipe.course?.toLowerCase().includes("dinner")) ?? filteredRecipes[0];
  const productionVersion = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "local";
  const productionBranch = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF || "main";
  const pantrySuggestions = filteredRecipes
    .filter((recipe) => recipe.ingredients.some((group) => group.items.some((item) => /rice|dal|onion|tomato|salt|oil/i.test(item.name_en))))
    .slice(0, 3);
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
      <section className="hero-panel editorial-hero">
        <div className="hero-copy">
          <p className="eyebrow">Private Recipe Studio</p>
          <h1>My Cookbook</h1>
          <p>A warm, private place for family recipes, bilingual notes, cover photos, and the cooks who taught each dish.</p>
        </div>

        <div className="hero-side">
          <div className="cookbook-graphic simmer-scene" aria-hidden="true">
            <span className="steam-line steam-one" />
            <span className="steam-line steam-two" />
            <span className="steam-line steam-three" />
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

      <Stagger className="dashboard-command-grid" ariaLabel="Cooking dashboard">
        <StaggerItem>
        <div className="card today-card">
          <p className="eyebrow">What to cook today</p>
          {todayPick ? (
            <>
              <h2>{getRecipeTitle(todayPick, lang)}</h2>
              <p>{todayPick.description_en || [todayPick.cuisine, todayPick.course].filter(Boolean).join(" • ")}</p>
              <Link href={`/recipe/${todayPick.id}`} className="button button-primary">
                <AppIcon name="quick" size={16} />
                Start cooking
              </Link>
            </>
          ) : (
            <div className="onboarding-empty">
              <div className="empty-illustration steam-cup" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <p>Your first recipe can begin as a family note, a URL import, or a pantry idea.</p>
              <div className="section-link-grid">
                <Link href="/add" className="button button-primary">Import or add recipe</Link>
                <Link href="/pantry" className="button">Set up pantry</Link>
              </div>
            </div>
          )}
        </div>
        </StaggerItem>
        <StaggerItem>
        <div className="card meal-plan-card">
          <p className="eyebrow">Weekly meal overview</p>
          <div className="meal-week-grid">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, dayIndex) => (
              <div key={stableCompositeId("week", day)} className="meal-day">
                <strong>{day}</strong>
                <span>{filteredRecipes[dayIndex % Math.max(filteredRecipes.length, 1)]?.title_en || "Plan meal"}</span>
              </div>
            ))}
          </div>
        </div>
        </StaggerItem>
        <StaggerItem>
        <div className="card pantry-card">
          <p className="eyebrow">Pantry suggestions</p>
          <div className="compact-list">
            {(pantrySuggestions.length > 0 ? pantrySuggestions : latestRecipes.slice(0, 3)).map((recipe) => (
              <Link key={stableCompositeId("pantry", recipe.id)} href={`/recipe/${recipe.id}`}>
                {getRecipeTitle(recipe, lang)}
              </Link>
            ))}
          </div>
        </div>
        </StaggerItem>
        <StaggerItem>
        <div className="card grocery-card">
          <p className="eyebrow">Quick grocery actions</p>
          <div className="section-link-grid">
            <Link href="/recipes" className="button">
              Generate list
            </Link>
            <Link href="/add" className="button">
              Add pantry item
            </Link>
          </div>
        </div>
        </StaggerItem>
      </Stagger>

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

      <div className="deployment-ribbon" aria-label="Deployment status">
        <span><strong>Build health</strong> Passing local checks</span>
        <span><strong>Production version</strong> {productionVersion}</span>
        <span><strong>Branch</strong> {productionBranch}</span>
        <span><strong>Latest release</strong> Premium cookbook refinement</span>
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
              <BadgeChip key={stableCompositeId("home-filter", badge)} badge={badge} lang={lang} active={selectedBadge === badge} asButton onClick={() => setSelectedBadge(badge)} />
            ))}
          </div>
        ) : null}
      </div>

      {loading ? <div className="skeleton-page" style={{ marginTop: 16 }}><div className="skeleton-line" /><div className="skeleton-card" /></div> : null}
      {!loading && loadError ? (
        <div className="empty-state empty-state-action illustrated-empty" style={{ marginTop: 16 }}>
          <div className="empty-illustration steam-cup" aria-hidden="true"><span /><span /><span /></div>
          <h2>Recipes could not load</h2>
          <p>{typeof navigator === "undefined" || navigator.onLine ? "The kitchen connection hiccuped. Try again in a moment." : "You are offline. Saved offline views will remain available once caching is enabled."}</p>
          <button className="button button-primary" type="button" onClick={() => void fetchRecipes(user)}>Retry</button>
        </div>
      ) : null}
      {!loading && !loadError && filteredRecipes.length === 0 ? (
        <div className="empty-state empty-state-action illustrated-empty" style={{ marginTop: 16 }}>
          <div className="empty-illustration sprinkle-bowl" aria-hidden="true"><span /><span /><span /><span /></div>
          <h2>Start your family cookbook</h2>
          <p>Import a favorite recipe, add a handwritten classic, or begin with pantry staples like rice, dal, tomatoes, and coriander.</p>
          <Link href="/add" className="button button-primary">Add the first recipe</Link>
        </div>
      ) : null}

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

        <FadeUp className="recipe-card-grid">
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
                        <BadgeChip key={badge.startsWith("Good") || badge.startsWith("Excellent") ? nutritionTagId(recipe.id, badge) : recipeBadgeId(recipe.id, badge)} badge={badge} lang={lang} />
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </FadeUp>
      </div>
    </main>
  );
}
