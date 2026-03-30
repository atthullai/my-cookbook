"use client";

import { useState } from "react";

export default function RecipeClient({ recipe }: any) {
  const [multiplier, setMultiplier] = useState(1);

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

      {/* INGREDIENTS */}
      <div style={{ marginBottom: 20 }}>
        <h3>Ingredients</h3>

        {recipe.ingredients_en
          ?.split(",")
          .map((item: string, i: number) => (
            <div key={i}>
              {multiplier !== 1 && `${multiplier}× `}
              {item.trim()}
            </div>
          ))}
      </div>

      {/* STEPS */}
      <div>
        <h3>Steps</h3>
        <p>{recipe.steps_en}</p>
      </div>
    </>
  );
}