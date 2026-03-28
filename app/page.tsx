"use client";

import { supabase } from "@/lib/supabase";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [allRecipes, setAllRecipes] = useState<any[]>([]);

  useEffect(() => {
  const fetchRecipes = async () => {
    const { data, error } = await supabase
      .from("recipes")
      .select("*");

    if (error) {
      alert(error.message);
      console.error(error);
    } else {
      setAllRecipes(data);
    }
  };

  fetchRecipes();
}, []);

  const allTags = Array.from(
    new Set(allRecipes.flatMap((r) => r.tags))
  );

  const handleDelete = async (id: number) => {
  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Error deleting");
  } else {
    setAllRecipes((prev) => prev.filter((r) => r.id !== id));
  }
};

  const [lang, setLang] = useState<"en" | "de">("en");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedTag, setSelectedTag] = useState("");

  const filtered = allRecipes.filter((recipe) => {
    const matchesSearch = recipe.title_en
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || recipe.category === category;

    const matchesTag =
      selectedTag === "" || recipe.tags.includes(selectedTag);

    return matchesSearch && matchesCategory && matchesTag;
  });

  return (
    <main className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Cookbook 🍳</h1>
        <a href="/login" className="text-sm underline">
          Login
        </a>

        <button
          onClick={() => setLang(lang === "en" ? "de" : "en")}
          className="px-3 py-1 border rounded-lg"
        >
          {lang === "en" ? "DE" : "EN"}
        </button>
      </div>

      {/* Add Button */}
      <Link
        href="/add"
        className="inline-block mb-4 px-4 py-2 border rounded-lg"
      >
        + Add Recipe
      </Link>

      {/* Categories */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["All", "Breakfast", "Lunch", "Rice"].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1 border rounded-lg ${
              category === cat ? "bg-white text-black" : ""
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tags */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() =>
              setSelectedTag(selectedTag === tag ? "" : tag)
            }
            className={`px-3 py-1 border rounded-lg ${
              selectedTag === tag ? "bg-white text-black" : ""
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search recipes..."
        className="w-full p-2 border rounded mb-6"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Recipe List */}
      <div className="grid gap-4">
        {filtered.map((recipe) => (
          <div
            key={recipe.id}
            className="p-4 border rounded-xl shadow-sm flex justify-between items-center"
          >
              <Link href={`/recipe/${recipe.id}`} className="flex-1">
                <h2 className="text-xl font-semibold">
                  {lang === "en" ? recipe.title_en : recipe.title_de}
                </h2>
                <p className="text-gray-500">{recipe.category}</p>
              </Link>

              <div className="flex gap-2 ml-4">
            
              <Link
                href={`/edit/${recipe.id}`}
                className="text-blue-500"
              >
                Edit
              </Link>

              <button
                onClick={() => handleDelete(recipe.id)}
                className="text-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}