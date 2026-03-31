"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AppLanguage, AppUser, RecipeRecord } from "@/lib/recipe-types";
import { getRecipeTitle, normalizeRecipe } from "@/lib/recipe-types";
import { applySampleRecipePreset, buildSampleRecipe } from "@/lib/sample-recipes";
import { supabase } from "@/lib/supabase";

export default function Home() {
  // Keep homepage state narrow and typed so list, search, and actions stay predictable.
  const [recipes, setRecipes] = useState<RecipeRecord[]>([]);
  const [user, setUser] = useState<AppUser | null>(null);
  const [lang, setLang] = useState<AppLanguage>("en");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Fetch auth state first, then pull only the current user's private recipes.
    const fetchData = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      setUser(currentUser);

      const browserLang = navigator.language.toLowerCase();
      setLang(browserLang.includes("de") ? "de" : "en");

      if (!currentUser) {
        setRecipes([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("id", { ascending: false });

      if (!isMounted) {
        return;
      }

      if (error) {
        alert(error.message);
        setRecipes([]);
      } else {
        setRecipes((data ?? []).map(normalizeRecipe).map(applySampleRecipePreset));
      }

      setLoading(false);
    };

    void fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Search both languages so switching language never hides a known recipe unexpectedly.
  const categories = ["All", ...new Set(recipes.map((recipe) => recipe.category?.trim()).filter(Boolean) as string[])];

  const filteredRecipes = recipes.filter((recipe) => {
    const searchValue = search.trim().toLowerCase();
    const categoryMatches =
      selectedCategory === "All" || (recipe.category ?? "").toLowerCase() === selectedCategory.toLowerCase();

    if (!categoryMatches) {
      return false;
    }

    if (!searchValue) {
      return true;
    }

    return [recipe.title_en, recipe.title_de ?? "", recipe.category ?? "", recipe.tags.join(" ")]
      .join(" ")
      .toLowerCase()
      .includes(searchValue);
  });

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

    if (!confirmed) {
      return;
    }

    const { error } = await supabase.from("recipes").delete().eq("id", recipeId);

    if (error) {
      alert(error.message);
      return;
    }

    setRecipes((currentRecipes) => currentRecipes.filter((recipe) => recipe.id !== recipeId));
  };

  const handleImportSampleRecipe = async () => {
    if (!user) {
      alert("Please log in first.");
      return;
    }

    const hasRecipeAlready = recipes.some((recipe) => recipe.title_en === "Choux Au Craquelin (Cream Puff)");

    if (hasRecipeAlready) {
      alert("The sample recipe is already in your cookbook.");
      return;
    }

    const { data, error } = await supabase
      .from("recipes")
      .insert([buildSampleRecipe(user.id)])
      .select()
      .single();

    if (error || !data) {
      alert(error?.message || "Could not import the sample recipe.");
      return;
    }

    setRecipes((currentRecipes) => [applySampleRecipePreset(normalizeRecipe(data)), ...currentRecipes]);
  };

  return (
    <main className="container">
      {/* Header actions stay at the top so login and recipe creation are always reachable. */}
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
          <p style={{ marginBottom: 0 }}>Private bilingual recipes, easy to search and edit.</p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {user?.email ? (
            <span style={{ fontSize: 12, opacity: 0.75 }}>{user.email}</span>
          ) : null}

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
            <button className="button" type="button" onClick={() => void handleImportSampleRecipe()}>
              Import Sample Recipe
            </button>
          ) : null}
        </div>
      </div>

      {/* Language toggle only changes display text, not stored recipe content. */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          className="button"
          type="button"
          onClick={() => setLang("en")}
          style={{ background: lang === "en" ? "#f0d6c5" : undefined }}
        >
          EN
        </button>

        <button
          className="button"
          type="button"
          onClick={() => setLang("de")}
          style={{ background: lang === "de" ? "#f0d6c5" : undefined }}
        >
          DE
        </button>
      </div>

      {/* Search is intentionally broad so it catches titles, categories, and tags. */}
      <input
        className="input"
        placeholder="Search recipes, categories, or tags..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {/* Category chips start moving the homepage toward a proper recipe index. */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        {categories.map((category) => (
          <button
            key={category}
            className="button"
            type="button"
            onClick={() => setSelectedCategory(category)}
            style={{ background: selectedCategory === category ? "#f0d6c5" : undefined }}
          >
            {category}
          </button>
        ))}
      </div>

      {loading ? <p style={{ marginTop: 12 }}>Loading recipes...</p> : null}

      {!loading && filteredRecipes.length === 0 ? (
        <p style={{ marginTop: 12 }}>{recipes.length === 0 ? "No recipes yet." : "No recipes match your search."}</p>
      ) : null}

      <div style={{ marginTop: 16 }}>
        {filteredRecipes.map((recipe) => (
          <div key={recipe.id} className="card">
            {/* Each card keeps actions local so edit/delete live with the recipe they affect. */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <Link href={`/recipe/${recipe.id}`}>
                  <h2 style={{ marginBottom: 6 }}>{getRecipeTitle(recipe, lang)}</h2>
                </Link>
                <p style={{ marginBottom: 0, opacity: 0.75 }}>{recipe.category || "Uncategorized"}</p>
              </div>

              {user?.id === recipe.user_id ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link href={`/edit/${recipe.id}`} className="button">
                    Edit
                  </Link>

                  <button
                    className="button button-danger"
                    type="button"
                    onClick={() => void handleDelete(recipe.id)}
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </div>

            {recipe.tags.length > 0 ? (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                {recipe.tags.map((tag) => (
                  <span
                    key={`${recipe.id}-${tag}`}
                    style={{
                      fontSize: 12,
                      border: "1px solid rgba(89, 58, 34, 0.18)",
                      padding: "4px 8px",
                      borderRadius: 999,
                      background: "rgba(255, 250, 241, 0.8)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </main>
  );
}
