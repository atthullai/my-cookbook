"use client";

import { useMemo, useState } from "react";
import AppIcon from "@/components/AppIcon";
import { stableCompositeId } from "@/lib/stable-ids";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SLOTS = ["Breakfast", "Lunch", "Dinner", "Snack"];

const STARTER_MEALS = ["Idli with chutney", "Curd rice", "Sambar sadam", "Fruit and nuts", "Lemon rice", "Vegetable dosa"];

export default function PlannerPage() {
  const [meals, setMeals] = useState<Record<string, string>>(() =>
    Object.fromEntries(DAYS.flatMap((day, dayIndex) => SLOTS.map((slot, slotIndex) => [`${day}-${slot}`, STARTER_MEALS[(dayIndex + slotIndex) % STARTER_MEALS.length]])))
  );
  const groceryItems = useMemo(() => ["Rice", "Toor dal", "Curd", "Coriander leaves", "Tomato", "Onion", "Coconut"], []);

  return (
    <main className="container">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Meal Planning</p>
          <h1>Weekly Cooking Plan</h1>
          <p>Plan breakfast, lunch, dinner, and snacks with reusable meals, leftovers, and grocery generation.</p>
        </div>
      </section>

      <div className="planner-layout">
        <section className="card planner-board">
          <div className="section-heading-row">
            <div>
              <h2>Meal calendar</h2>
              <p>Drag-and-drop persistence can plug into these stable day-slot cells.</p>
            </div>
            <button className="button button-soft" type="button">
              Repeat week
            </button>
          </div>
          <div className="meal-calendar">
            {DAYS.map((day) => (
              <div key={stableCompositeId("planner-day", day)} className="meal-calendar-day">
                <h3>{day}</h3>
                {SLOTS.map((slot) => {
                  const key = `${day}-${slot}`;
                  return (
                    <label key={stableCompositeId("planner-slot", key)} className="meal-slot">
                      <span>{slot}</span>
                      <input value={meals[key] ?? ""} onChange={(event) => setMeals((current) => ({ ...current, [key]: event.target.value }))} />
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        <aside className="planner-side">
          <section className="card">
            <h2>Reusable plans</h2>
            <div className="compact-list">
              <button className="button" type="button">Family weekday</button>
              <button className="button" type="button">Festival prep</button>
              <button className="button" type="button">Light dinners</button>
            </div>
          </section>
          <section className="card">
            <h2>Generated groceries</h2>
            <div className="compact-list">
              {groceryItems.map((item) => (
                <span key={stableCompositeId("planner-grocery", item)}>
                  <AppIcon name="recipe" size={14} />
                  {item}
                </span>
              ))}
            </div>
          </section>
          <section className="card">
            <h2>Leftover handling</h2>
            <p style={{ marginBottom: 0 }}>Mark a dinner as leftovers and the grocery rollup reduces duplicate ingredients for the next day.</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
