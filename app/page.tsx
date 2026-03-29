"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [lang, setLang] = useState<"en" | "de">("en");

  useEffect(() => {
    const fetchRecipes = async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        console.error("Error fetching recipes:", error);
      } else {
        setRecipes(data || []);
      }
    };

    fetchRecipes();
  }, []);

  return (
    <main className="p-6 max-w-2xl mx-auto">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Cookbook</h1>

        <div className="flex items-center gap-3">

          {/* 🌍 LANGUAGE TOGGLE */}
          <div className="flex gap-2">
            <button
              onClick={() => setLang("en")}
              className={`px-2 py-1 rounded border ${
                lang === "en"
                  ? "bg-white text-black"
                  : "bg-black text-white"
              }`}
            >
              EN
            </button>

            <button
              onClick={() => setLang("de")}
              className={`px-2 py-1 rounded border ${
                lang === "de"
                  ? "bg-white text-black"
                  : "bg-black text-white"
              }`}
            >
              DE
            </button>
          </div>

          {/* ADD BUTTON */}
          <Link
            href="/add"
            className="px-3 py-1 bg-black text-white rounded"
          >
            + Add Recipe
          </Link>
        </div>
      </div>

      {/* EMPTY STATE */}
      {recipes.length === 0 && (
        <p className="text-gray-400">No recipes yet.</p>
      )}

      {/* RECIPES LIST */}
      <div className="space-y-4">
        {recipes.map((recipe) => (
          <Link key={recipe.id} href={`/recipe/${recipe.id}`}>
            <div className="border p-4 rounded cursor-pointer hover:bg-gray-900 transition">

              {/* 🧠 TITLE WITH FALLBACK */}
              <h2 className="text-xl font-semibold">
                {lang === "de"
                  ? recipe.title_de || recipe.title_en
                  : recipe.title_en}
              </h2>

              {/* CATEGORY */}
              <p className="text-gray-400">{recipe.category}</p>

              {/* TAGS */}
              <div className="mt-2 flex gap-2 flex-wrap">
                {recipe.tags?.map((tag: string, i: number) => (
                  <span
                    key={i}
                    className="text-sm bg-gray-200 text-black px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>

            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}