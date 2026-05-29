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
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Pencil, ChefHat, X, Check, ShoppingCart } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { supabase } from "@/lib/supabase";
import { usePushSubscription } from "@/lib/usePushSubscription";
import { mapRecipeRows } from "@/lib/recipe-db";
import type { PantryItem, PantryItemStatus, RecipeSummary, ShoppingCategory, StorageLocation } from "@/types";
import { toRecipeSummaries } from "@/lib/recipe-adapter";
import ConfirmDialog from "@/components/ConfirmDialog";
import DeerDivider from "@/components/DeerDivider";
import BarcodeScanner from "@/components/BarcodeScanner";

const CATEGORY_ICONS: Record<ShoppingCategory, string> = {
  "produce":       "🥕",
  "fresh-herbs":   "🌿",
  "dairy":         "🥛",
  "eggs":          "🥚",
  "meat":          "🍖",
  "fish-seafood":  "🐟",
  "spices":        "🧂",
  "grains-pulses": "🌾",
  "nuts-seeds":    "🥜",
  "canned-dried":  "🥫",
  "bakery":        "🍞",
  "sauces-pastes": "🧴",
  "oils":          "🫒",
  "frozen":        "🧊",
  "beverages":     "🧃",
  "other":         "🛒",
};

const CATEGORIES: ShoppingCategory[] = [
  "produce","fresh-herbs","dairy","eggs","meat","fish-seafood",
  "spices","grains-pulses","nuts-seeds","canned-dried","bakery",
  "sauces-pastes","oils","frozen","beverages","other",
];

// Default storage location per category (used for auto-suggest)
const DEFAULT_STORAGE: Record<ShoppingCategory, StorageLocation> = {
  "produce":       "fridge",
  "fresh-herbs":   "fridge",
  "dairy":         "fridge",
  "eggs":          "fridge",
  "meat":          "fridge",
  "fish-seafood":  "fridge",
  "spices":        "room-temp",
  "grains-pulses": "room-temp",
  "nuts-seeds":    "room-temp",
  "canned-dried":  "room-temp",
  "bakery":        "room-temp",
  "sauces-pastes": "room-temp",
  "oils":          "room-temp",
  "frozen":        "freezer",
  "beverages":     "room-temp",
  "other":         "room-temp",
};

// Typical homemade shelf life in days per category
const HOMEMADE_SHELF_DAYS: Partial<Record<ShoppingCategory, number>> = {
  "produce":       5,
  "fresh-herbs":   3,
  "dairy":         5,
  "eggs":          21,
  "meat":          3,
  "fish-seafood":  2,
  "bakery":        4,
  "sauces-pastes": 14,
  "frozen":        90,
  "beverages":     7,
  "grains-pulses": 180,
  "canned-dried":  365,
  "nuts-seeds":    30,
  "oils":          60,
  "spices":        365,
  "other":         7,
};

