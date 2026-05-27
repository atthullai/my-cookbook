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
import { ArrowLeft, Clipboard, ClipboardCheck, Trash2, Plus, X, Check, CalendarDays } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { supabase } from "@/lib/supabase";
import { mapRecipeRows } from "@/lib/recipe-db";
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

function guessCategory(name: string): ShoppingCategory {
  if (/(milk|cream|butter|cheese|yogurt|curd|paneer|ghee|dairy)/.test(name)) return "dairy";
  if (/(chicken|beef|lamb|pork|mutton|fish|prawn|shrimp|meat|tuna|salmon|egg)/.test(name)) return "meat-fish";
  if (/(salt|pepper|turmeric|cumin|coriander|chilli|cardamom|cinnamon|clove|mustard|saffron|spice|masala|garam|fenugreek|bay leaf|star anise|herb)/.test(name)) return "spices";
  if (/(rice|flour|dal|lentil|chickpea|pasta|bread|oats|wheat|barley|quinoa|semolina|rava|poha|idli|urad|moong)/.test(name)) return "grains-pulses";
  if (/(oil|vinegar|sauce|ketchup|soy|mustard oil|coconut oil|sesame oil|olive oil|condiment)/.test(name)) return "oils-condiments";
  if (/(frozen|ice cream)/.test(name)) return "frozen";
  if (/(tomato|onion|garlic|ginger|potato|carrot|spinach|capsicum|mushroom|corn|peas|brinjal|cucumber|lettuce|cabbage|cauliflower|broccoli|eggplant|zucchini|celery|leek|scallion|spring onion|coriander leaves|mint|parsley|vegetable|fruit|lemon|lime|apple|mango|banana|coconut|tamarind|avocado|pepper)/.test(name)) return "produce";
  return "other";
}

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
  const [isGenerating, setIsGenerating] = useState(false);

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

  // ── Generate from meal plan ───────────────────────────────────────────────
  const generateFromPlan = async () => {
    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please log in first"); return; }

      // Get current week range (Mon–Sun)
      const today = new Date();
      const dow = today.getDay();
      const diffToMon = dow === 0 ? -6 : 1 - dow;
      const monday = new Date(today); monday.setDate(today.getDate() + diffToMon); monday.setHours(0,0,0,0);
      const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
      const weekStart = monday.toISOString().split("T")[0];
      const weekEnd   = sunday.toISOString().split("T")[0];

      // Load planned meals for this week
      const { data: meals, error: mealsError } = await supabase
        .from("planned_meals")
        .select("recipe_id, servings")
        .eq("user_id", user.id)
        .gte("meal_date", weekStart)
        .lte("meal_date", weekEnd);

      if (mealsError) throw mealsError;
      if (!meals || meals.length === 0) {
        toast("No meals planned for this week", { icon: "📅" });
        return;
      }

      const recipeIds = [...new Set(meals.map((m) => Number(m.recipe_id)))];

      // Load full recipe data (with ingredients)
      const { data: recipeRows, error: recipesError } = await supabase
        .from("recipes")
        .select("*")
        .in("id", recipeIds)
        .eq("user_id", user.id);

      if (recipesError) throw recipesError;
      const records = mapRecipeRows(recipeRows ?? []);

      // Load pantry items for cross-check
      const { data: pantryRows } = await supabase
        .from("pantry_items")
        .select("name, quantity")
        .eq("user_id", user.id);

      const pantryNames = new Set(
        (pantryRows ?? []).map((p: { name: string }) => p.name.toLowerCase().trim())
      );

      // Existing shopping list item names (to avoid duplicates)
      const existingNames = new Set(items.map((i) => i.name.toLowerCase().trim()));

      // Collect needed ingredients (not in pantry, not already in list)
      const needed: { name: string; quantity: number; unit: string; category: ShoppingCategory }[] = [];

      for (const record of records) {
        const mealEntry = meals.find((m) => Number(m.recipe_id) === record.id);
        const servingMultiplier = mealEntry?.servings ? Number(mealEntry.servings) : 1;

        for (const group of record.ingredients) {
          for (const item of group.items) {
            const nameNorm = item.name_en.toLowerCase().trim();
            if (!nameNorm) continue;
            if (pantryNames.has(nameNorm)) continue;
            if (existingNames.has(nameNorm)) continue;

            // Guess shopping category from ingredient name
            const cat = guessCategory(nameNorm);
            const qty = item.amount ? parseFloat(String(item.amount)) * servingMultiplier : 1;
            needed.push({
              name: item.name_en.trim(),
              quantity: isNaN(qty) ? 1 : Math.round(qty * 10) / 10,
              unit: item.unit ?? "",
              category: cat,
            });
            existingNames.add(nameNorm); // prevent duplicates from multiple recipes
          }
        }
      }

      if (needed.length === 0) {
        toast.success("All ingredients already in pantry or shopping list!");
        return;
      }

      // Batch insert into shopping_list
      const inserts = needed.map((n) => ({
        user_id:  user.id,
        name:     n.name,
        quantity: n.quantity,
        unit:     n.unit || null,
        category: n.category,
        checked:  false,
      }));

      const { data: inserted, error: insertError } = await supabase
        .from("shopping_list")
        .insert(inserts)
        .select();

      if (insertError) throw insertError;

      const newItems: ShoppingItem[] = (inserted ?? []).map((row) => ({
        id:        row.id,
        name:      row.name,
        quantity:  parseFloat(row.quantity ?? "1") || 1,
        unit:      row.unit ?? "",
        category:  (row.category ?? "other") as ShoppingCategory,
        checked:   false,
        recipeIds: [],
      }));

      setItems((prev) => [...prev, ...newItems]);
      toast.success(`Added ${needed.length} ingredient${needed.length !== 1 ? "s" : ""} from this week's plan`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate shopping list");
    } finally {
      setIsGenerating(false);
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
            className="p-2 rounded-xl border transition"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Shopping List</h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {totalCount - checkedCount} remaining · {checkedCount} checked
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {checkedCount > 0 && (
              <button
                type="button" onClick={clearChecked}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-red-200 text-red-500 transition"
                style={{ background: "rgba(220,38,38,0.07)" }}
              >
                <Trash2 size={14} /> Clear
              </button>
            )}
            <button
              type="button" onClick={() => void generateFromPlan()}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition disabled:opacity-60"
              style={{ color: "var(--olive)", border: "1px solid var(--border)", background: "var(--surface)" }}
            >
              <CalendarDays size={14} /> {isGenerating ? "Generating…" : "From plan"}
            </button>
            <button
              type="button" onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition"
              style={{ color: "var(--foreground)", border: "1px solid var(--border)", background: "var(--surface)" }}
            >
              {copied ? <ClipboardCheck size={14} style={{ color: "var(--olive)" }} /> : <Clipboard size={14} />}
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition shadow-sm"
              style={{ background: "var(--accent)", color: "#ffffff" }}
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
              <div className="rounded-2xl p-5 shadow-sm space-y-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
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
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{ border: "1px solid var(--border)", background: "var(--surface-strong)", color: "var(--foreground)" }}
                />

                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    placeholder="Qty"
                    value={addForm.quantity}
                    min="0"
                    step="0.5"
                    onChange={(e) => setAddForm((f) => ({ ...f, quantity: e.target.value }))}
                    className="px-3 py-2 rounded-xl text-sm focus:outline-none"
                    style={{ border: "1px solid var(--border)", background: "var(--surface-strong)", color: "var(--foreground)" }}
                  />
                  <input
                    type="text"
                    placeholder="Unit (g, ml…)"
                    value={addForm.unit}
                    onChange={(e) => setAddForm((f) => ({ ...f, unit: e.target.value }))}
                    className="px-3 py-2 rounded-xl text-sm focus:outline-none"
                    style={{ border: "1px solid var(--border)", background: "var(--surface-strong)", color: "var(--foreground)" }}
                  />
                  <select
                    value={addForm.category}
                    onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value as ShoppingCategory }))}
                    className="px-3 py-2 rounded-xl text-sm focus:outline-none"
                    style={{ border: "1px solid var(--border)", background: "var(--surface-strong)", color: "var(--foreground)" }}
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
                    className="px-4 py-2 rounded-xl text-sm font-medium transition"
                    style={{ color: "var(--muted)", background: "var(--surface-strong)", border: "1px solid var(--border)" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void addItem()}
                    disabled={isAdding || !addForm.name.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-60 transition"
                    style={{ background: "var(--accent)", color: "#ffffff" }}
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-medium transition"
                style={{ background: "var(--accent)" }}
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
                  <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--muted)" }}>
                    <span>{icon}</span> {label}
                    <span className="font-normal normal-case" style={{ color: "var(--muted)", opacity: 0.7 }}>
                      · {group.filter((i) => !i.checked).length} left
                    </span>
                  </h2>
                  <ul className="rounded-2xl divide-y overflow-hidden shadow-sm" style={{ background: "var(--surface)", borderColor: "var(--border)", border: "1px solid var(--border)" }}>
                    <AnimatePresence>
                      {group.map((item) => (
                        <motion.li
                          key={item.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer transition"
                          style={{ color: "var(--foreground)" }}
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
                            className={`flex-1 text-sm ${item.checked ? "line-through" : ""}`}
                            style={{ color: "var(--foreground)" }}
                          >
                            {item.name}
                          </motion.span>

                          {/* Quantity */}
                          <span className="text-sm tabular-nums" style={{ color: "var(--muted)" }}>
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
