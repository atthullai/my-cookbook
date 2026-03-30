"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [lang, setLang] = useState<"en" | "de">("en");

  useEffect(() => {
    const fetchData = async () => {
      // ✅ get logged in user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      // 🌍 auto language detect
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.includes("de")) {
        setLang("de");
      } else {
        setLang("en");
      }

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
    <main style={{ maxWidth: 700, margin: "auto", padding: 20 }}>

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

          {/* 🔐 login/logout */}
          {user ? (
            <button onClick={handleLogout}>Logout</button>
          ) : (
            <Link href="/login">Login</Link>
          )}

          {/* ➕ Add Recipe Button(new)*/}
          <Link
            href="/add"
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              background: "#222",
              color: "white",
            }}
          >
            + Add Recipe
          </Link>
        </div>
      </div>

      {/* EMPTY */}
      {recipes.length === 0 && (
        <p>No recipes yet.</p>
      )}

      {/* LIST */}
      <div>
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            style={{
              border: "1px solid #444",
              padding: 12,
              borderRadius: 8,
              marginBottom: 10,
              display: "flex",
              justifyContent: "space-between",
            }}
          >

            {/* LEFT */}
            <Link href={`/recipe/${recipe.id}`} style={{ flex: 1 }}>
              <div>

                <h2>
                  {lang === "de"
                    ? recipe.title_de || recipe.title_en
                    : recipe.title_en}
                </h2>

                <p style={{ opacity: 0.6 }}>{recipe.category}</p>

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

                <Link href={`/edit/${recipe.id}`}>
                  <button>Edit</button>
                </Link>

                <button
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