"use client";

import { useState } from "react";

export default function RecipeClient({ recipe }: any) {
  const [multiplier, setMultiplier] = useState(1);

  // ✅ convert fractions to numbers
  const parseAmount = (value: string | number) => {
    if (!value) return 0;

    // already number
    if (!isNaN(Number(value))) return Number(value);

    // fraction (e.g. 1/2)
    if (typeof value === "string" && value.includes("/")) {
      const [num, den] = value.split("/");
      return Number(num) / Number(den);
    }

    return 0;
  };

  // ✅ convert back to nice fraction (optional)
  const formatAmount = (num: number) => {
    if (num === 0.5) return "1/2";
    if (num === 0.25) return "1/4";
    if (num === 0.75) return "3/4";

    return Number(num.toFixed(2));
  };

  // ✅ updated checklist state and toggleCheck
  const [checked, setChecked] = useState<string[]>([]);

  const toggleCheck = (index: string) => {
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

      {/* updated INGREDIENTS */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 10 }}>Ingredients</h3>

        {recipe.ingredients?.map((group: any, gi: number) => (
          <div key={gi} style={{ marginBottom: 16 }}>

            {/* GROUP TITLE */}
            <h4 style={{ marginBottom: 6 }}>
              {group.group}
            </h4>

            {/* ITEMS */}
            {group.items.map((ing: any, i: number) => {
              const index = `${gi}-${i}`;
              const isChecked = checked.includes(index as any);

              const base = parseAmount(String(ing.amount));
              const scaled = base * multiplier;

              return (
                <div
                  key={index}
                  onClick={() => toggleCheck(index as any)}
                  style={{
                    display: "flex",
                    gap: 8,
                    opacity: isChecked ? 0.5 : 1,
                    cursor: "pointer",
                  }}
                >
                  <span>{isChecked ? "☑" : "☐"}</span>

                  <span
                    style={{
                      textDecoration: isChecked ? "line-through" : "none",
                    }}
                  >
                    {formatAmount(scaled)} {ing.unit} {ing.name}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
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

