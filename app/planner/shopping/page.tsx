"use client";

/**
 * Shopping List — /planner/shopping
 *
 * Features:
 * - "Add Item" inline form with category selector
 * - Auto-generated from the current week's planned meals
 * - Groups items by ShoppingCategory with icons
 * - Checkbox (cross out when checked) with Framer Motion layout
 * - "Clear checked" button
 * - "Copy to clipboard" export
 * - Items persisted in Supabase shopping_list table
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clipboard, ClipboardCheck, Trash2, Plus, X, Check } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { supabase } from "@/lib/supabase";
import type { ShoppingItem, ShoppingCategory } from "@/types";

const CATEGORY_META: Record<ShoppingCategory, { label: string; icon: string }> = {
  "produce":           { label: "Produce",           icon: "🥦" },
  "dairy":             { label: "Dairy",              icon: "🥛" },
  "meat-fish":         { label: "Meat & Fish",        icon: "🍗" },
  "spices":            { label: "Spices",             icon: "🫙" },
  "grains-pulses":     { label: "Grains & Pulses",    icon: "🌾" },
  "oils-condiments":   { label: "Oils & Condiments",  icon: "🫒" },
  "frozen":            { label: "Frozen",             icon: "🧊" },
  "other":             { label: "Other",              icon: "🛒" },
};

const CATEGORY_ORDER: ShoppingCategory[] = [
  "produce", "dairy", "meat-fish", "spices",
  "grains-pulses", "oils-condiments", "frozen", "other",
];

const EMPTY_ADD_FORM = {
  name: "",
  quantity: "1",
  unit: "",
  category: "other" as ShoppingCategory,
};

export default function ShoppingListPage() {
  const [items, setItems]       = useState<ShoppingItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [copied, setCopied]     = useState(false);

  // ── Add form state ────────────────────────────────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm]         = useState(EMPTY_ADD_FORM);
  const [isAdding, setIsAdding]       = useState(false);

  // ── Load shopping list from Supabase ─────────────────────────────────────
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setItems([]); setLoading(false); return; }

      const { data, error } = await supabase
        .from("shopping_list")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setItems(
        (data ?? []).map((row) => ({
          id:        row.id,
          name:      row.name,
          quantity:  parseFloat(row.quantity ?? "1") || 1,
          unit:      row.unit ?? "",
          category:  (row.category ?? "other") as ShoppingCategory,
          checked:   Boolean(row.checked),
          recipeIds: [],
        }))
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load shopping list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  // ── Add item ──────────────────────────────────────────────────────────────
  const addItem = async () => {
    if (!addForm.name.trim()) { toast.error("Item name is required"); return; }
    setIsAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please log in first"); return; }

      const { data, error } = await supabase
        .from("shopping_list")
        .insert({
          user_id:  user.id,
          name:     addForm.name.trim(),
          quantity: parseFloat(addForm.quantity) || 1,
          unit:     addForm.unit.trim() || null,
          category: addForm.category,
          checked:  false,
        })
        .select()
        .single();

      if (error) throw error;

      setItems((prev) => [...prev, {
        id:        data.id,
        name:      data.name,
        quantity:  parseFloat(data.quantity ?? "1") || 1,
        unit:      data.unit ?? "",
        category:  (data.category ?? "other") as ShoppingCategory,
        checked:   false,
        recipeIds: [],
      }]);
      setAddForm(EMPTY_ADD_FORM);
      setShowAddForm(false);
      toast.success(`"${data.name}" added`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setIsAdding(false);
    }
  };

  // ── Toggle checked ────────────────────────────────────────────────────────
  const toggleItem = async (item: ShoppingItem) => {
    setItems((prev) =>
      prev.map((i) => i.id === item.id ? { ...i, checked: !i.checked } : i)
    );
    try {
      const { error } = await supabase
        .from("shopping_list")
        .update({ checked: !item.checked })
        .eq("id", item.id);
      if (error) throw error;
    } catch {
      setItems((prev) =>
        prev.map((i) => i.id === item.id ? { ...i, checked: item.checked } : i)
      );
      toast.error("Failed to update item");
    }
  };

  // ── Clear checked ─────────────────────────────────────────────────────────
  const clearChecked = async () => {
    const checkedIds = items.filter((i) => i.checked).map((i) => i.id);
    if (checkedIds.length === 0) return;

    try {
      const { error } = await supabase
        .from("shopping_list")
        .delete()
        .in("id", checkedIds);
      if (error) throw error;
      setItems((prev) => prev.filter((i) => !i.checked));
      toast.success(`Cleared ${checkedIds.length} item${checkedIds.length > 1 ? "s" : ""}`);
    } catch {
      toast.error("Failed to clear items");
    }
  };

  // ── Copy to clipboard ─────────────────────────────────────────────────────
  const copyToClipboard = async () => {
    const text = CATEGORY_ORDER
      .map((cat) => {
        const group = items.filter((i) => i.category === cat && !i.checked);
        if (group.length === 0) return "";
        const { label, icon } = CATEGORY_META[cat];
        return `${icon} ${label}\n` + group.map((i) => `  • ${i.quantity > 0 ? i.quantity : ""} ${i.unit} ${i.name}`.trim()).join("\n");
      })
      .filter(Boolean)
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const checkedCount = items.filter((i) => i.checked).length;
  const totalCount   = items.length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Toaster position="top-right" />
      <main className="max-w-2xl mx-auto px-4 py-8 min-h-screen">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/planner"
            className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Shopping List</h1>
            <p className="text-sm text-gray-500">
              {totalCount - checkedCount} remaining · {checkedCount} checked
            </p>
          </div>
          <div className="flex gap-2">
            {checkedCount > 0 && (
              <button
                type="button" onClick={clearChecked}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-red-500 border border-red-100 hover:bg-red-50 transition"
              >
                <Trash2 size={14} /> Clear
              </button>
            )}
            <button
              type="button" onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 transition"
            >
              {copied ? <ClipboardCheck size={14} className="text-green-600" /> : <Clipboard size={14} />}
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
            >
              <Plus size={14} /> Add Item
            </button>
          </div>
        </div>

        {/* ── Inline add form ───────────────────────────────────────────── */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900 text-sm">Add to shopping list</h2>
                  <button type="button" onClick={() => { setShowAddForm(false); setAddForm(EMPTY_ADD_FORM); }}>
                    <X size={15} className="text-gray-400 hover:text-gray-700" />
                  </button>
                </div>

                {/* Name */}
                <input
                  type="text"
                  placeholder="Item name (e.g. Tomatoes, Olive Oil…)"
                  value={addForm.name}
                  autoFocus
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") void addItem(); }}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
                />

                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    placeholder="Qty"
                    value={addForm.quantity}
                    min="0"
                    step="0.5"
                    onChange={(e) => setAddForm((f) => ({ ...f, quantity: e.target.value }))}
                    className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400"
                  />
                  <input
                    type="text"
                    placeholder="Unit (g, ml…)"
                    value={addForm.unit}
                    onChange={(e) => setAddForm((f) => ({ ...f, unit: e.target.value }))}
                    className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400"
                  />
                  <select
                    value={addForm.category}
                    onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value as ShoppingCategory }))}
                    className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-indigo-400"
                  >
                    {CATEGORY_ORDER.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_META[cat].icon} {CATEGORY_META[cat].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowAddForm(false); setAddForm(EMPTY_ADD_FORM); }}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void addItem()}
                    disabled={isAdding || !addForm.name.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition"
                  >
                    {isAdding ? "Adding…" : <><Check size={14} /> Add to list</>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading skeleton */}
        {loading && (
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-4 bg-gray-100 rounded" />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && items.length === 0 && (
          <div className="text-center py-16">
            <span className="text-6xl block mb-4" aria-hidden="true">🛒</span>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Your shopping list is empty</h2>
            <p className="text-sm text-gray-400 mb-4">
              Add items manually, or plan meals for the week to generate a list automatically.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
              >
                <Plus size={14} /> Add first item
              </button>
              <Link href="/planner"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
              >
                Go to planner →
              </Link>
            </div>
          </div>
        )}

        {/* Grouped list */}
        {!loading && items.length > 0 && (
          <div className="space-y-6">
            {CATEGORY_ORDER.map((cat) => {
              const group = items.filter((i) => i.category === cat);
              if (group.length === 0) return null;
              const { label, icon } = CATEGORY_META[cat];

              return (
                <motion.section key={cat} layout>
                  <h2 className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    <span>{icon}</span> {label}
                    <span className="text-gray-400 font-normal normal-case">
                      · {group.filter((i) => !i.checked).length} left
                    </span>
                  </h2>
                  <ul className="bg-white rounded-2xl divide-y divide-gray-50 overflow-hidden shadow-sm border border-gray-100">
                    <AnimatePresence>
                      {group.map((item) => (
                        <motion.li
                          key={item.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition"
                          onClick={() => void toggleItem(item)}
                        >
                          {/* Checkbox */}
                          <div className={[
                            "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition",
                            item.checked
                              ? "bg-green-500 border-green-500"
                              : "border-gray-300 hover:border-green-400",
                          ].join(" ")}>
                            {item.checked && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                <path d="M1 4L4 7L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>

                          {/* Name */}
                          <motion.span
                            animate={{ opacity: item.checked ? 0.45 : 1 }}
                            className={`flex-1 text-sm ${item.checked ? "line-through text-gray-400" : "text-gray-700"}`}
                          >
                            {item.name}
                          </motion.span>

                          {/* Quantity */}
                          <span className="text-sm text-gray-500 tabular-nums">
                            {item.quantity > 0 ? item.quantity : ""}{item.unit ? ` ${item.unit}` : ""}
                          </span>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </motion.section>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
