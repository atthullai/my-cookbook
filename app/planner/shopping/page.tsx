"use client";

/**
 * Shopping List — /planner/shopping
 *
 * Features:
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
import { ArrowLeft, Clipboard, ClipboardCheck, Trash2 } from "lucide-react";
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

export default function ShoppingListPage() {
  const [items, setItems]       = useState<ShoppingItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [copied, setCopied]     = useState(false);

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

  // ── Toggle checked ────────────────────────────────────────────────────────
  const toggleItem = async (item: ShoppingItem) => {
    // Optimistic update
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
      // Revert on error
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
        return `${icon} ${label}\n` + group.map((i) => `  • ${i.quantity} ${i.unit} ${i.name}`).join("\n");
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
        <div className="flex items-center gap-3 mb-8">
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
                <Trash2 size={14} /> Clear checked
              </button>
            )}
            <button
              type="button" onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 transition"
            >
              {copied ? <ClipboardCheck size={14} className="text-green-600" /> : <Clipboard size={14} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

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
          <div className="text-center py-20">
            <span className="text-6xl block mb-4" aria-hidden="true">🛒</span>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Your shopping list is empty</h2>
            <p className="text-sm text-gray-400 mb-4">
              Plan meals for the week and generate a shopping list.
            </p>
            <Link href="/planner"
              className="text-sm text-indigo-600 hover:underline"
            >
              Go to planner →
            </Link>
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
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                    <span>{icon}</span> {label}
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
                          onClick={() => toggleItem(item)}
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
                            {item.quantity > 0 ? item.quantity : ""} {item.unit}
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
