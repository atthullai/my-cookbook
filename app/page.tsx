"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Home() {
  // 📦 state
  const [recipes, setRecipes] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [lang, setLang] = useState<"en" | "de">("en");
  const [search, setSearch] = useState("");

  // 📦 FETCH USER + RECIPES
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // 🌍 detect browser language once
      const browserLang = navigator.language.toLowerCase();
      setLang(browserLang.includes("de") ? "de" : "en");

      // 🔒 fetch only logged-in user's recipes
      if (user) {
        const { data, error } = await supabase
          .from("recipes")
          .select("*")
          .eq("user_id", user.id)
          .order("id", { ascending: false });

        if (!error) setRecipes(data || []);
      }
    };

    fetchData();
  }, []);

  // 🔐 LOGOUT
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <main className="container">

      {/* ================= HEADER ================= */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>My Cookbook</h1>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>

          {/* 👤 USER */}
          {user && <span style={{ fontSize: 12 }}>{user.email}</span>}

          {/* 🔐 AUTH */}
          {user ? (
            <button className="button" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <Link href="/login">
              <button className="button">Login</button>
            </Link>
          )}

          {/* ➕ ADD */}
          <Link href="/add">
            <button className="button button-primary">
              + Add Recipe
            </button>
          </Link>
        </div>
      </div>

      {/* 🌍 LANGUAGE */}
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => setLang("en")}>EN</button>
        <button onClick={() => setLang("de")}>DE</button>
      </div>

      {/* 🔍 SEARCH (safe against null) */}
      <input
        className="input"
        placeholder="Search recipes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* 📭 EMPTY */}
      {recipes.length === 0 && <p>No recipes yet.</p>}

      {/* 📋 LIST */}
      {recipes
        .filter((r) =>
          (r.title_en || "")
            .toLowerCase()
            .includes(search.toLowerCase())
        )
        .map((recipe) => (
          <div key={recipe.id} className="card">

            {/* TITLE + ACTIONS */}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Link href={`/recipe/${recipe.id}`}>
                <h2>
                  {lang === "de"
                    ? recipe.title_de || recipe.title_en
                    : recipe.title_en}
                </h2>
              </Link>

              {user?.id === recipe.user_id && (
                <div style={{ display: "flex", gap: 8 }}>
                  <Link href={`/edit/${recipe.id}`}>
                    <button className="button">Edit</button>
                  </Link>

                  <button
                    className="button"
                    onClick={async () => {
                      if (!confirm("Delete?")) return;

                      await supabase
                        .from("recipes")
                        .delete()
                        .eq("id", recipe.id);

                      setRecipes((prev) =>
                        prev.filter((r) => r.id !== recipe.id)
                      );
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* CATEGORY */}
            <p>{recipe.category}</p>

            {/* TAGS */}
            {recipe.tags?.map((tag: string, i: number) => (
              <span key={i}>{tag}</span>
            ))}
          </div>
        ))}
    </main>
  );
}