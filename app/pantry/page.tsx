"use client";

import { useState } from "react";
import AppIcon from "@/components/AppIcon";
import { stableCompositeId } from "@/lib/stable-ids";

const INITIAL_PANTRY = [
  { name: "Toor dal", category: "Lentils", stock: "Medium", expires: "2026-07-10" },
  { name: "Rice", category: "Grains", stock: "High", expires: "2026-09-01" },
  { name: "Coriander leaves", category: "Fresh", stock: "Low", expires: "2026-05-28" },
  { name: "Ghee", category: "Fats", stock: "Medium", expires: "2026-08-15" },
];

export default function PantryPage() {
  const [items, setItems] = useState(INITIAL_PANTRY);
  const lowStock = items.filter((item) => item.stock === "Low");

  return (
    <main className="container">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Household Organization</p>
          <h1>Grocery & Pantry</h1>
          <p>Track inventory, merge grocery items, watch expirations, and surface pantry-aware cooking ideas.</p>
        </div>
      </section>

      <div className="pantry-layout">
        <section className="card">
          <div className="section-heading-row">
            <div>
              <h2>Pantry inventory</h2>
              <p>Grouped by category with stock and expiration awareness.</p>
            </div>
            <button
              className="button button-primary"
              type="button"
              onClick={() => setItems((current) => [...current, { name: "New item", category: "Other", stock: "Low", expires: "2026-06-01" }])}
            >
              <AppIcon name="add" size={16} />
              Add item
            </button>
          </div>
          <div className="pantry-table">
            {items.map((item) => (
              <div key={stableCompositeId("pantry", item.category, item.name, item.expires)} className="pantry-row">
                <strong>{item.name}</strong>
                <span>{item.category}</span>
                <span className={item.stock === "Low" ? "stock-low" : ""}>{item.stock}</span>
                <span>{item.expires}</span>
              </div>
            ))}
          </div>
        </section>

        <aside className="planner-side">
          <section className="card">
            <h2>Low-stock alerts</h2>
            <div className="compact-list">
              {lowStock.map((item) => (
                <span key={stableCompositeId("low", item.name)}>{item.name}</span>
              ))}
            </div>
          </section>
          <section className="card">
            <h2>Categorized grocery list</h2>
            <div className="compact-list">
              <span>Fresh: coriander leaves, tomato</span>
              <span>Lentils: toor dal</span>
              <span>Staples: rice, oil, salt</span>
            </div>
          </section>
          <section className="card">
            <h2>Pantry-aware suggestions</h2>
            <p style={{ marginBottom: 0 }}>Recipes can rank higher when their ingredients overlap with high-stock pantry items and avoid expiring ingredients going unused.</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
