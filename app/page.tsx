"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [lang, setLang] = useState<"en" | "de">("en");
  const [search, setSearch] = useState("");

  // 📦 FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      // 🌍 detect language
      const browserLang = navigator.language.toLowerCase();
      setLang(browserLang.includes("de") ? "de" : "en");

      // 🔒 fetch only user's recipes
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <h1>My Cookbook</h1>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          
          {/* 👤 USER EMAIL */}
          {user && (
            <span style={{ fontSize: 12, opacity: 0.7 }}>
              {user.email}
            </span>
          )}

          {/* 🔐 LOGIN / LOGOUT */}
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

      {/* ================= SEARCH ================= */}
      <input
        className="input"
        placeholder="Search recipes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* ================= EMPTY ================= */}
      {recipes.length === 0 && (
        <p style={{ marginTop: 10 }}>No recipes yet.</p>
      )}

      {/* ================= LIST ================= */}
      <div style={{ marginTop: 10 }}>
        {recipes
          .filter((r) =>
            r.title_en.toLowerCase().includes(search.toLowerCase())
          )
          .map((recipe) => (
            <div key={recipe.id} className="card">

              {/* 🔥 TOP ROW = TITLE + ACTIONS (FIXED DESIGN) */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                {/* TITLE */}
                <Link href={`/recipe/${recipe.id}`}>
                  <h2 style={{ margin: 0 }}>
                    {lang === "de"
                      ? recipe.title_de || recipe.title_en
                      : recipe.title_en}
                  </h2>
                </Link>

                {/* ACTION BUTTONS (INLINE — FIXES YOUR ISSUE) */}
                {user?.id === recipe.user_id && (
                  <div style={{ display: "flex", gap: 8 }}>
                    
                    <Link href={`/edit/${recipe.id}`}>
                      <button className="button">Edit</button>
                    </Link>

                    <button
                      className="button"
                      style={{ color: "#ff6b6b" }}
                      onClick={async () => {
                        const confirmDelete = confirm("Delete?");
                        if (!confirmDelete) return;

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
              <p style={{ opacity: 0.6, marginTop: 6 }}>
                {recipe.category}
              </p>

              {/* TAGS */}
              <div style={{ marginTop: 6 }}>
                {recipe.tags?.map((tag: string, i: number) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 12,
                      marginRight: 6,
                      border: "1px solid #666",
                      padding: "2px 6px",
                      borderRadius: 6,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

            </div>
          ))}
      </div>
    </main>
  );
}