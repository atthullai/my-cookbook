"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipes = async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setRecipes(data || []);
      }

      setLoading(false);
    };

    fetchRecipes();
  }, []);

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">My Cookbook</h1>

        <Link
          href="/add"
          className="px-3 py-1 bg-black text-white rounded"
        >
          + Add Recipe
        </Link>
      </div>

      {recipes.length === 0 ? (
        <p>No recipes yet.</p>
      ) : (
        <ul className="space-y-4">
          {recipes.map((recipe) => (
            <li key={recipe.id} className="border p-4 rounded">
              <Link href={`/recipe/${recipe.id}`}>
                <h2 className="text-xl font-semibold">
                  {recipe.title_en}
                </h2>
              </Link>

              <p className="text-sm text-gray-500">
                {recipe.category}
              </p>

              {/* ✅ TAGS */}
              <div className="mt-2 flex gap-2 flex-wrap">
                {recipe.tags?.map((tag: string, i: number) => (
                  <span
                    key={i}
                    className="text-xs bg-gray-200 text-black px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/edit/${recipe.id}`}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                >
                  Edit
                </Link>

                <button
                  onClick={async () => {
                    const confirmDelete = confirm("Delete this recipe?");
                    if (!confirmDelete) return;

                    const { error } = await supabase
                      .from("recipes")
                      .delete()
                      .eq("id", recipe.id);

                    if (error) {
                      alert(error.message);
                    } else {
                      alert("Deleted!");
                      window.location.reload();
                    }
                  }}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}