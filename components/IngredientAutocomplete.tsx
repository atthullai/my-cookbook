"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { IngredientSearchResult } from "@/app/api/ingredients/search/route";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: IngredientSearchResult) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
};

export default function IngredientAutocomplete({ value, onChange, onSelect, placeholder, className, style }: Props) {
  const [suggestions, setSuggestions] = useState<IngredientSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); setOpen(false); return; }
    try {
      const res = await fetch(`/api/ingredients/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) return;
      const data: IngredientSearchResult[] = await res.json();
      setSuggestions(data);
      setOpen(data.length > 0);
      setActiveIndex(-1);
    } catch { /* ignore */ }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 200);
  };

  const handleSelect = (result: IngredientSearchResult) => {
    onSelect(result);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative", flex: 1 }}>
      <input
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
        autoComplete="off"
        style={style}
      />
      {open && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 100,
            background: "var(--card-bg, #fff)",
            border: "1px solid var(--border, #e2e8f0)",
            borderRadius: 8,
            marginTop: 2,
            padding: "4px 0",
            listStyle: "none",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            maxHeight: 260,
            overflowY: "auto",
          }}
        >
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                background: i === activeIndex ? "var(--accent-subtle, #f0f9ff)" : "transparent",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span style={{ fontWeight: 500 }}>{s.name_en}</span>
              <span style={{ fontSize: "0.8em", color: "var(--muted, #94a3b8)", flexShrink: 0 }}>
                {[s.category, s.name_de, s.default_unit].filter(Boolean).join(" · ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