const STORAGE_OPTIONS: { value: StorageLocation; icon: string; label: string }[] = [
  { value: "room-temp", icon: "🌡️", label: "Room temp" },
  { value: "fridge",    icon: "❄️",  label: "Fridge"    },
  { value: "freezer",   icon: "🧊",  label: "Freezer"   },
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

const today = () => new Date().toISOString().split("T")[0];

const EMPTY_FORM = {
  name: "", quantity: "1", unit: "no.",
  category: "other" as ShoppingCategory,
  storage: "room-temp" as StorageLocation,
  expiryDate: "", lowStockThreshold: "",
  brand: "", isHomemade: false, madeOn: today(),
};

const UNIT_OPTIONS = ["no.", "g", "kg", "L", "ml", "tsp", "tbsp", "cup", "packet", "canned", "spring", "jar", "bottle", "box", "block", "stick"];

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
  const [showScanner, setShowScanner] = useState(false);
  const [barcodeLoading, setBarcodeLoading] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  usePushSubscription(); // registers SW + requests notification permission

  // ── Load pantry items ─────────────────────────────────────────────────────
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

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
          storage:            (row.storage_location ?? DEFAULT_STORAGE[row.category as ShoppingCategory] ?? "room-temp") as StorageLocation,
          expiryDate:         row.expiry_date ?? undefined,
          lowStockThreshold:  row.low_stock_threshold != null ? Number(row.low_stock_threshold) : undefined,
          brand:              row.brand ?? undefined,
          isHomemade:         row.is_homemade ?? false,
          madeOn:             row.made_on ?? undefined,
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

  // ── Barcode lookup ────────────────────────────────────────────────────────
  const handleBarcode = async (code: string) => {
    setShowScanner(false);
    setBarcodeLoading(true);
    try {
      const res = await fetch(`/api/barcode?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!data.found) {
        toast.error(`Barcode ${code} not found in product database`);
        return;
      }
      setForm((f) => ({
        ...f,
        name:     data.name  || f.name,
        brand:    data.brand || f.brand,
        category: (data.category as ShoppingCategory) ?? f.category,
        storage:  DEFAULT_STORAGE[(data.category as ShoppingCategory) ?? f.category],
        quantity: data.quantity ? String(data.quantity) : f.quantity,
        unit:     data.unit   || f.unit,
        isHomemade: false,
      }));
      setShowForm(true);
      toast.success(`Found: ${data.name}`);
    } catch {
      toast.error("Barcode lookup failed");
    } finally {
      setBarcodeLoading(false);
    }
  };

  // ── Save item (add or edit) ───────────────────────────────────────────────
  const saveItem = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please log in to save items"); window.location.href = "/login"; return; }

      const payload = {
        user_id:              user.id,
        name:                 form.name.trim(),
        quantity:             parseFloat(form.quantity) || 0,
        unit:                 form.unit.trim(),
        category:             form.category,
        storage_location:     form.storage,
        expiry_date:          form.expiryDate || null,
        low_stock_threshold:  form.lowStockThreshold ? parseFloat(form.lowStockThreshold) : null,
        brand:                form.isHomemade ? null : (form.brand.trim() || null),
        is_homemade:          form.isHomemade,
        made_on:              form.isHomemade ? (form.madeOn || null) : null,
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

  // ── Quick quantity adjust (+/-) ───────────────────────────────────────────
  const adjustQuantity = async (item: PantryItem, delta: number) => {
    const newQty = Math.max(0, parseFloat((item.quantity + delta).toFixed(3)));
    // Optimistic update
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, quantity: newQty } : i));
    try {
      const { error } = await supabase
        .from("pantry_items")
        .update({ quantity: newQty })
        .eq("id", item.id);
      if (error) throw error;
    } catch (err) {
      // Revert on failure
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, quantity: item.quantity } : i));
      toast.error(err instanceof Error ? err.message : "Failed to update quantity");
    }
  };

  // ── Add low-stock items to shopping list ─────────────────────────────────
  const addLowStockToShoppingList = async () => {
    const lowStock = items.filter((i) => getPantryStatus(i) === "low-stock");
    if (!lowStock.length) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

      const rows = lowStock.map((i) => ({
        user_id:  user.id,
        name:     i.name,
        quantity: i.lowStockThreshold ?? 1,
        unit:     i.unit ?? "",
        category: i.category,
        checked:  false,
      }));
      const { error } = await supabase.from("shopping_list").insert(rows);
      if (error) throw error;
      toast.success(`${lowStock.length} item${lowStock.length > 1 ? "s" : ""} added to shopping list`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add to shopping list");
    }
  };

  // ── Suggest recipes ───────────────────────────────────────────────────────
  const suggestRecipes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

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
      storage:           item.storage,
      expiryDate:        item.expiryDate ?? "",
      lowStockThreshold: item.lowStockThreshold != null ? String(item.lowStockThreshold) : "",
      brand:             item.brand ?? "",
      isHomemade:        item.isHomemade,
      madeOn:            item.madeOn ?? today(),
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
          <div className="flex gap-2 flex-wrap">
            <Link href="/planner/shopping"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)", background: "var(--surface)" }}
            >
              <ShoppingCart size={16} /> Shopping List
            </Link>
            <button type="button" onClick={suggestRecipes}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)", background: "var(--surface)" }}
            >
              <ChefHat size={16} /> Suggest Recipes
            </button>
            <button type="button" onClick={() => setShowScanner(true)} disabled={barcodeLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-60"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)", background: "var(--surface)" }}
              title="Scan barcode"
            >
              {barcodeLoading ? "Looking up…" : "📷 Scan"}
            </button>
            <button type="button" onClick={() => { setEditTarget(null); setForm(EMPTY_FORM); setShowForm((s) => !s); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              <Plus size={16} /> Add Item
            </button>
          </div>
        </div>

        <DeerDivider className="mb-5" />

        {/* ── Alert banner ─────────────────────────────────────────────── */}
        {!loading && (() => {
          const expired    = items.filter((i) => getPantryStatus(i) === "expired");
          const expiring   = items.filter((i) => getPantryStatus(i) === "expiring-soon");
          const lowStock   = items.filter((i) => getPantryStatus(i) === "low-stock");
          if (!expired.length && !expiring.length && !lowStock.length) return null;

          return (
            <div className="rounded-2xl p-4 mb-5 space-y-2" style={{ background: "rgba(201,149,42,0.08)", border: "1px solid rgba(201,149,42,0.25)" }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--accent)" }}>
                ⚠ Pantry alerts
              </p>
              {expired.length > 0 && (
                <p className="text-sm text-red-600">
                  <span className="font-semibold">✗ Expired:</span>{" "}
                  {expired.map((i) => i.name).join(", ")}
                </p>
              )}
              {expiring.length > 0 && (
                <p className="text-sm text-amber-700">
                  <span className="font-semibold">⚠ Expiring soon:</span>{" "}
                  {expiring.map((i) => {
                    const days = Math.ceil((new Date(i.expiryDate!).getTime() - Date.now()) / 86_400_000);
                    return `${i.name} (${days === 0 ? "today" : days === 1 ? "tomorrow" : `${days}d`})`;
                  }).join(", ")}
                </p>
              )}
              {lowStock.length > 0 && (
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-sm" style={{ color: "var(--foreground)" }}>
                    <span className="font-semibold">↓ Low stock:</span>{" "}
                    {lowStock.map((i) => `${i.name} (${i.quantity} ${i.unit})`).join(", ")}
                  </p>
                  <button
                    type="button"
                    onClick={addLowStockToShoppingList}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    + Add to shopping list
                  </button>
                </div>
              )}
            </div>
          );
        })()}

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

                {/* Row 1: Name · Amount · Unit */}
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
                    style={{ flex: 1, minWidth: 0, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
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

                {/* Row 2: Category · Storage toggle */}
                <div className="flex gap-2 items-center">
                  <select
                    value={form.category}
                    onChange={(e) => {
                      const cat = e.target.value as ShoppingCategory;
                      setForm((f) => ({ ...f, category: cat, storage: DEFAULT_STORAGE[cat] }));
                    }}
                    className="rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                    style={{ flex: 1, minWidth: 0, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
                    ))}
                  </select>
                  {/* Storage 3-way toggle */}
                  <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                    {STORAGE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        title={opt.label}
                        onClick={() => setForm((f) => ({ ...f, storage: opt.value }))}
                        className="px-3 py-2.5 text-base transition"
                        style={{
                          background: form.storage === opt.value ? "var(--accent)" : "var(--surface)",
                          color: form.storage === opt.value ? "#fff" : "var(--foreground)",
                          borderRight: opt.value !== "freezer" ? "1px solid var(--border)" : undefined,
                        }}
                      >
                        {opt.icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 3: Brand + Expiry (store-bought) / Made on + Expiry (homemade) */}
                <div className="flex gap-2">
                  {form.isHomemade ? (
                    <div className="flex flex-col gap-1" style={{ flex: 1, minWidth: 0 }}>
                      <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Made on</label>
                      <input
                        type="date" value={form.madeOn}
                        onChange={(e) => setForm((f) => ({ ...f, madeOn: e.target.value }))}
                        className="rounded-xl px-3 py-2.5 text-sm focus:outline-none cursor-pointer"
                        style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1" style={{ flex: 1, minWidth: 0 }}>
                      <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Brand</label>
                      <input
                        type="text" placeholder="Brand (optional)" value={form.brand}
                        onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                        className="rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                        style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-1" style={{ flex: 1, minWidth: 0 }}>
                    <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                      {form.isHomemade
                        ? (() => {
                            const days = HOMEMADE_SHELF_DAYS[form.category];
                            if (!days || !form.madeOn) return "Use by";
                            const d = new Date(form.madeOn);
                            d.setDate(d.getDate() + days);
                            const hint = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
                            return `Use by · hint: ${hint}`;
                          })()
                        : "Expiry (from package)"}
                    </label>
                    <input
                      type="date" value={form.expiryDate}
                      onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                      placeholder={form.isHomemade && form.madeOn && HOMEMADE_SHELF_DAYS[form.category]
                        ? (() => {
                            const d = new Date(form.madeOn);
                            d.setDate(d.getDate() + (HOMEMADE_SHELF_DAYS[form.category] ?? 7));
                            return d.toISOString().split("T")[0];
                          })()
                        : undefined}
                      className="rounded-xl px-3 py-2.5 text-sm focus:outline-none cursor-pointer"
                      style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
                    />
                  </div>
                </div>

                {/* Row 4: Low stock threshold */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                    Alert when below (optional)
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number" min="0" placeholder={`e.g. 50`}
                      value={form.lowStockThreshold}
                      onChange={(e) => setForm((f) => ({ ...f, lowStockThreshold: e.target.value }))}
                      className="rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                      style={{ width: 100, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
                    />
                    <span className="text-sm" style={{ color: "var(--muted)" }}>
                      {form.unit || "units"} — shows Low Stock badge when quantity drops below this
                    </span>
                  </div>
                </div>

                {/* Row 5: Homemade toggle */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, isHomemade: !f.isHomemade }))}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition"
                    style={{
                      border: "1px solid var(--border)",
                      background: form.isHomemade ? "var(--accent)" : "var(--surface)",
                      color: form.isHomemade ? "#fff" : "var(--muted)",
                    }}
                  >
                    🫙 Homemade {form.isHomemade && <Check size={13} />}
                  </button>
                  <div className="flex gap-2">
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

                  {/* Quantity row with +/- */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs flex-wrap" style={{ color: "var(--muted)" }}>
                      <span title={STORAGE_OPTIONS.find((s) => s.value === item.storage)?.label}>
                        {STORAGE_OPTIONS.find((s) => s.value === item.storage)?.icon}
                      </span>
                      {item.isHomemade && <span className="italic">homemade</span>}
                      {item.brand && <span>{item.brand}</span>}
                      {item.expiryDate && <span>exp {new Date(item.expiryDate).toLocaleDateString("en-GB", { day:"numeric", month:"short" })}</span>}
                    </div>
                    {/* +/- stepper */}
                    <div className="flex items-center gap-1 rounded-lg overflow-hidden flex-shrink-0" style={{ border: "1px solid var(--border)" }}>
                      <button
                        type="button"
                        onClick={() => adjustQuantity(item, -1)}
                        disabled={item.quantity <= 0}
                        className="px-2 py-1 text-sm font-bold disabled:opacity-30 transition"
                        style={{ background: "var(--surface)", color: "var(--foreground)" }}
                        aria-label="Decrease quantity"
                      >−</button>
                      <span className="px-2 text-xs font-semibold tabular-nums" style={{ color: "var(--foreground)", minWidth: 48, textAlign: "center" }}>
                        {item.quantity} {item.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() => adjustQuantity(item, 1)}
                        className="px-2 py-1 text-sm font-bold transition"
                        style={{ background: "var(--surface)", color: "var(--foreground)" }}
                        aria-label="Increase quantity"
                      >+</button>
                    </div>
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

      {showScanner && (
        <BarcodeScanner
          onDetected={handleBarcode}
          onClose={() => setShowScanner(false)}
        />
      )}

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
