"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import RecipeClient from "./RecipeClient";

export default function RecipePage() {
  const params = useParams();
  const id = Number(params.id);

  const [recipe, setRecipe] = useState<any>(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("recipes") || "[]");

    const found = stored.find((r: any) => r.id === id);

    if (found) setRecipe(found);
  }, [id]);

  if (!recipe) return <p className="p-6">Loading...</p>;

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <Link href="/" className="inline-block mb-4 underline">
        ← Back
      </Link>

      <RecipeClient recipe={recipe} />
    </main>
  );
}