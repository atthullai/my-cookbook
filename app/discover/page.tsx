"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, ChevronDown, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { mapRecipeRows } from "@/lib/recipe-db";
import { toRecipeSummaries } from "@/lib/recipe-adapter";
import { getCuisineTheme } from "@/lib/cuisine-themes";
import { useRecipeSearch } from "@/hooks/useRecipeSearch";
import RecipeCard from "@/components/RecipeCard";
import { RecipeSearchBar } from "@/components/RecipeSearchBar";
import ConfirmDialog from "@/components/ConfirmDialog";
import { isCreator } from "@/lib/creator";
import type { RecipeSummary } from "@/types";

type Sort = "relevance" | "az" | "newest" | "oldest";

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack", "Dessert"];
const DIETS = ["Vegetarian", "Vegan", "High Protein"];
const COOK_TIMES: { label: string; max: number }[] = [
  { label: "Under 15 min", max: 15 },
  { label: "Under 30 min", max: 30 },
  { label: "Under 60 min", max: 60 },
];
const NUTRITION = ["Healthy", "High Protein", "Low Sugars", "Low Sodium"];

export default function DiscoverPage() {
  const router = useRouter();
  const [recipes, setRecipes]             = useState<RecipeSummary[]>([]);
  const [loading, setLoading]             = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RecipeSummary | null>(null);

  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort]     = useState(false);
  const [sort, setSort]             = useState<Sort>("newest");
  const [fMeal, setFMeal]           = useState<string[]>([]);
  const [fDiet, setFDiet]           = useState<string[]>([]);
  const [fCookMax, setFCookMax]     = useState<number | null>(null);
  const [fCuisine, setFCuisine]     = useState<string[]>([]);
  const [fNutri, setFNutri]         = useState<string[]>([]);

  const { setTitleQuery, ingredientFilter, setIngredientFilter, filteredRecipes, isFiltering } = useRecipeSearch(recipes);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
      const { data } = await supabase.from("recipes").select("*").eq("is_public", true).order("created_at", { ascending: false });
      if (data) setRecipes(toRecipeSummaries(mapRecipeRows(data)));
      setLoading(false);
    })();
  }, []);

  // Distinct cuisines present, for the filter sheet.
  const cuisineOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: { value: string; label: string }[] = [];
    for (const r of recipes) {
      if (r.cuisine && !seen.has(r.cuisine)) { seen.add(r.cuisine); out.push({ value: r.cuisine, label: getCuisineTheme(r.cuisine).label }); }
    }
    return out;
  }, [recipes]);

  const toggle = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const activeFilters = fMeal.length + fDiet.length + fCuisine.length + fNutri.length + (fCookMax ? 1 : 0);

  const displayed = useMemo(() => {
    let r = (isFiltering ? filteredRecipes : recipes).slice();
    const lc = (s: string) => s.toLowerCase();
    if (fMeal.length) {
      const want = fMeal.map(lc);
      r = r.filter((x) => want.includes(lc(x.category ?? "")) || x.tags.some((t) => want.includes(lc(t))));
    }
    if (fDiet.length) {
      const want = fDiet.map(lc);
      r = r.filter((x) => x.tags.some((t) => want.some((d) => lc(t).includes(d.split(" ")[0]))));
    }
    if (fCookMax) r = r.filter((x) => { const m = x.prepTimeMinutes + x.cookTimeMinutes; return m > 0 && m <= fCookMax; });
    if (fCuisine.length) r = r.filter((x) => x.cuisine != null && fCuisine.includes(x.cuisine));
    if (fNutri.length) {
      r = r.filter((x) => fNutri.every((n) => {
        const tagHit = x.tags.some((t) => lc(t).includes(lc(n)));
        if (n === "Healthy") return tagHit || (x.nutrition ? x.nutrition.protein >= 15 && x.nutrition.sugar <= 10 : false);
        if (n === "High Protein") return tagHit || (x.nutrition ? x.nutrition.protein >= 20 : false);
        if (n === "Low Sugars") return x.nutrition ? x.nutrition.sugar <= 5 : tagHit;
        if (n === "Low Sodium") return x.nutrition ? x.nutrition.sodium <= 140 : tagHit;
        return tagHit;
      }));
    }
    if (sort === "az") r.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "oldest") r.reverse(); // base list is newest-first
    return r;
  }, [recipes, filteredRecipes, isFiltering, fMeal, fDiet, fCookMax, fCuisine, fNutri, sort]);

  async function handleDelete(recipe: RecipeSummary) {
    await supabase.from("recipes").delete().eq("id", parseInt(recipe.id));
    setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
    setPendingDelete(null);
  }

  const creatorLoggedIn = isCreator(currentUserId);
  const sortLabel: Record<Sort, string> = { relevance: "Relevance", az: "A to Z", newest: "Newest", oldest: "Oldest" };

  const chip = (active: boolean) => ({
    padding: "7px 14px", borderRadius: 999, cursor: "pointer", fontSize: "0.85rem", fontWeight: 500,
    border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
    background: active ? "var(--accent)" : "var(--surface)", color: active ? "#fff" : "var(--foreground)",
  } as React.CSSProperties);

  return (
    <main className="container" style={{ maxWidth: 1120 }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "1.7rem", fontWeight: 700 }}>Discover</h1>
        <p style={{ color: "var(--muted)", marginTop: 4, fontSize: "0.9rem" }}>All recipes from the kitchen</p>
      </div>

      {/* Search + filter + sort */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <RecipeSearchBar onTitleSearch={setTitleQuery} onIngredientFilter={setIngredientFilter}
            activeIngredient={ingredientFilter} placeholder="Search recipes or ingredients" />
        </div>
        <button type="button" onClick={() => setShowSort(true)}
          className="discover-control">
          {sortLabel[sort]} <ChevronDown size={15} />
        </button>
        <button type="button" onClick={() => setShowFilter(true)} className="discover-control">
          <SlidersHorizontal size={15} /> Filter{activeFilters > 0 ? ` · ${activeFilters}` : ""}
        </button>
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      ) : displayed.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No recipes found.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayed.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe}
              onEdit={creatorLoggedIn ? () => router.push(`/edit/${recipe.id}`) : undefined}
              onDelete={creatorLoggedIn ? () => setPendingDelete(recipe) : undefined} />
          ))}
        </div>
      )}

      {/* Sort modal */}
      {showSort && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowSort(false)}>
          <div className="card" style={{ maxWidth: 420, width: "100%" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>Sort recipes by</h3>
              <button type="button" aria-label="Close" onClick={() => setShowSort(false)} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--muted)" }}><X size={18} /></button>
            </div>
            {(Object.keys(sortLabel) as Sort[]).map((s) => (
              <button key={s} type="button" onClick={() => { setSort(s); setShowSort(false); }}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%",
                  padding: "12px 4px", border: "none", borderBottom: "1px solid var(--border)", background: "none",
                  cursor: "pointer", color: "var(--foreground)", fontSize: "0.95rem" }}>
                {sortLabel[s]}
                <span style={{ width: 16, height: 16, borderRadius: 999, border: `2px solid ${sort === s ? "var(--accent)" : "var(--border)"}`, background: sort === s ? "var(--accent)" : "transparent" }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter sheet */}
      {showFilter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowFilter(false)}>
          <div className="card" style={{ maxWidth: 520, width: "100%", maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0 }}>Filter</h3>
              <button type="button" aria-label="Close" onClick={() => setShowFilter(false)} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--muted)" }}><X size={18} /></button>
            </div>

            <FilterGroup title="Meal type">
              {MEAL_TYPES.map((m) => <button key={m} type="button" style={chip(fMeal.includes(m))} onClick={() => toggle(fMeal, m, setFMeal)}>{m}</button>)}
            </FilterGroup>
            <FilterGroup title="Diet">
              {DIETS.map((d) => <button key={d} type="button" style={chip(fDiet.includes(d))} onClick={() => toggle(fDiet, d, setFDiet)}>{d}</button>)}
            </FilterGroup>
            <FilterGroup title="Cook time">
              {COOK_TIMES.map((c) => <button key={c.label} type="button" style={chip(fCookMax === c.max)} onClick={() => setFCookMax(fCookMax === c.max ? null : c.max)}>{c.label}</button>)}
            </FilterGroup>
            {cuisineOptions.length > 0 && (
              <FilterGroup title="Cuisine">
                {cuisineOptions.map((c) => <button key={c.value} type="button" style={chip(fCuisine.includes(c.value))} onClick={() => toggle(fCuisine, c.value, setFCuisine)}>{c.label}</button>)}
              </FilterGroup>
            )}
            <FilterGroup title="Nutrition">
              {NUTRITION.map((n) => <button key={n} type="button" style={chip(fNutri.includes(n))} onClick={() => toggle(fNutri, n, setFNutri)}>{n}</button>)}
            </FilterGroup>

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button type="button" onClick={() => { setFMeal([]); setFDiet([]); setFCookMax(null); setFCuisine([]); setFNutri([]); }}
                className="button" style={{ flex: 1 }}>Clear all</button>
              <button type="button" onClick={() => setShowFilter(false)} className="button button-primary" style={{ flex: 2 }}>Apply</button>
            </div>
          </div>
        </div>
      )}

      {pendingDelete && (
        <ConfirmDialog open title="Delete recipe?"
          message={`"${pendingDelete.title}" will be permanently removed from Discover.`}
          confirmLabel="Delete" onConfirm={() => handleDelete(pendingDelete)} onCancel={() => setPendingDelete(null)} />
      )}
    </main>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontWeight: 700, marginBottom: 8 }}>{title}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{children}</div>
    </div>
  );
}
