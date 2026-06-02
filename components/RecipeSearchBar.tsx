"use client";

// components/RecipeSearchBar.tsx
// Drop-in replacement for the existing "Search recipes…" input.
// Searches recipe titles AND ingredient library simultaneously.
// On ingredient selection, adds a filter chip and filters the recipe grid.

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type IngredientResult = {
  id: string;
  name_en: string;
  name_de: string | null;
  default_unit: string | null;
  category: string | null;
};

type SearchResult =
  | { type: "title"; value: string }
  | { type: "ingredient"; value: IngredientResult };

// ─── Category icons ───────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  oils:          "🫙",
  spices_whole:  "🌶️",
  spices_powder: "🔴",
  herbs:         "🌿",
  aromatics:     "🧅",
  vegetables:    "🥦",
  fruits:        "🍋",
  proteins:      "🥩",
  dairy:         "🥛",
  cheese:        "🧀",
  dals:          "🫘",
  grains:        "🌾",
  nuts:          "🥜",
  sweet:         "🍬",
  flour:         "🍞",
  baking:        "🧁",
  flavouring:    "🌸",
  pantry:        "🫙",
  other:         "🧂",
};

function categoryIcon(cat: string | null): string {
  return cat ? (CATEGORY_ICONS[cat] ?? "🌿") : "🌿";
}

function categoryLabel(cat: string | null): string {
  if (!cat) return "";
  return cat.replace(/_/g, " ");
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  onTitleSearch: (q: string) => void;
  onIngredientFilter: (ingredient: IngredientResult | null) => void;
  activeIngredient: IngredientResult | null;
  placeholder?: string;
};

export function RecipeSearchBar({
  onTitleSearch,
  onIngredientFilter,
  activeIngredient,
  placeholder = "Search recipes or ingredients…",
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch results (called via debounced setTimeout in onChange) ────────────

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    try {
      const r = await fetch(`/api/ingredients/search?q=${encodeURIComponent(q)}&limit=5`);
      if (!r.ok) return;
      const ingredients: IngredientResult[] = await r.json();
      const built: SearchResult[] = [{ type: "title", value: q }];
      for (const ing of ingredients.slice(0, 5)) built.push({ type: "ingredient", value: ing });
      setResults(built);
      setOpen(true);
      setActiveIndex(-1);
    } catch {
      setResults([{ type: "title", value: q }]);
      setOpen(true);
    }
  }, []);

  // ── Outside click ──────────────────────────────────────────────────────────

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // ── Select a result ────────────────────────────────────────────────────────

  const select = useCallback((result: SearchResult) => {
    if (result.type === "title") {
      onTitleSearch(result.value);
    } else {
      onIngredientFilter(result.value);
      setQuery("");
      onTitleSearch("");
    }
    setOpen(false);
    setActiveIndex(-1);
  }, [onTitleSearch, onIngredientFilter]);

  // ── Keyboard navigation ────────────────────────────────────────────────────

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        select(results[activeIndex]);
      } else if (query.trim()) {
        onTitleSearch(query.trim());
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!v.trim()) {
      onTitleSearch("");
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => void fetchResults(v.trim()), 180);
  }

  function clearIngredient() {
    onIngredientFilter(null);
    inputRef.current?.focus();
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>

      {/* ── Input row ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "var(--surface)",
        border: `1px solid ${open ? "var(--accent)" : "var(--border)"}`,
        borderRadius: 9999,
        padding: "0 12px",
        height: 32,
        transition: "border-color 0.15s",
      }}>
        {/* Search icon */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="var(--muted)" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>

        {/* Active ingredient chip */}
        {activeIngredient && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: "var(--accent-soft)",
            border: "1px solid var(--border)",
            borderRadius: 9999,
            padding: "1px 8px",
            fontSize: 11, fontWeight: 500,
            color: "var(--foreground)",
            whiteSpace: "nowrap", flexShrink: 0,
          }}>
            {categoryIcon(activeIngredient.category)}
            <span>{activeIngredient.name_en}</span>
            <button
              onClick={clearIngredient}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: 0, lineHeight: 1, color: "var(--muted)",
                fontSize: 14, display: "flex", alignItems: "center",
              }}
              title="Clear ingredient filter"
              aria-label={`Remove ${activeIngredient.name_en} filter`}
            >×</button>
          </span>
        )}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder={activeIngredient ? "Add another filter…" : placeholder}
          style={{
            flex: 1, background: "none", border: "none", outline: "none",
            fontSize: 12, color: "var(--foreground)",
            minWidth: 0,
          }}
          autoComplete="off"
          spellCheck={false}
          aria-label="Search recipes or ingredients"
          aria-autocomplete="list"
        />

        {/* Clear button */}
        {query && (
          <button
            onClick={() => { setQuery(""); onTitleSearch(""); setOpen(false); inputRef.current?.focus(); }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 0, color: "var(--muted)",
              fontSize: 16, lineHeight: 1, display: "flex", alignItems: "center",
              flexShrink: 0,
            }}
            aria-label="Clear search"
          >×</button>
        )}
      </div>

      {/* ── Dropdown ── */}
      {open && results.length > 0 && (
        <div
          role="listbox"
          aria-label="Search suggestions"
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            boxShadow: "var(--shadow-soft)",
            overflow: "hidden", zIndex: 100,
          }}
        >
          {results.map((result, i) => (
            <DropdownRow
              key={i}
              result={result}
              active={i === activeIndex}
              onSelect={() => select(result)}
              onHover={() => setActiveIndex(i)}
            />
          ))}
          <div style={{
            padding: "5px 12px",
            fontSize: 10,
            color: "var(--muted)",
            borderTop: "1px solid var(--border)",
          }}>
            ↑↓ navigate · Enter select · Esc close
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Dropdown row ─────────────────────────────────────────────────────────────

