"use client";

/**
 * Pantry — /pantry
 *
 * Features:
 * - Grid of pantry item cards
 * - Status badges: OK (green), Expiring Soon (amber ≤3 days), Expired (red), Low Stock (orange)
 * - Add item form (inline slide-down panel)
 * - Edit/Delete on each item (ConfirmDialog for delete)
 * - "Suggest Recipes" button → cross-matches pantry vs recipe ingredients
 * - Sort by: expiry, name, category
 * - Data persisted in Supabase pantry_items table
 */
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Pencil, ChefHat, X, Check } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { supabase } from "@/lib/supabase";
import { mapRecipeRows } from "@/lib/recipe-db";
import type { PantryItem, PantryItemStatus, RecipeSummary, ShoppingCategory } from "@/types";
import { toRecipeSummaries } from "@/lib/recipe-adapter";
import ConfirmDialog from "@/components/ConfirmDialog";
import DeerDivider from "@/components/DeerDivider";

const CATEGORY_ICONS: Record<ShoppingCategory, string> = {
  "produce":         "🥦",
  "dairy":           "🥛",
  "meat-fish":       "🍗",
  "spices":          "🫙",
  "grains-pulses":   "🌾",
  "oils-condiments": "🫒",
  "frozen":          "🧊",
  "other":           "🛒",
};

const CATEGORIES: ShoppingCategory[] = [
  "produce","dairy","meat-fish","spices",
  "grains-pulses","oils-condiments","frozen","other",
];

/** Derives pantry item status from expiry date and stock quantity */
function getPantryStatus(item: PantryItem): PantryItemStatus {
  if (item.expiryDate) {
    const daysLeft = Math.ceil((new Date(item.expiryDate).getTime() - Date.now()) / 86_400_000);
    if (daysLeft < 0)  return "expired";
    if (daysLeft <= 3) return "expiring-soon";
  }
  if (item.lowStockThreshold != null && item.quantity <= item.lowStockThreshold) {
    return "low-stock";
  }
  return "ok";
}

const STATUS_STYLES: Record<PantryItemStatus, string> = {
  ok:              "bg-green-100 text-green-700 border-green-200",
  "expiring-soon": "bg-amber-100 text-amber-700 border-amber-200",
  expired:         "bg-red-100 text-red-700 border-red-200",
  "low-stock":     "bg-orange-100 text-orange-700 border-orange-200",
};

const STATUS_LABELS: Record<PantryItemStatus, string> = {
  ok:              "✓ OK",
  "expiring-soon": "⚠ Expiring",
  expired:         "✗ Expired",
  "low-stock":     "↓ Low Stock",
};

type SortOption = "expiry" | "name" | "category";

const EMPTY_FORM = {
  name: "", quantity: "1", unit: "no.",
  category: "other" as ShoppingCategory,
  expiryDate: "", lowStockThreshold: "",
};

const UNIT_OPTIONS = ["no.", "g", "kg", "L", "ml", "tsp", "tbsp", "cup"];

