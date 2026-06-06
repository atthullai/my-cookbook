"use client";

// Discover → Categories: visual shortcuts that deep-link into the filtered
// recipe list (/recipes?category= / ?tag= / ?cuisine=).

import Link from "next/link";
import { ALL_CUISINE_ORIGINS, getCuisineTheme } from "@/lib/cuisine-themes";

const MEAL_TYPES: { label: string; emoji: string }[] = [
  { label: "Breakfast", emoji: "🌅" },
  { label: "Brunch", emoji: "🥐" },
  { label: "Lunch", emoji: "☀️" },
  { label: "Dinner", emoji: "🌙" },
  { label: "Main Course", emoji: "🍛" },
  { label: "Side Dish", emoji: "🥗" },
  { label: "Snacks", emoji: "🍿" },
  { label: "Appetizers", emoji: "🫓" },
  { label: "Soups", emoji: "🍲" },
  { label: "Salads", emoji: "🥬" },
  { label: "Desserts", emoji: "🍰" },
  { label: "Bread", emoji: "🍞" },
  { label: "Beverages", emoji: "🧃" },
  { label: "Smoothie", emoji: "🥤" },
  { label: "Condiments & Sauces", emoji: "🫙" },
];

const DIETS: { label: string; tag: string; emoji: string }[] = [
  { label: "Vegetarian", tag: "veg", emoji: "🥗" },
  { label: "Vegan", tag: "vegan", emoji: "🌱" },
  { label: "High Protein", tag: "high-protein", emoji: "💪" },
  { label: "Quick (under 30 min)", tag: "quick", emoji: "⚡" },
  { label: "Healthy", tag: "healthy", emoji: "🩺" },
  { label: "Comfort Food", tag: "comfort-food", emoji: "🍜" },
];

function Tile({ href, emoji, label }: { href: string; emoji: string; label: string }) {
  return (
    <Link href={href}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl p-4 border text-center transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ background: "var(--surface)", borderColor: "var(--border)", minHeight: 96 }}>
      <span className="text-3xl">{emoji}</span>
      <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{label}</span>
    </Link>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "2.25rem" }}>
      <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--accent)", opacity: 0.85 }}>{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {children}
      </div>
    </section>
  );
}

export default function CategoriesPage() {
  return (
    <main className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700 }}>Categories</h1>
        <p style={{ color: "var(--muted)", marginTop: 4, fontSize: "0.9rem" }}>Browse by meal, diet, or cuisine.</p>
      </div>

      <Section title="Meal type">
        {MEAL_TYPES.map((m) => (
          <Tile key={m.label} href={`/recipes?category=${encodeURIComponent(m.label)}`} emoji={m.emoji} label={m.label} />
        ))}
      </Section>

      <Section title="Diet & occasion">
        {DIETS.map((d) => (
          <Tile key={d.tag} href={`/recipes?tag=${encodeURIComponent(d.tag)}`} emoji={d.emoji} label={d.label} />
        ))}
      </Section>

      <Section title="Cuisine">
        {ALL_CUISINE_ORIGINS.map((key) => {
          const theme = getCuisineTheme(key);
          return <Tile key={key} href={`/recipes?cuisine=${encodeURIComponent(key)}`} emoji={theme.emoji} label={theme.label} />;
        })}
      </Section>
    </main>
  );
}
