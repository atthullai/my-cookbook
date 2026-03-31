"use client";

import { useState } from "react";

export default function RecipeClient({ recipe }: any) {
  // ================= STATE =================

  // 🔢 multiplier for servings
  const [multiplier, setMultiplier] = useState(1);

  // ✅ checked ingredients (for checkbox UI)
  const [checked, setChecked] = useState<string[]>([]);

  // 🌍 language toggle
  const [lang, setLang] = useState<"en" | "de">("en");

  // ================= HELPERS =================

  // ✅ SAFE PARSE (prevents crashes + supports fractions)
  const parseAmount = (value: any) => {
    if (value === null || value === undefined || value === "") return null;

    const num = Number(value);
    if (!isNaN(num)) return num;

    // support fractions like "1/2"
    if (typeof value === "string" && value.includes("/")) {
      const [n, d] = value.split("/");
      const num = Number(n);
      const den = Number(d);
      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        return num / den;
      }
    }

    return null;
  };

  // ✅ FORMAT (nice display)
  const formatAmount = (num: number) => {
    if (num === 0.5) return "1/2";
    if (num === 0.25) return "1/4";
    if (num === 0.75) return "3/4";

    return Number(num.toFixed(2));
  };

  // ✅ toggle checkbox
  const toggleCheck = (id: string) => {
    setChecked((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    );
  };

  // ================= UI =================

  return (
    <>
      {/* ================= HEADER ================= */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        {/* TITLE */}
        <h1>
          {lang === "de"
            ? recipe.title_de || recipe.title_en
            : recipe.title_en}
        </h1>

        {/* LANGUAGE */}
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setLang("en")}>EN</button>
          <button onClick={() => setLang("de")}>DE</button>
        </div>
      </div>

      {/* ================= SERVINGS ================= */}
      <div style={{ marginBottom: 20 }}>
        <p>Servings:</p>

        <div style={{ display: "flex", gap: 8 }}>
          {[0.5, 1, 2].map((m) => (
            <button key={m} onClick={() => setMultiplier(m)}>
              {m}x
            </button>
          ))}
        </div>
      </div>

      {/* ================= INGREDIENTS ================= */}
      <div style={{ marginBottom: 24 }}>
        <h3>Ingredients</h3>

        {recipe.ingredients?.map((group: any, gi: number) => (
          <div key={gi} style={{ marginBottom: 12 }}>
            {/* GROUP TITLE */}
            <h4>{group.group}</h4>

            {/* ITEMS */}
            {group.items.map((ing: any, i: number) => {
              const id = `${gi}-${i}`;

              const isChecked = checked.includes(id);

              // ✅ SAFE parse
              const base = parseAmount(ing.amount);

              // ✅ FIXED scaling logic (IMPORTANT)
              const scaled =
                base !== null ? base * multiplier : null;

              return (
                <div
                  key={id}
                  onClick={() => toggleCheck(id)}
                  style={{
                    cursor: "pointer",
                    opacity: isChecked ? 0.5 : 1,
                    display: "flex",
                    gap: 8,
                  }}
                >
                  {/* CHECKBOX */}
                  <span>{isChecked ? "☑" : "☐"}</span>

                  {/* TEXT */}
                  <span
                    style={{
                      textDecoration: isChecked
                        ? "line-through"
                        : "none",
                    }}
                  >
                    {/* ✅ SAFE DISPLAY */}
                    {scaled !== null
                      ? formatAmount(scaled)
                      : ""}
                    {ing.unit ? ` ${ing.unit}` : ""}{" "}
                    {ing.name}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* ================= STEPS ================= */}
      <div>
        <h3>Steps</h3>

        <ol>
          {(lang === "de"
            ? recipe.steps_de || recipe.steps_en
            : recipe.steps_en
          )
            ?.split("\n")
            .map((step: string, i: number) => (
              <li key={i}>
                {step.replace(/^\d+\.\s*/, "")}
              </li>
            ))}
        </ol>
      </div>
    </>
  );
}