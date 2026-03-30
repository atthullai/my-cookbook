"use client";

import { useState } from "react";

export default function RecipeClient({ recipe }: any) {
  const [multiplier, setMultiplier] = useState(1);
  {/* Adding checklist function STATE*/ }
  const [checked, setChecked] = useState<number[]>([]);
  {/* Adding checklist function TOGGLE FUNCTION*/ }
  const toggleCheck = (index: number) => {
    setChecked((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  return (
    <>
      {/* TITLE */}
      <h1>{recipe.title_en}</h1>

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

      {/* INGREDIENTS - new version */}
      <div style={{ marginBottom: 20 }}>
        <h3>Ingredients</h3>

        {recipe.ingredients_en
          ?.split(",")
          .map((item: string, i: number) => {
            const isChecked = checked.includes(i);

            return (
              <div
                key={i}
                onClick={() => toggleCheck(i)}
                className="ingredient-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  opacity: isChecked ? 0.5 : 1,
                }}
              >
                {/* checkbox */}
                <span>
                  {isChecked ? "☑" : "☐"}
                </span>

                {/* ingredient text */}
                <span
                  style={{
                    textDecoration: isChecked ? "line-through" : "none",
                  }}
                >
                  {multiplier !== 1 && `${multiplier}× `}
                  {item.trim()}
                </span>
              </div>
            );
          })}
      </div>

      {/* STEPS */}
      <div>
        <h3>Steps</h3>
        <p>{recipe.steps_en}</p>
      </div>
    </>
  );
}