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
import { detectPfand, disposalEmoji } from "@/lib/pfand";
import { addPfandEntry } from "@/lib/pfand-tracker";
import {
  itemNamesForCategory,
  lookupItem,
  suggestExpiryDate,
  suggestOpenedExpiryDate,
  lookupPfandAmount,
  lookupHomemadeItem,
  homemadeItemNames,
  suggestFreezerExpiryDate,
  CATEGORY_MAP,
} from "@/lib/pantry-items";

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
  expiryDate: "", lowStockThreshold: "3",   // default for "no."
  brand: "", isHomemade: false, madeOn: today(),
  isOpened: false,
};

const UNIT_OPTIONS = ["no.", "g", "mL", "kg", "L"];
const DEFAULT_THRESHOLD: Record<string, number> = {
  "kg":  0.5,
  "g":   100,
  "mL":  100,
  "L":   0.5,
  "no.": 3,
};
const EGG_SIZES = ["S", "M", "L", "XL"] as const;
const EGG_DAYS_BEFORE_EXPIRY_TO_FRIDGE = 7; // move to fridge 1 week before expiry

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

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
  const [isAddingToList, setIsAddingToList] = useState(false);

  // ── Recipe request / food sharing modal ───────────────────────────────────
  const [noRecipeItem, setNoRecipeItem] = useState<PantryItem | null>(null);
  const [requestStep, setRequestStep] = useState<"prompt" | "form" | "done">("prompt");
  const [requestNote, setRequestNote] = useState("");
  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);
  const [requestIngredients, setRequestIngredients] = useState<string[]>([]);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [shareItem, setShareItem] = useState<PantryItem | null>(null);

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
          unit:               UNIT_OPTIONS.includes(row.unit ?? "") ? (row.unit ?? "no.") : "no.",
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
          isFrozen:           row.is_frozen ?? false,
          isOpened:           row.is_opened ?? false,
          openedDate:         row.opened_date ?? undefined,
          pfandAmount:        row.pfand_amount != null ? Number(row.pfand_amount) : undefined,
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

      // Auto-detect Pfand from lookup table (beverages) or keyword detection
      const pfandFromLookup = lookupPfandAmount(form.category, form.name.trim());
      const pfandFromKeywords = detectPfand(form.name.trim());
      const pfandAmount =
        pfandFromLookup !== null
          ? pfandFromLookup
          : pfandFromKeywords.pfandType !== "none"
          ? pfandFromKeywords.deposit
          : null;

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
        is_opened:            form.isOpened,
        pfand_amount:         pfandAmount,
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

  // ── Add a single item to shopping list (from card) ───────────────────────
  const addItemToShoppingList = async (item: PantryItem) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

      const { data: existing } = await supabase
        .from("shopping_list")
        .select("name, checked")
        .eq("user_id", user.id);

      const alreadyIn = (existing ?? [])
        .filter((r: { checked: boolean }) => !r.checked)
        .some((r: { name: string }) => r.name.toLowerCase() === item.name.toLowerCase());

      if (alreadyIn) {
        toast("Already in your shopping list", { icon: "ℹ️" });
        return;
      }

      const { error } = await supabase.from("shopping_list").insert({
        user_id:  user.id,
        name:     item.name,
        quantity: item.lowStockThreshold ?? 1,
        unit:     item.unit ?? "",
        category: item.category,
        checked:  false,
      });
      if (error) throw error;
      toast.success(`${item.name} added to shopping list`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add to shopping list");
    }
  };

  // ── Add low-stock items to shopping list (bulk, from alert banner) ────────
  const addLowStockToShoppingList = async () => {
    if (isAddingToList) return;
    const lowStock = items.filter((i) => getPantryStatus(i) === "low-stock");
    if (!lowStock.length) return;
    setIsAddingToList(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

      // Fetch ALL shopping list items (unchecked) to avoid duplicates
      const { data: existing } = await supabase
        .from("shopping_list")
        .select("name, checked")
        .eq("user_id", user.id);

      const existingNames = new Set(
        (existing ?? [])
          .filter((r: { name: string; checked: boolean | string }) => !r.checked)
          .map((r: { name: string }) => r.name.toLowerCase())
      );

      const toAdd = lowStock.filter((i) => !existingNames.has(i.name.toLowerCase()));
      const skipped = lowStock.length - toAdd.length;

      if (!toAdd.length) {
        toast("Already in your shopping list", { icon: "ℹ️" });
        return;
      }

      const rows = toAdd.map((i) => ({
        user_id:  user.id,
        name:     i.name,
        quantity: i.lowStockThreshold ?? 1,
        unit:     i.unit ?? "",
        category: i.category,
        checked:  false,
      }));
      const { error } = await supabase.from("shopping_list").insert(rows);
      if (error) throw error;

      toast.success(
        skipped > 0
          ? `${toAdd.length} added · ${skipped} already in list`
          : `${toAdd.length} item${toAdd.length > 1 ? "s" : ""} added to shopping list`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add to shopping list");
    } finally {
      setIsAddingToList(false);
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

  // ── Move item to freezer (only once) ─────────────────────────────────────
  const moveToFreezer = async (item: PantryItem) => {
    if (item.isFrozen) {
      toast.error(`${item.name} has already been frozen once — refreezing is bad for health. Please discard.`, { duration: 4000 });
      return;
    }
    // Use freezerExpiryDays from lookup if available, else +14 days
    const itemDef = lookupHomemadeItem(item.name) ?? lookupItem(item.category, item.name);
    const freezerDays = itemDef?.freezerExpiryDays;
    let newExpiry: string;
    if (freezerDays) {
      newExpiry = suggestFreezerExpiryDate(itemDef!)!;
    } else {
      const baseDate = item.expiryDate && new Date(item.expiryDate) > new Date()
        ? new Date(item.expiryDate)
        : new Date();
      baseDate.setDate(baseDate.getDate() + 14);
      newExpiry = baseDate.toISOString().split("T")[0];
    }

    setItems((prev) => prev.map((i) =>
      i.id === item.id ? { ...i, storage: "freezer", expiryDate: newExpiry, isFrozen: true } : i
    ));
    try {
      const { error } = await supabase
        .from("pantry_items")
        .update({ storage_location: "freezer", expiry_date: newExpiry, is_frozen: true })
        .eq("id", item.id);
      if (error) throw error;
      toast.success(`${item.name} frozen 🧊 — use by ${new Date(newExpiry).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`);
    } catch {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, storage: item.storage, expiryDate: item.expiryDate, isFrozen: item.isFrozen } : i));
      toast.error("Failed to update storage");
    }
  };

  // ── Mark item as opened (recalculates expiry) ────────────────────────────
  const markOpened = async (item: PantryItem) => {
    if (item.isOpened) return;
    const openedDate = today();
    const openedExpiryDays =
      lookupItem(item.category, item.name)?.openedExpiryDays ??
      CATEGORY_MAP[item.category]?.defaultOpenedExpiryDays ??
      3;
    // Calculate new expiry = today + openedExpiryDays (but don't extend past original)
    const newExpiryFromOpen = addDays(openedDate, openedExpiryDays);
    const newExpiry = item.expiryDate && item.expiryDate < newExpiryFromOpen
      ? item.expiryDate   // don't extend past original
      : newExpiryFromOpen;

    setItems((prev) => prev.map((i) =>
      i.id === item.id ? { ...i, isOpened: true, openedDate, expiryDate: newExpiry } : i
    ));
    try {
      const { error } = await supabase
        .from("pantry_items")
        .update({ is_opened: true, opened_date: openedDate, expiry_date: newExpiry })
        .eq("id", item.id);
      if (error) throw error;
      toast.success(`${item.name} marked opened — use by ${new Date(newExpiry).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`);
    } catch {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, isOpened: false, openedDate: undefined, expiryDate: item.expiryDate } : i));
      toast.error("Failed to update");
    }
  };

  // ── Quick discard (expired items) ─────────────────────────────────────────
  const discardItem = async (item: PantryItem) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    try {
      const { error } = await supabase.from("pantry_items").delete().eq("id", item.id);
      if (error) throw error;

      const pfand = detectPfand(item.name);
      const emoji = disposalEmoji(pfand.disposal);

      if (pfand.pfandType !== "none") {
        // Offer to add to Pfand tracker
        toast(
          (t) => (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">
                ♻️ {item.name} has Pfand ({emoji} €{pfand.deposit.toFixed(2)})
              </p>
              <div className="flex gap-2">
                <button
                  className="flex-1 text-xs py-1.5 rounded-lg font-semibold"
                  style={{ background: "#22c55e", color: "#fff" }}
                  onClick={() => {
                    toast.dismiss(t.id);
                    void addPfandEntry(item.name, pfand).then((ok) => {
                      if (ok) toast.success("Added to Pfand tracker →");
                      else toast.error("Couldn't add to tracker");
                    });
                  }}
                >
                  Add to Pfand tracker
                </button>
                <button
                  className="text-xs py-1.5 px-3 rounded-lg"
                  style={{ background: "var(--surface-strong)", color: "var(--muted)" }}
                  onClick={() => toast.dismiss(t.id)}
                >
                  Skip
                </button>
              </div>
            </div>
          ),
          { duration: 8000 }
        );
      } else {
        toast.success(`${item.name} discarded — ${emoji} ${pfand.disposalLabel}`, { duration: 4000 });
      }
    } catch {
      setItems((prev) => [...prev, item]);
      toast.error("Failed to discard item");
    }
  };

  // ── Find recipes for an ingredient ───────────────────────────────────────
  const findRecipesFor = async (item: PantryItem) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("recipes").select("*").eq("user_id", user.id);
      const allRecipes = toRecipeSummaries(mapRecipeRows(data ?? []));
      const keyword = item.name.toLowerCase();
      const matched = allRecipes.filter((r) =>
        r.title.toLowerCase().includes(keyword) ||
        keyword.split(" ").some((w) => w.length > 2 && r.title.toLowerCase().includes(w))
      );
      if (matched.length) {
        setSuggestions(matched);
        setShowSuggestions(true);
      } else {
        // No recipe found — open the request / share modal
        setNoRecipeItem(item);
        setRequestStep("prompt");
        setRequestNote("");
        setAvailableIngredients(
          items
            .filter((i) => i.id !== item.id && getPantryStatus(i) !== "expired")
            .map((i) => i.name)
            .slice(0, 20)
        );
        setRequestIngredients([]); // start with nothing selected — user taps to add
      }
    } catch {
      toast.error("Failed to find recipes");
    }
  };

  // ── Submit recipe request to Supabase ────────────────────────────────────
  const submitRecipeRequest = async () => {
    if (!noRecipeItem) return;
    setIsSubmittingRequest(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("recipe_requests").insert({
        user_id:     user.id,
        ingredient:  noRecipeItem.name,
        other_items: requestIngredients,
        note:        requestNote.trim() || null,
        created_at:  new Date().toISOString(),
      });
      setRequestStep("done");
    } catch {
      // Table might not exist yet — show friendly message anyway
      setRequestStep("done");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // ── Mark item as shared (removes from pantry) ────────────────────────────
  const markAsShared = async (item: PantryItem) => {
    setShareItem(null);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    try {
      await supabase.from("pantry_items").delete().eq("id", item.id);
      toast.success(`${item.name} marked as shared 🤝 Great job reducing food waste!`);
    } catch {
      setItems((prev) => [...prev, item]);
      toast.error("Failed to update pantry");
    }
  };

  // ── Sort items ────────────────────────────────────────────────────────────
  const STATUS_PRIORITY: Record<PantryItemStatus, number> = {
    expired: 0, "expiring-soon": 1, "low-stock": 2, ok: 3,
  };

  const sorted = [...items].sort((a, b) => {
    // Always surface urgent items first regardless of sort mode
    const pa = STATUS_PRIORITY[getPantryStatus(a)];
    const pb = STATUS_PRIORITY[getPantryStatus(b)];
    if (pa !== pb) return pa - pb;

    if (sortBy === "name")     return a.name.localeCompare(b.name);
    if (sortBy === "category") return a.category.localeCompare(b.category);
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
      // Eggs manage storage via their own button — don't carry over stale fridge value
      storage:           item.category === "eggs" ? "room-temp" : item.storage,
      expiryDate:        item.expiryDate || (
        // Auto-suggest expiry for items that never had one set (catches null, undefined, "")
        item.isHomemade
          ? (lookupHomemadeItem(item.name) ? suggestExpiryDate("homemade", item.name) : "")
          : (lookupItem(item.category, item.name) ? suggestExpiryDate(item.category, item.name) : "")
      ),
      lowStockThreshold: item.lowStockThreshold != null ? String(item.lowStockThreshold) : "",
      brand:             item.brand ?? "",
      isHomemade:        item.isHomemade,
      madeOn:            item.madeOn ?? today(),
      isOpened:          item.isOpened,
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
                    disabled={isAddingToList}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap disabled:opacity-60"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    {isAddingToList ? "Adding…" : "+ Add to shopping list"}
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

                {/* Row 1: Name · Amount · Unit (or Egg Size) */}
                {/* Datalist: homemade suggestions when isHomemade, else category suggestions */}
                <datalist id="pantry-item-suggestions">
                  {(form.isHomemade
                    ? homemadeItemNames()
                    : itemNamesForCategory(form.category)
                  ).map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
                <div className="flex gap-2">
                  <input
                    type="text" placeholder="Name *" value={form.name}
                    list="pantry-item-suggestions"
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((f) => {
                        const itemDef = f.isHomemade
                          ? lookupHomemadeItem(name)
                          : lookupItem(f.category, name);
                        return {
                          ...f,
                          name,
                          // Auto-fill expiry whenever a known item is selected
                          expiryDate: itemDef
                            ? suggestExpiryDate(f.isHomemade ? "homemade" : f.category, name)
                            : f.expiryDate,
                          // Auto-set storage for homemade items
                          storage: (itemDef?.defaultStorage && f.isHomemade)
                            ? (itemDef.defaultStorage as typeof f.storage)
                            : f.storage,
                        };
                      });
                    }}
                    className="rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                    style={{ flex: 2, minWidth: 0, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
                  />
                  <input
                    type="number" value={form.quantity}
                    min="0" step="0.1" placeholder="Qty"
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                    className="rounded-xl px-2 py-2.5 text-sm focus:outline-none text-center"
                    style={{ flex: 1, minWidth: 0, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
                  />
                  {form.category === "eggs" ? (
                    /* Egg size picker — S / M / L / XL */
                    <div className="flex rounded-xl overflow-hidden flex-shrink-0" style={{ border: "1px solid var(--border)" }}>
                      {EGG_SIZES.map((sz) => (
                        <button key={sz} type="button"
                          onClick={() => setForm((f) => ({ ...f, unit: sz }))}
                          className="px-2 py-2.5 text-xs font-semibold transition"
                          style={{
                            background: form.unit === sz ? "var(--accent)" : "var(--surface)",
                            color: form.unit === sz ? "#fff" : "var(--foreground)",
                            borderRight: sz !== "XL" ? "1px solid var(--border)" : undefined,
                          }}
                        >{sz}</button>
                      ))}
                    </div>
                  ) : (
                    <select
                      value={UNIT_OPTIONS.includes(form.unit) ? form.unit : "no."}
                      onChange={(e) => {
                        const u = e.target.value;
                        setForm((f) => ({
                          ...f,
                          unit: u,
                          lowStockThreshold: String(DEFAULT_THRESHOLD[u] ?? f.lowStockThreshold ?? ""),
                        }));
                      }}
                      className="rounded-xl px-2 py-2.5 text-sm focus:outline-none"
                      style={{ flex: 1, minWidth: 0, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
                    >
                      {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  )}
                </div>

                {/* Storage tip for known homemade items */}
                {form.isHomemade && (() => {
                  const def = lookupHomemadeItem(form.name);
                  if (!def?.tip) return null;
                  return (
                    <div className="rounded-xl px-3 py-2 text-xs flex gap-2 items-start"
                      style={{ background: "rgba(201,149,42,0.07)", border: "1px solid rgba(201,149,42,0.2)", color: "var(--muted)" }}>
                      <span className="mt-0.5 flex-shrink-0">💡</span>
                      <span>{def.tip}</span>
                    </div>
                  );
                })()}

                {/* Egg lifecycle hint — fridge date = expiry - 7 days */}
                {form.category === "eggs" && (() => {
                  const fridgeDate = form.expiryDate ? addDays(form.expiryDate, -EGG_DAYS_BEFORE_EXPIRY_TO_FRIDGE) : null;
                  return (
                    <div className="rounded-xl p-3 text-xs space-y-1" style={{ background: "rgba(201,149,42,0.07)", border: "1px solid rgba(201,149,42,0.2)" }}>
                      <p className="font-semibold" style={{ color: "var(--accent)" }}>🥚 Egg lifecycle</p>
                      <p style={{ color: "var(--muted)" }}>🛒 Bought: <strong>{form.madeOn ? fmtDate(form.madeOn) : "set below"}</strong></p>
                      <p style={{ color: "var(--muted)" }}>🌡️ Room temp until: <strong>{fridgeDate ? fmtDate(fridgeDate) : "set expiry date below"}</strong></p>
                      <p style={{ color: fridgeDate ? "#2563eb" : "var(--muted)" }}>❄️ Move to fridge by: <strong>{fridgeDate ? fmtDate(fridgeDate) : "—"}</strong></p>
                      <p style={{ color: form.expiryDate ? "#dc2626" : "var(--muted)" }}>🗑 Discard by: <strong>{form.expiryDate ? fmtDate(form.expiryDate) : "set carton expiry below"}</strong></p>
                    </div>
                  );
                })()}

                {/* Row 2: Category · Storage toggle */}
                <div className="flex gap-2 items-center">
                  <select
                    value={form.category}
                    onChange={(e) => {
                      const cat = e.target.value as ShoppingCategory;
                      if (cat === "eggs") {
                        // Eggs: room temp → fridge lifecycle; expiry left blank for user to fill from carton
                        setForm((f) => ({
                          ...f,
                          category: cat,
                          storage: "room-temp",
                          unit: f.unit && EGG_SIZES.includes(f.unit as typeof EGG_SIZES[number]) ? f.unit : "M",
                          madeOn: f.madeOn || today(),
                          expiryDate: f.expiryDate || "",   // keep existing or leave blank
                        }));
                      } else {
                        setForm((f) => ({
                          ...f,
                          category: cat,
                          storage: DEFAULT_STORAGE[cat],
                          unit: f.unit === "M" || f.unit === "S" || f.unit === "L" || f.unit === "XL" ? "no." : f.unit,
                        }));
                      }
                    }}
                    className="rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                    style={{ flex: 1, minWidth: 0, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
                    ))}
                  </select>

                  {/* Storage toggle — locked for eggs only */}
                  {form.category === "eggs" ? (
                    <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm"
                      style={{ border: "1px solid var(--border)", color: "var(--muted)", background: "var(--surface)", whiteSpace: "nowrap" }}
                    >
                      🌡️→❄️ auto
                    </div>
                  ) : (
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
                  )}
                </div>

                {/* Row 3: Bought on + Expiry (eggs) / Made on + Expiry (homemade) / Brand + Expiry (others) */}
                <div className="flex gap-2">
                  {form.category === "eggs" ? (
                    <div className="flex flex-col gap-1" style={{ flex: 1, minWidth: 0 }}>
                      <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Bought on</label>
                      <input
                        type="date" value={form.madeOn}
                        onChange={(e) => setForm((f) => ({ ...f, madeOn: e.target.value }))}
                        className="rounded-xl px-3 py-2.5 text-sm focus:outline-none cursor-pointer"
                        style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
                      />
                    </div>
                  ) : form.isHomemade ? (
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
                      {form.category === "eggs" ? "Expiry (from carton)" :
                       (() => {
                          const itemDef = form.isHomemade
                            ? lookupHomemadeItem(form.name)
                            : lookupItem(form.category, form.name);
                          if (!itemDef) return form.isHomemade ? "Use by (from prep date)" : "Expiry (from package)";
                          return `Use by · ${itemDef.expiryDays}d from ${form.isHomemade ? "prep" : "purchase"}`;
                        })()}
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="date" value={form.expiryDate}
                        onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                        className="rounded-xl px-3 py-2.5 text-sm focus:outline-none cursor-pointer flex-1"
                        style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
                      />
                      {/* Quick-fill button when a known item is selected */}
                      {(() => {
                        const itemDef = form.isHomemade
                          ? lookupHomemadeItem(form.name)
                          : lookupItem(form.category, form.name);
                        if (!itemDef) return null;
                        const suggested = suggestExpiryDate(form.isHomemade ? "homemade" : form.category, form.name);
                        if (form.expiryDate === suggested) return null;
                        return (
                          <button
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, expiryDate: suggested }))}
                            className="flex-shrink-0 text-xs px-2 py-1.5 rounded-lg font-medium whitespace-nowrap"
                            style={{ background: "var(--accent)", color: "#fff" }}
                          >
                            Set {itemDef.expiryDays}d
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Opened toggle — only for categories with hasOpenedState */}
                {CATEGORY_MAP[form.category]?.hasOpenedState && (
                  <div className="flex items-center justify-between rounded-xl px-3 py-2.5"
                    style={{ background: form.isOpened ? "rgba(234,179,8,0.08)" : "var(--surface)", border: "1px solid var(--border)" }}>
                    <div>
                      <p className="text-sm font-medium">📂 Already opened?</p>
                      {form.isOpened && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                          Opened expiry: {suggestOpenedExpiryDate(form.category, form.name) ?? "—"} ({
                            lookupItem(form.category, form.name)?.openedExpiryDays ??
                            CATEGORY_MAP[form.category]?.defaultOpenedExpiryDays ?? 3
                          } days)
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, isOpened: !f.isOpened }))}
                      className="w-12 h-6 rounded-full transition relative"
                      style={{ background: form.isOpened ? "var(--accent)" : "var(--border)" }}
                    >
                      <span
                        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                        style={{ left: form.isOpened ? "calc(100% - 1.35rem)" : "0.125rem" }}
                      />
                    </button>
                  </div>
                )}

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
                    onClick={() => setForm((f) => ({
                      ...f,
                      isHomemade: !f.isHomemade,
                      storage: f.storage,  // keep current storage — homemade items vary
                    }))}
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
              const daysLeft = item.expiryDate
                ? Math.ceil((new Date(item.expiryDate).getTime() - Date.now()) / 86_400_000)
                : null;

              // Color-coded border per status
              const cardBorder =
                status === "expired"        ? "2px solid #ef4444" :
                status === "expiring-soon"  ? "2px solid #f59e0b" :
                status === "low-stock"      ? "2px solid #f97316" :
                                              "1px solid var(--border)";

              // Can freeze only if currently in fridge (not room-temp, not already frozen)
              const freezableCategories: ShoppingCategory[] = [
                "produce","meat","fish-seafood","dairy","bakery","grains-pulses","beverages",
              ];
              const canFreeze = freezableCategories.includes(item.category) && item.storage === "fridge";

              return (
                <motion.div
                  key={item.id}
                  variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                  className="rounded-2xl shadow-sm p-4 flex flex-col gap-3"
                  style={{ background: "var(--surface)", border: cardBorder }}
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

                  {/* Category + expiry info row */}
                  <div className="flex items-center gap-2 -mt-1 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium capitalize"
                      style={{ background: "var(--surface-strong)", color: "var(--muted)" }}>
                      {CATEGORY_ICONS[item.category]} {item.category.replace(/-/g, " ")}
                    </span>
                    {daysLeft !== null ? (
                      <p className={`text-xs font-medium ${
                        status === "expired"       ? "text-red-500" :
                        status === "expiring-soon" ? "text-amber-600" :
                        "text-gray-400"
                      }`}>
                        {status === "expired"
                          ? `Expired ${Math.abs(daysLeft)}d ago`
                          : daysLeft === 0 ? "Expires today!"
                          : daysLeft === 1 ? "Expires tomorrow"
                          : status === "expiring-soon" ? `${daysLeft}d left`
                          : `Exp ${new Date(item.expiryDate!).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
                        }
                      </p>
                    ) : (
                      <p className="text-[10px]" style={{ color: "var(--muted)", opacity: 0.6 }}>
                        No expiry set
                      </p>
                    )}
                  </div>

                  {/* Homemade storage tip */}
                  {item.isHomemade && (() => {
                    const def = lookupHomemadeItem(item.name);
                    if (!def?.tip) return null;
                    return (
                      <p className="text-[10px] px-2 py-1 rounded-lg -mt-1"
                        style={{ background: "rgba(201,149,42,0.07)", color: "var(--muted)", border: "1px solid rgba(201,149,42,0.15)" }}>
                        💡 {def.tip}
                      </p>
                    );
                  })()}

                  {/* Egg lifecycle mini-timeline — fridge date = expiry - 7 days */}
                  {item.category === "eggs" && (
                    <div className="text-[10px] space-y-0.5 -mt-1 pb-1" style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                      {item.madeOn && <p>🛒 Bought: <strong>{fmtDate(item.madeOn)}</strong></p>}
                      {item.expiryDate && <p>🌡️ Room temp until: <strong>{fmtDate(addDays(item.expiryDate, -EGG_DAYS_BEFORE_EXPIRY_TO_FRIDGE))}</strong></p>}
                      {item.expiryDate && <p>❄️ Move to fridge by: <strong>{fmtDate(addDays(item.expiryDate, -EGG_DAYS_BEFORE_EXPIRY_TO_FRIDGE))}</strong></p>}
                      {item.expiryDate && <p>🗑 Discard by: <strong>{fmtDate(item.expiryDate)}</strong></p>}
                    </div>
                  )}

                  {/* Quantity row with +/- */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs flex-wrap" style={{ color: "var(--muted)" }}>
                      <span title={STORAGE_OPTIONS.find((s) => s.value === item.storage)?.label}>
                        {STORAGE_OPTIONS.find((s) => s.value === item.storage)?.icon}
                      </span>
                      {item.isHomemade && <span className="italic">homemade</span>}
                      {item.brand && <span>{item.brand}</span>}
                      {item.isOpened && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ background: "rgba(234,179,8,0.12)", color: "#b45309", border: "1px solid rgba(234,179,8,0.3)" }}>
                          📂 Opened
                        </span>
                      )}
                      {item.pfandAmount != null && item.pfandAmount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ background: "rgba(34,197,94,0.1)", color: "#15803d", border: "1px solid rgba(34,197,94,0.25)" }}>
                          ♻️ €{item.pfandAmount.toFixed(2)}
                        </span>
                      )}
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

                  {/* Egg: storage state + move button */}
                  {item.category === "eggs" && (() => {
                    const moveToFridge = async () => {
                      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, storage: "fridge" } : i));
                      const { error } = await supabase.from("pantry_items").update({ storage_location: "fridge" }).eq("id", item.id);
                      if (error) {
                        setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, storage: "room-temp" } : i));
                        toast.error("Failed to update storage");
                      } else {
                        toast.success("Eggs moved to fridge ❄️");
                      }
                    };

                    // Fridge date = expiry - 7 days
                    const fridgeDate = item.expiryDate
                      ? addDays(item.expiryDate, -EGG_DAYS_BEFORE_EXPIRY_TO_FRIDGE)
                      : null;
                    const daysUntilFridge = fridgeDate
                      ? Math.ceil((new Date(fridgeDate).getTime() - Date.now()) / 86_400_000)
                      : null;
                    const isOverdue  = daysUntilFridge !== null && daysUntilFridge < 0;
                    const isUrgent   = daysUntilFridge !== null && daysUntilFridge <= 1;

                    return (
                      <div className="flex gap-2 mb-1">
                        {/* Current state chip */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium flex-shrink-0"
                          style={item.storage === "fridge"
                            ? { background: "rgba(96,165,250,0.12)", color: "#2563eb", border: "1px solid rgba(96,165,250,0.3)" }
                            : isOverdue
                              ? { background: "rgba(239,68,68,0.1)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.3)" }
                              : { background: "rgba(251,191,36,0.12)", color: "#b45309", border: "1px solid rgba(251,191,36,0.3)" }
                          }
                        >
                          {item.storage === "fridge" ? "❄️ In fridge" : isOverdue ? "⚠️ Room temp" : "🌡️ Room temp"}
                        </div>

                        {/* Move to Fridge — only when at room temp */}
                        {item.storage === "room-temp" && (
                          <button type="button" onClick={moveToFridge}
                            className="flex-1 px-2 py-1.5 text-xs rounded-lg font-semibold transition"
                            style={isOverdue
                              ? { background: "rgba(239,68,68,0.12)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.4)" }
                              : isUrgent
                                ? { background: "rgba(251,191,36,0.15)", color: "#b45309", border: "1px solid rgba(251,191,36,0.4)" }
                                : { background: "rgba(96,165,250,0.12)", color: "#2563eb", border: "1px solid rgba(96,165,250,0.35)" }
                            }
                          >
                            {isOverdue
                              ? `❄️ Move to Fridge NOW — overdue since ${fridgeDate ? fmtDate(fridgeDate) : "?"}`
                              : daysUntilFridge === 0 ? "❄️ Move to Fridge — today!"
                              : daysUntilFridge === 1 ? "❄️ Move to Fridge — tomorrow"
                              : fridgeDate ? `❄️ Move to Fridge by ${fmtDate(fridgeDate)}`
                              : "❄️ Move to Fridge"}
                          </button>
                        )}

                        {/* In fridge — show discard only */}
                        {item.storage === "fridge" && (
                          <span className="flex-1 px-2 py-1.5 text-xs rounded-lg text-center"
                            style={{ color: "var(--muted)", border: "1px solid var(--border)" }}
                          >
                            🗑 Discard by {item.expiryDate ? fmtDate(item.expiryDate) : "expiry"}
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Smart action strip — always visible */}
                  <div className="flex gap-1.5 flex-wrap -mt-1">
                    {/* Find Recipes — hidden for frozen and expired items */}
                    {item.storage !== "freezer" && status !== "expired" && (
                      <button type="button" onClick={() => findRecipesFor(item)}
                        className="flex-1 px-2 py-1.5 text-xs rounded-lg font-medium transition whitespace-nowrap"
                        style={
                          status === "expiring-soon"
                            ? { background: "rgba(201,149,42,0.14)", color: "var(--accent)", border: "1px solid rgba(201,149,42,0.35)" }
                            : { background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }
                        }
                      >
                        🍳 Recipes
                      </button>
                    )}

                    {/* Mark Opened — for items that support opened state, not yet opened */}
                    {CATEGORY_MAP[item.category]?.hasOpenedState && !item.isOpened && status !== "expired" && (
                      <button type="button" onClick={() => void markOpened(item)}
                        className="flex-1 px-2 py-1.5 text-xs rounded-lg font-medium transition whitespace-nowrap"
                        style={{ background: "rgba(234,179,8,0.08)", color: "#b45309", border: "1px solid rgba(234,179,8,0.25)" }}
                      >
                        📂 Click here if opened
                      </button>
                    )}

                    {/* Freeze — expiring + freezable + not yet frozen */}
                    {status === "expiring-soon" && canFreeze && !item.isFrozen && (
                      <button type="button" onClick={() => moveToFreezer(item)}
                        className="flex-1 px-2 py-1.5 text-xs rounded-lg font-medium transition whitespace-nowrap"
                        style={{ background: "rgba(96,165,250,0.12)", color: "#3b82f6", border: "1px solid rgba(96,165,250,0.3)" }}
                      >
                        🧊 Freeze
                      </button>
                    )}

                    {/* Already frozen + expiring → discard (can't refreeze) */}
                    {item.isFrozen && status === "expiring-soon" && (
                      <button type="button" onClick={() => discardItem(item)}
                        className="flex-1 px-2 py-1.5 text-xs rounded-lg font-medium transition whitespace-nowrap"
                        style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
                      >
                        🗑 Discard
                      </button>
                    )}

                    {/* Buy more — expiring-soon or expired */}
                    {(status === "expiring-soon" || status === "expired") && (
                      <button type="button" onClick={() => addItemToShoppingList(item)}
                        className="flex-1 px-2 py-1.5 text-xs rounded-lg font-medium transition whitespace-nowrap"
                        style={{ background: "rgba(201,149,42,0.10)", color: "var(--accent)", border: "1px solid rgba(201,149,42,0.3)" }}
                      >
                        🛒 Buy more
                      </button>
                    )}

                    {/* Share — expiring-soon ONLY, not frozen, not eggs in fridge */}
                    {status === "expiring-soon" && !item.isFrozen && item.storage !== "freezer" && !(item.category === "eggs" && item.storage === "fridge") && (
                      <button type="button" onClick={() => setShareItem(item)}
                        className="flex-1 px-2 py-1.5 text-xs rounded-lg font-medium transition whitespace-nowrap"
                        style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.3)" }}
                      >
                        🤝 Share
                      </button>
                    )}

                    {/* Discard — expired or expiring-soon, any storage */}
                    {(status === "expired" || status === "expiring-soon") && (
                      <button type="button" onClick={() => discardItem(item)}
                        className="flex-1 px-2 py-1.5 text-xs rounded-lg font-medium transition whitespace-nowrap"
                        style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
                      >
                        🗑 Discard
                      </button>
                    )}
                  </div>

                  {/* Edit / Remove row */}
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

      {/* ── No-Recipe Modal: request + share ─────────────────────────── */}
      <AnimatePresence>
        {noRecipeItem && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setNoRecipeItem(null)} />
            <motion.div
              className="relative rounded-2xl shadow-xl p-6 mx-4 w-full max-w-md flex flex-col gap-4"
              style={{ background: "var(--surface)" }}
              initial={{ y: 48, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 48, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
            >
              <button type="button" className="absolute top-4 right-4" onClick={() => setNoRecipeItem(null)}>
                <X size={16} style={{ color: "var(--muted)" }} />
              </button>

              {requestStep === "prompt" && (
                <>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "var(--accent)" }}>
                      No recipe found
                    </p>
                    <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                      What to do with <span style={{ color: "var(--accent)" }}>{noRecipeItem.name}</span>?
                    </h2>
                    <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                      You have no saved recipe that uses this ingredient. Here are two ideas:
                    </p>
                  </div>

                  {/* Option A — Request a recipe */}
                  <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(201,149,42,0.08)", border: "1px solid rgba(201,149,42,0.2)" }}>
                    <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                      🍳 Request a new recipe
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      Let us know what you want to cook — we will add it to the library for everyone!
                    </p>
                    <div className="flex gap-3">
                      <button type="button"
                        onClick={() => setRequestStep("form")}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition"
                        style={{ background: "var(--accent)", color: "#fff" }}
                      >
                        👍 Yes, request it
                      </button>
                      <button type="button"
                        onClick={() => setNoRecipeItem(null)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition"
                        style={{ border: "1px solid var(--border)", color: "var(--muted)" }}
                      >
                        👎 Not now
                      </button>
                    </div>
                  </div>

                  {/* Option B — Food sharing */}
                  <div className="rounded-xl p-4 space-y-2" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                      🤝 Share it before it expires
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      Food sharing is encouraged! Offer it to a neighbour, friend, or local food bank — reducing waste is always a win.
                    </p>
                    <button type="button"
                      onClick={() => { setNoRecipeItem(null); setShareItem(noRecipeItem); }}
                      className="px-4 py-1.5 rounded-xl text-xs font-medium transition"
                      style={{ background: "rgba(34,197,94,0.15)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.3)" }}
                    >
                      Explore sharing options →
                    </button>
                  </div>
                </>
              )}

              {requestStep === "form" && (
                <>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "var(--accent)" }}>Recipe Request</p>
                    <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
                      What would you cook with <span style={{ color: "var(--accent)" }}>{noRecipeItem.name}</span>?
                    </h2>
                  </div>

                  {/* Other pantry ingredients to include */}
                  <div>
                    <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                      Other ingredients you have (tick what you want to use):
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                      {availableIngredients.length === 0 && (
                        <p className="text-xs italic" style={{ color: "var(--muted)" }}>No other pantry items found.</p>
                      )}
                      {availableIngredients.map((name) => {
                        const selected = requestIngredients.includes(name);
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() =>
                              setRequestIngredients((prev) =>
                                selected ? prev.filter((n) => n !== name) : [...prev, name]
                              )
                            }
                            className="px-2.5 py-1 rounded-full text-xs font-medium transition"
                            style={
                              selected
                                ? { background: "var(--accent)", color: "#fff" }
                                : { border: "1px solid var(--border)", color: "var(--foreground)", background: "var(--surface)" }
                            }
                          >
                            {selected ? "✓ " : ""}{name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom note */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: "var(--muted)" }}>
                      Any dish in mind? Cuisine preference? (optional)
                    </label>
                    <textarea
                      value={requestNote}
                      onChange={(e) => setRequestNote(e.target.value)}
                      placeholder={`e.g. "Something Indian with ${noRecipeItem.name}, quick under 30 mins"`}
                      rows={3}
                      className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none"
                      style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button type="button" onClick={() => setRequestStep("prompt")}
                      className="px-4 py-2 rounded-xl text-sm transition"
                      style={{ color: "var(--muted)" }}
                    >← Back</button>
                    <button type="button" onClick={submitRecipeRequest} disabled={isSubmittingRequest}
                      className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-60"
                      style={{ background: "var(--accent)", color: "#fff" }}
                    >
                      {isSubmittingRequest ? "Sending…" : "📨 Send Request"}
                    </button>
                  </div>
                </>
              )}

              {requestStep === "done" && (
                <div className="text-center py-4 space-y-3">
                  <span className="text-5xl block">🙏</span>
                  <h2 className="font-semibold text-lg" style={{ color: "var(--foreground)" }}>
                    Thank you!
                  </h2>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>
                    Your request has been noted. We will cook up a recipe featuring{" "}
                    <strong>{noRecipeItem.name}</strong> soon!
                  </p>
                  <button type="button" onClick={() => setNoRecipeItem(null)}
                    className="px-6 py-2 rounded-xl text-sm font-medium transition"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Food Share Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {shareItem && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShareItem(null)} />
            <motion.div
              className="relative rounded-2xl shadow-xl p-6 mx-4 w-full max-w-sm flex flex-col gap-4"
              style={{ background: "var(--surface)" }}
              initial={{ y: 48, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 48, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
            >
              <button type="button" className="absolute top-4 right-4" onClick={() => setShareItem(null)}>
                <X size={16} style={{ color: "var(--muted)" }} />
              </button>
              <div className="text-center">
                <span className="text-4xl block mb-2">🌱</span>
                <h2 className="font-semibold text-base" style={{ color: "var(--foreground)" }}>
                  Share <span style={{ color: "var(--accent)" }}>{shareItem.name}</span>
                </h2>
                <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
                  Food sharing is encouraged! Before this goes to waste, consider:
                </p>
              </div>
              <ul className="space-y-2 text-sm" style={{ color: "var(--foreground)" }}>
                <li className="flex items-start gap-2"><span>👫</span><span>Offer to a neighbour or friend</span></li>
                <li className="flex items-start gap-2"><span>🏠</span><span>Post on your local community group</span></li>
                <li className="flex items-start gap-2"><span>🏦</span><span>Drop at a local food bank</span></li>
                <li className="flex items-start gap-2"><span>🐾</span><span>Check if safe for pets / composting</span></li>
              </ul>
              <button type="button"
                onClick={() => markAsShared(shareItem)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition"
                style={{ background: "rgba(34,197,94,0.85)", color: "#fff" }}
              >
                ✓ Mark as Shared — remove from pantry
              </button>
              <button type="button" onClick={() => setShareItem(null)}
                className="w-full py-1.5 text-xs text-center transition"
                style={{ color: "var(--muted)" }}
              >
                Keep in pantry for now
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