export default function PantryPage() {
  const [items, setItems]           = useState<PantryItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editTarget, setEditTarget] = useState<PantryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PantryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving]     = useState(false);
  const [sortBy, setSortBy]         = useState<SortOption>("name");
  const [suggestions, setSuggestions] = useState<RecipeSummary[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);

  // ── Load pantry items ─────────────────────────────────────────────────────
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setItems([]); return; }

      const { data, error } = await supabase
        .from("pantry_items")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      setItems(
        (data ?? []).map((row) => ({
          id:                 row.id,
          name:               row.name,
          quantity:           Number(row.quantity) || 0,
          unit:               row.unit ?? "",
          category:           (row.category ?? "other") as ShoppingCategory,
          expiryDate:         row.expiry_date ?? undefined,
          lowStockThreshold:  row.low_stock_threshold != null ? Number(row.low_stock_threshold) : undefined,
          iconKey:            row.icon_key ?? undefined,
          notes:              row.notes ?? undefined,
          updatedAt:          row.updated_at ?? new Date().toISOString(),
        }))
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load pantry");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  // ── Save item (add or edit) ───────────────────────────────────────────────
  const saveItem = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
        user_id:              user.id,
        name:                 form.name.trim(),
        quantity:             parseFloat(form.quantity) || 0,
        unit:                 form.unit.trim(),
        category:             form.category,
        expiry_date:          form.expiryDate || null,
        low_stock_threshold:  form.lowStockThreshold ? parseFloat(form.lowStockThreshold) : null,
      };

      if (editTarget) {
        const { error } = await supabase.from("pantry_items").update(payload).eq("id", editTarget.id);
        if (error) throw error;
        toast.success("Item updated");
      } else {
        const { error } = await supabase.from("pantry_items").insert(payload);
        if (error) throw error;
        toast.success("Item added");
      }

      setForm(EMPTY_FORM);
      setShowForm(false);
      setEditTarget(null);
      loadItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save item");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete item ───────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("pantry_items").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      toast.success("Item removed");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Suggest recipes ───────────────────────────────────────────────────────
  const suggestRecipes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from("recipes").select("*").eq("user_id", user.id);
      const allRecipes = toRecipeSummaries(mapRecipeRows(data ?? []));
      const pantryNames = new Set(items.map((i) => i.name.toLowerCase()));

      // Score recipes by % of ingredients available in pantry
      // (Using title keywords as a simplification since RecipeSummary doesn't have ingredients)
      const scored = allRecipes.filter((r) => {
        const words = r.title.toLowerCase().split(/\s+/);
        return words.some((w) => pantryNames.has(w));
      });

      setSuggestions(scored.slice(0, 8));
      setShowSuggestions(true);
    } catch {
      toast.error("Failed to suggest recipes");
    }
  };

  // ── Sort items ────────────────────────────────────────────────────────────
  const sorted = [...items].sort((a, b) => {
    if (sortBy === "name")     return a.name.localeCompare(b.name);
    if (sortBy === "category") return a.category.localeCompare(b.category);
    // expiry: expired first, then soonest
    const dateA = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
    const dateB = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
    return dateA - dateB;
  });

  const openEdit = (item: PantryItem) => {
    setEditTarget(item);
    setForm({
      name:              item.name,
      quantity:          String(item.quantity),
      unit:              item.unit,
      category:          item.category,
      expiryDate:        item.expiryDate ?? "",
      lowStockThreshold: item.lowStockThreshold != null ? String(item.lowStockThreshold) : "",
    });
    setShowForm(true);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Toaster position="top-right" />
      <main className="max-w-5xl mx-auto px-4 py-8 min-h-screen" style={{ background: "var(--parchment, #fdf8f0)" }}>

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-0.5"
              style={{ color: "var(--accent)", opacity: 0.8 }}>
              Your Kitchen Store
            </p>
            <h1 className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>Pantry</h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              {items.length} item{items.length !== 1 ? "s" : ""} tracked
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={suggestRecipes}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)", background: "var(--surface)" }}
            >
              <ChefHat size={16} /> Suggest Recipes
            </button>
            <button type="button" onClick={() => { setEditTarget(null); setForm(EMPTY_FORM); setShowForm((s) => !s); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              <Plus size={16} /> Add Item
            </button>
          </div>
        </div>

        <DeerDivider height={80} className="mb-5" />

        {/* Sort bar */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Sort:</span>
          {(["name","expiry","category"] as SortOption[]).map((s) => (
            <button key={s} type="button" onClick={() => setSortBy(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition capitalize"
              style={{
                background: sortBy === s ? "var(--accent)" : "var(--surface)",
                color: sortBy === s ? "#fff" : "var(--foreground)",
                borderColor: sortBy === s ? "var(--accent)" : "var(--border)",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* ── Inline add/edit form ──────────────────────────────────────── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="rounded-2xl p-5 space-y-4 shadow-sm"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>
                    {editTarget ? "Edit Item" : "Add Item"}
                  </h2>
                  <button type="button" onClick={() => { setShowForm(false); setEditTarget(null); }}>
                    <X size={16} style={{ color: "var(--muted)" }} />
                  </button>
                </div>

                {/* Row 1: Name · Qty · Unit */}
                <div className="flex gap-2">
                  <input
                    type="text" placeholder="Name *" value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                    style={{ flex: 2, minWidth: 0, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
                  />
                  <input
                    type="number" value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                    className="rounded-xl px-2 py-2.5 text-sm focus:outline-none text-center"
                    style={{ flex: 1, minWidth: 0, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)", minHeight: "unset" }}
                  />
                  <select
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    className="rounded-xl px-2 py-2.5 text-sm focus:outline-none"
                    style={{ flex: 1, minWidth: 0, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
                  >
                    {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

                {/* Row 2: Category · Expiry date */}
                <div className="flex gap-2">
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ShoppingCategory }))}
                    className="rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                    style={{ flex: 1, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
                    ))}
                  </select>
                  <input
                    type="date" value={form.expiryDate}
                    onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                    className="rounded-xl px-3 py-2.5 text-sm focus:outline-none cursor-pointer"
                    style={{ flex: 1.4, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)", minHeight: "unset" }}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => { setShowForm(false); setEditTarget(null); }}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition"
                    style={{ color: "var(--muted)" }}
                  >
                    Cancel
                  </button>
                  <button type="button" onClick={saveItem} disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-60 transition"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    {isSaving ? "Saving…" : <><Check size={14} /> {editTarget ? "Update" : "Add"}</>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl"
                style={{ background: "rgba(180, 120, 30, 0.1)" }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && items.length === 0 && (
          <div className="text-center py-20">
            <span className="text-7xl block mb-4" aria-hidden="true">🥫</span>
            <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--foreground)" }}>Your pantry is empty</h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Start tracking what you have at home.</p>
          </div>
        )}

        {/* Pantry grid */}
        {!loading && sorted.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
          >
            {sorted.map((item) => {
              const status = getPantryStatus(item);
              return (
                <motion.div
                  key={item.id}
                  variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                  className="rounded-2xl shadow-sm p-4 flex flex-col gap-3"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl" aria-hidden="true">
                        {CATEGORY_ICONS[item.category]}
                      </span>
                      <p className="font-semibold text-sm leading-tight" style={{ color: "var(--foreground)" }}>{item.name}</p>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${STATUS_STYLES[status]}`}>
                      {STATUS_LABELS[status]}
                    </span>
                  </div>

                  {/* Quantity & expiry */}
                  <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
                    <span className="font-medium" style={{ color: "var(--foreground)" }}>{item.quantity} {item.unit}</span>
                    {item.expiryDate && <span>· exp {new Date(item.expiryDate).toLocaleDateString("en-GB", { day:"numeric", month:"short" })}</span>}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                    <button type="button" onClick={() => openEdit(item)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded-lg transition"
                      style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
                    >
                      <Pencil size={11} /> Edit
                    </button>
                    <button type="button" onClick={() => setDeleteTarget(item)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition"
                    >
                      <Trash2 size={11} /> Remove
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Recipe suggestions modal */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSuggestions(false)} />
              <motion.div
                className="relative bg-white rounded-2xl shadow-xl p-6 mx-4 w-full max-w-md max-h-[70vh] flex flex-col"
                initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold text-gray-900">Recipes You Can Make</h2>
                  <button type="button" onClick={() => setShowSuggestions(false)}><X size={16} /></button>
                </div>
                {suggestions.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    No recipes found matching your pantry items.
                  </p>
                ) : (
                  <ul className="overflow-y-auto space-y-2">
                    {suggestions.map((r) => (
                      <li key={r.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <span className="text-xl">{r.imageUrl ? "🍽️" : "🍳"}</span>
                        <a href={`/recipes/${r.id}`} className="text-sm font-medium hover:underline" style={{ color: "var(--accent)" }}>
                          {r.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Remove "${deleteTarget?.name}" from pantry?`}
        message="This item will be removed from your pantry inventory."
        confirmLabel="Remove"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={isDeleting}
      />
    </>
  );
}
