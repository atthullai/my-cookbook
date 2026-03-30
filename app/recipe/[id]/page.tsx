"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import RecipeClient from "./RecipeClient";

export default function RecipePage() {
  const params = useParams();
  const id = params.id;

  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipe = async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .single();

      if (!error) setRecipe(data);
      setLoading(false);
    };

    if (id) fetchRecipe();
  }, [id]);

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;
  if (!recipe) return <p style={{ padding: 20 }}>Recipe not found 😢</p>;

  return (
    <main className="container">
      <Link href="/">← Back</Link>

      {/* 👇 pass recipe ONLY */}
      <RecipeClient recipe={recipe} />
    </main>
  );
}