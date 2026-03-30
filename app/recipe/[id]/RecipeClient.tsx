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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        {/* TITLE */}
        <h1 style={{ fontSize: 32, fontWeight: "bold" }}>
          {lang === "de"
            ? recipe.title_de || recipe.title_en
            : recipe.title_en}
        </h1>

        {/* LANGUAGE BUTTONS */}
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="button"
            onClick={() => setLang("en")}
            style={{ background: lang === "en" ? "#333" : "transparent" }}
          >
            EN
          </button>

          <button
            className="button"
            onClick={() => setLang("de")}
            style={{ background: lang === "de" ? "#333" : "transparent" }}
          >
            DE
          </button>
        </div>
      </div>

      {/* SERVINGS */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ marginBottom: 8 }}>Servings:</p>

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
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 10 }}>Ingredients</h3>

        {recipe.ingredients && recipe.ingredients.length > 0 ? (
          recipe.ingredients.map((ing: any, i: number) => {
            const isChecked = checked.includes(i);

            // ✅ safe scaling
            const scaledAmount =
              ing.amount && !isNaN(Number(ing.amount))
                ? Number(ing.amount) * multiplier
                : ing.amount;

            return (
              <div
                key={i}
                onClick={() => toggleCheck(i)}
                className="ingredient-item"
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "6px 0",
                  cursor: "pointer",
                  opacity: isChecked ? 0.5 : 1,
                }}
              >
                <span>{isChecked ? "☑" : "☐"}</span>

                <span
                  style={{
                    textDecoration: isChecked ? "line-through" : "none",
                  }}
                >
                  {scaledAmount} {ing.unit} {ing.name}
                </span>
              </div>
            );
          })
        ) : (
          <p style={{ opacity: 0.6 }}>
            No structured ingredients available
          </p>
        )}
      </div>

      {/* STEPS */}
      <div>
        <h3 style={{ marginBottom: 10 }}>Steps</h3>

        <p style={{ lineHeight: 1.6 }}>
          {lang === "de"
            ? recipe.steps_de || recipe.steps_en
            : recipe.steps_en}
        </p>
      </div>
    </>
  );
}

