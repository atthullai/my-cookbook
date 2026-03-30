"use client";

import { useState } from "react";

export default function RecipeClient({ recipe }: any) {
  const [multiplier, setMultiplier] = useState(1);

  // ✅ checklist state
  const [checked, setChecked] = useState<number[]>([]);

  const toggleCheck = (index: number) => {
    setChecked((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  // ✅ language toggle
  const [lang, setLang] = useState<"en" | "de">("en");

  return (
    <>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        
        {/* TITLE (with language) */}
        <h1>
          {lang === "de"
            ? recipe.title_de || recipe.title_en
            : recipe.title_en}
        </h1>

        {/* LANGUAGE BUTTONS */}
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setLang("en")}>EN</button>
          <button onClick={() => setLang("de")}>DE</button>
        </div>
      </div>

      {/* 🔥 SERVINGS */}
      <div style={{ marginBottom: 20 }}>
        <p>Servings:</p>

        <div style={{ display: "flex", gap: 8 }}>
          {[0.5, 1, 2].map((m) => (
            <button
              key={m}
              className="button"
              onClick={() => setMultiplier(m)}
              style={{
                background: multiplier === m ? "#333" : "transparent",
                color: multiplier === m ? "white" : "inherit",
              }}
            >
              {m}x
            </button>
          ))}
        </div>
      </div>

      {/* INGREDIENTS */}
      <div style={{ marginBottom: 20 }}>
        <h3>Ingredients</h3>

        {recipe.ingredients && recipe.ingredients.length > 0 ? (
          recipe.ingredients.map((ing: any, i: number) => {
            const isChecked = checked.includes(i);

            return (
              <div
                key={i}
                onClick={() => toggleCheck(i)}
                className="ingredient-item"
                style={{
                  display: "flex",
                  gap: 8,
                  opacity: isChecked ? 0.5 : 1,
                }}
              >
                <span>{isChecked ? "☑" : "☐"}</span>

                <span style={{ textDecoration: isChecked ? "line-through" : "none" }}>
                  {Number(ing.amount) * multiplier || ing.amount}{" "}
                  {ing.unit} {ing.name}
                </span>
              </div>
            );
          })
        ) : (
          // fallback for old recipes
          recipe.ingredients_en?.split(",").map((item: string, i: number) => (
            <div key={i}>
              {multiplier !== 1 && `${multiplier}× `}
              {item.trim()}
            </div>
          ))
        )}
      </div>

      {/* STEPS */}
      <div>
        <h3>Steps</h3>
        <p>
          {lang === "de"
            ? recipe.steps_de || recipe.steps_en
            : recipe.steps_en}
        </p>
      </div>
    </>
  );
}