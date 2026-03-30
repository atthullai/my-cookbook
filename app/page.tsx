"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [lang, setLang] = useState<"en" | "de">("en");

  // 🔍 Search state
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      // ✅ get logged in user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      // 🌍 auto language detect
      const browserLang = navigator.language.toLowerCase();
      setLang(browserLang.includes("de") ? "de" : "en");

      // 🔒 fetch ONLY user's recipes
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

  // 🔐 logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <main className="container">
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h1>My Cookbook</h1>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          
          {/* 👤 user email */}
          {user && (
            <span style={{ fontSize: 12, opacity: 0.7 }}>
              {user.email}
            </span>
          )}

          {/* 🔐 login/logout (styled) */}
          {user ? (
            <button className="button" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <Link href="/login">
              <button className="button">Login</button>
            </Link>
          )}

          {/* ➕ Add Recipe (use reusable button style) */}
          <Link href="/add">
            <button className="button button-primary">
              + Add Recipe
            </button>
          </Link>
        </div>
      </div>

      {/* 🔍 SEARCH BAR (use reusable input style) */}
      <input
        className="input"
        placeholder="Search recipes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* EMPTY STATE */}
      {recipes.length === 0 && (
        <p style={{ marginTop: 10 }}>No recipes yet.</p>
      )}

      {/* LIST */}
      <div style={{ marginTop: 10 }}>
        {recipes
          // 🔍 filter recipes by search
          .filter((r) =>
            r.title_en.toLowerCase().includes(search.toLowerCase())
          )
          .map((recipe) => (
            // 🧱 use reusable card class instead of inline styles
            <div key={recipe.id} className="card">
              
              {/* LEFT (clickable area) */}
              <Link href={`/recipe/${recipe.id}`} style={{ flex: 1 }}>
                <div>

                  {/* 🌍 language fallback */}
                  <h2>
                    {lang === "de"
                      ? recipe.title_de || recipe.title_en
                      : recipe.title_en}
                  </h2>

                  <p style={{ opacity: 0.6 }}>{recipe.category}</p>

                  {/* 🏷 tags */}
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
              </Link>

              {/* RIGHT (ONLY OWNER) */}
              {user?.id === recipe.user_id && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  
                  {/* ✏️ Edit */}
                  <Link href={`/edit/${recipe.id}`}>
                    <button className="button">Edit</button>
                  </Link>

                  {/* 🗑 Delete */}
                  <button
                    className="button button-danger"
                    onClick={async () => {
                      const confirmDelete = confirm("Delete?");
                      if (!confirmDelete) return;

                      const { error } = await supabase
                        .from("recipes")
                        .delete()
                        .eq("id", recipe.id);

                      if (!error) {
                        setRecipes((prev) =>
                          prev.filter((r) => r.id !== recipe.id)
                        );
                      }
                    }}
                  >
                    Delete
                  </button>

                </div>
              )}

            </div>
          ))}
      </div>
    </main>
  );
}