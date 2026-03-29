"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import RecipeClient from "./RecipeClient";

export default function RecipePage() {
  const params = useParams();
  const id = params.id; // ✅ keep as string

  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipe = async () => {
      console.log("Fetching recipe with id:", id);

      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .single();

      console.log("DATA:", data);
      console.log("ERROR:", error);

      if (error) {
        console.error(error);
      } else {
        setRecipe(data);
      }

      setLoading(false);
    };

    if (id) fetchRecipe();
  }, [id]);

  if (loading) return <p className="p-6">Loading...</p>;

  if (!recipe) return <p className="p-6">Recipe not found 😢</p>;

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <Link href="/" className="inline-block mb-4 underline">
        ← Back
      </Link>

      <RecipeClient recipe={recipe} />
    </main>
  );
}