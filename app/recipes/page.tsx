"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buildStarterRecipeRows } from "@/data/starter-recipes";
import { mapRecipeRows } from "@/lib/recipe-db";
import type { AppUser, RecipeRecord } from "@/lib/recipe-types";
import { supabase } from "@/lib/supabase";

export default function RecipeIndexPage() {
  const [recipes, setRecipes] = useState<RecipeRecord[]>([]);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadRecipes = async (currentUser: AppUser | null) => {
    if (!currentUser) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    // The index page is meant to be structured and browsable, so we sort first by category
    // and then alphabetically inside each category.
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("category", { ascending: true })
      .order("title_en", { ascending: true });

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
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) return;
      setUser(user);

      if (!user) {
        setLoading(false);
        return;
      }

      await loadRecipes(user);
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = Array.from(new Set(recipes.map((recipe) => recipe.category).filter(Boolean)));

  const handleSyncCollection = async () => {
    if (!user) {
      alert("Please log in first.");
      return;
    }

    const confirmed = window.confirm("Replace your current recipes with the built-in recipe collection?");
    if (!confirmed) return;

    setSyncing(true);

    const rows = buildStarterRecipeRows(user.id);
    await supabase.from("recipes").delete().eq("user_id", user.id);

    const { error } = await supabase.from("recipes").insert(rows);
    if (error) {
      setSyncing(false);
      alert(error.message);
      return;
    }

    await loadRecipes(user);
    setSyncing(false);
  };

  return (
    <main className="container">
      <h1>Recipe Index</h1>
      <p>A structured overview of your Supabase cookbook, grouped by category.</p>

      {user ? (
        <div className="card" style={{ marginTop: 20, marginBottom: 20 }}>
          <h2 style={{ marginBottom: 8 }}>Collection Tools</h2>
          <p style={{ marginBottom: 12 }}>
            Use this only when you want to replace your current cookbook with the built-in recipe collection.
          </p>
          <button
            className="button button-primary"
            type="button"
            onClick={() => void handleSyncCollection()}
            disabled={syncing}
          >
            {syncing ? "Syncing..." : "Sync Built-In Recipe Collection"}
          </button>
        </div>
      ) : null}

      {loading ? <p>Loading recipes...</p> : null}

      {categories.map((category) => (
        <section key={category} style={{ marginTop: 28 }}>
          <h2 style={{ marginBottom: 12 }}>{category}</h2>
          <div style={{ display: "grid", gap: 14 }}>
            {recipes
              .filter((recipe) => recipe.category === category)
              .map((recipe) => (
                <div key={recipe.id} className="card">
                  <Link href={`/recipe/${recipe.id}`}>
                    <h3 style={{ marginBottom: 8 }}>{recipe.title_en}</h3>
                  </Link>
                  <p style={{ marginBottom: 8 }}>{recipe.description_en}</p>
                  <p style={{ marginBottom: 0 }}>
                    By {recipe.author_name}
                    {recipe.learned_from ? ` • Learned from ${recipe.learned_from}` : ""}
                  </p>
                </div>
              ))}
          </div>
        </section>
      ))}
    </main>
  );
}
