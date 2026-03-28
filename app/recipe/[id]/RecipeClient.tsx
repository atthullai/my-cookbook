"use client";

import { useState } from "react";

export default function RecipeClient({ recipe }: any) {
  const [lang, setLang] = useState<"en" | "de">("en");

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {lang === "en" ? recipe.title_en : recipe.title_de}
        </h1>

        <button
          onClick={() => setLang(lang === "en" ? "de" : "en")}
          className="px-3 py-1 border rounded-lg"
        >
          {lang === "en" ? "DE" : "EN"}
        </button>
      </div>

      <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl mb-6">
        <h2 className="text-xl font-semibold mb-2">
          {lang === "en" ? "Ingredients" : "Zutaten"}
        </h2>
        <p>
          {lang === "en"
            ? recipe.ingredients_en
            : recipe.ingredients_de}
        </p>
      </div>

      <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl">
        <h2 className="text-xl font-semibold mb-2">
          {lang === "en" ? "Steps" : "Zubereitung"}
        </h2>
        <p>
          {lang === "en" ? recipe.steps_en : recipe.steps_de}
        </p>
      </div>
    </>
  );
}