type RowProps = {
  result: SearchResult;
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
};

function DropdownRow({ result, active, onSelect, onHover }: RowProps) {
  const base: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 10,
    padding: "8px 12px", cursor: "pointer",
    background: active ? "var(--surface-strong)" : "transparent",
    transition: "background 0.1s",
    userSelect: "none",
  };

  if (result.type === "title") {
    return (
      <div style={base} onClick={onSelect} onMouseEnter={onHover} role="option" aria-selected={active}>
        <div style={{
          width: 26, height: 26, borderRadius: "50%",
          background: "var(--surface-strong)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="var(--muted)" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: "var(--foreground)" }}>
            Search recipes for{" "}
            <strong style={{ fontWeight: 600 }}>&ldquo;{result.value}&rdquo;</strong>
          </div>
          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>
            Search by recipe title
          </div>
        </div>
        <span style={{
          fontSize: 10, color: "var(--muted)",
          background: "var(--surface-strong)",
          padding: "2px 6px", borderRadius: 4,
          flexShrink: 0,
        }}>title</span>
      </div>
    );
  }

  const ing = result.value;
  const icon = categoryIcon(ing.category);
  const cat = categoryLabel(ing.category);
  const meta = [cat, ing.name_de, ing.default_unit].filter(Boolean).join(" · ");

  return (
    <div style={base} onClick={onSelect} onMouseEnter={onHover} role="option" aria-selected={active}>
      <div style={{
        width: 26, height: 26, borderRadius: "50%",
        background: "var(--surface-strong)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: "var(--foreground)", fontWeight: 500 }}>
          {ing.name_en}
        </div>
        {meta && (
          <div style={{
            fontSize: 10, color: "var(--muted)",
            marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {meta}
          </div>
        )}
      </div>
      <span style={{
        fontSize: 10, color: "var(--accent)",
        background: "var(--accent-soft)",
        padding: "2px 6px", borderRadius: 4,
        flexShrink: 0, fontWeight: 500,
      }}>ingredient</span>
    </div>
  );
}
