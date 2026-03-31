"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AppLanguage, AppUser, RecipeRecord } from "@/lib/recipe-types";
import { getRecipeTitle } from "@/lib/recipe-types";
import { mapRecipeRows } from "@/lib/recipe-db";
import { supabase } from "@/lib/supabase";

export default function Home() {
  // Home only keeps the state needed to show the newest recipes and global actions.
  const [recipes, setRecipes] = useState<RecipeRecord[]>([]);
  const [user, setUser] = useState<AppUser | null>(null);
  const [lang, setLang] = useState<AppLanguage>("en");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchRecipes = async (currentUser: AppUser | null) => {
    // When nobody is logged in, the private cookbook should not show personal recipes.
    if (!currentUser) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    // Recipes are always loaded from Supabase so homepage, recipe index, and edit pages
    // all read the exact same source of truth.
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("id", { ascending: false });

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

  const filteredRecipes = recipes.filter((recipe) => {
    const searchValue = search.trim().toLowerCase();
    if (!searchValue) return true;

    return [recipe.title_en, recipe.title_de ?? "", recipe.category ?? "", recipe.tags.join(" ")]
      .join(" ")
      .toLowerCase()
      .includes(searchValue);
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
            A private family cookbook with bilingual recipes, personal notes, and the people I learned them from.
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

      {/* These links separate the landing page from the full recipe index and profile content. */}
      <div className="card" style={{ marginTop: 20 }}>
        <h2 style={{ marginBottom: 8 }}>Browse the Cookbook</h2>
        <p style={{ marginBottom: 12 }}>
          Home shows the newest recipes. The recipe index shows the full structured collection.
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

      {/* Language toggle changes how bilingual recipe fields are displayed on the homepage cards. */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, marginTop: 16 }}>
        <button className="button" type="button" onClick={() => setLang("en")} style={{ background: lang === "en" ? "#f0d6c5" : undefined }}>
          EN
        </button>
        <button className="button" type="button" onClick={() => setLang("de")} style={{ background: lang === "de" ? "#f0d6c5" : undefined }}>
          DE
        </button>
      </div>

      <input
        className="input"
        placeholder="Search all recipes, categories, or tags..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {loading ? <p style={{ marginTop: 12 }}>Loading recipes...</p> : null}
      {!loading && filteredRecipes.length === 0 ? <p style={{ marginTop: 12 }}>No recipes found yet.</p> : null}

      {/* Home intentionally shows only a short "latest recipes" slice, not the entire cookbook. */}
      <div style={{ marginTop: 18 }}>
        <h2 style={{ marginBottom: 10 }}>Newest Recipes</h2>

        {latestRecipes.map((recipe) => (
          <div key={recipe.id} className="card">
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
