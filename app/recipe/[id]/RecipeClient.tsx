"use client";

import { useState } from "react";

export default function RecipeClient({ recipe }: any) {
  const [multiplier, setMultiplier] = useState(1);
  const [checked, setChecked] = useState<string[]>([]);
  const [lang, setLang] = useState<"en" | "de">("en");

  // ✅ SAFE PARSE
  const parseAmount = (value: any) => {
    if (value === null || value === undefined) return null;

    if (!isNaN(Number(value))) return Number(value);

    if (typeof value === "string" && value.includes("/")) {
      const [num, den] = value.split("/");
      return Number(num) / Number(den);
    }

    return null;
  };

  const formatAmount = (num: number) => {
    if (num === 0.5) return "1/2";
    if (num === 0.25) return "1/4";
    if (num === 0.75) return "3/4";

    return Number(num.toFixed(2));
  };

  const toggleCheck = (index: string) => {
    setChecked((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  return (
    <>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>
          {lang === "de"
            ? recipe.title_de || recipe.title_en
            : recipe.title_en}
        </h1>

        <div>
          <button onClick={() => setLang("en")}>EN</button>
          <button onClick={() => setLang("de")}>DE</button>
        </div>
      </div>

      {/* SERVINGS */}
      <div>
        {[0.5, 1, 2].map((m) => (
          <button key={m} onClick={() => setMultiplier(m)}>
            {m}x
          </button>
        ))}
      </div>

      {/* INGREDIENTS */}
      <div>
        <h3>Ingredients</h3>

        {recipe.ingredients?.map((group: any, gi: number) => (
          <div key={gi}>
            <h4>{group.group}</h4>

            {group.items.map((ing: any, i: number) => {
              const index = `${gi}-${i}`;
              const isChecked = checked.includes(index);

              const base = parseAmount(ing.amount);
              const scaled =
                base !== null ? base * multiplier : null;

              return (
                <div
                  key={index}
                  onClick={() => toggleCheck(index)}
                  style={{
                    opacity: isChecked ? 0.5 : 1,
                    cursor: "pointer",
                  }}
                >
                  {isChecked ? "☑" : "☐"}{" "}
                  {scaled !== null ? formatAmount(scaled) : ""}{" "}
                  {ing.unit} {ing.name}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* STEPS */}
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