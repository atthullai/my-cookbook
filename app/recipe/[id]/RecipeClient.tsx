"use client";

import { useState } from "react";

export default function RecipeClient({ recipe }: any) {
  const [lang, setLang] = useState<"en" | "de">("en");

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {lang === "en" ? recipe.title_en : recipe.title_de}
        </h1>

        {/* ✅ Language buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setLang("en")}
            className={`px-3 py-1 rounded ${
              lang === "en"
                ? "bg-black text-white"
                : "bg-gray-300 text-black"
            }`}
          >
            EN
          </button>

          <button
            onClick={() => setLang("de")}
            className={`px-3 py-1 rounded ${
              lang === "de"
                ? "bg-black text-white"
                : "bg-gray-300 text-black"
            }`}
          >
            DE
          </button>
        </div>
      </div>

      {/* Ingredients */}
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

      {/* Steps */}
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