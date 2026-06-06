"use client";

/**
 * RecipeCard — recipe card used on Discover (/recipes) and Library pages.
 *
 * Save flow:
 *  • Unsaved → [🔖 Save] button (top-right of image)
 *  • Saved   → [＋] button → opens AddToModal (Planner / Shopping / Collections)
 */
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Pencil, Trash2, Bookmark, Plus } from "lucide-react";
import type { RecipeSummary } from "@/types";
import { getCuisineTheme } from "@/lib/cuisine-themes";
import { getCardTags } from "@/lib/recipe-tags";
import TagBadge from "@/components/TagBadge";
import { calorieColor } from "@/lib/nutrition";
import { useLibrary } from "@/components/LibraryProvider";
import { usePantry } from "@/components/PantryProvider";
import { usePreferences } from "@/components/PreferencesProvider";
import { detectAllergens } from "@/lib/allergens";
import AddToModal from "@/components/AddToModal";

interface RecipeCardProps {
  recipe:        RecipeSummary;
  onEdit?:       () => void;
  onDelete?:     () => void;
  /** Legacy prop kept for backward compat — no-op now, Library handles state */
  onFavourite?:  (id: string, next: boolean) => void;
}

export default function RecipeCard({ recipe, onEdit, onDelete }: RecipeCardProps) {
  const theme      = getCuisineTheme(recipe.cuisine);
  const cardTags   = getCardTags(recipe.tags);
  const totalMins  = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
  const [hovered, setHovered] = useState(false);
  const [showAddTo, setShowAddTo] = useState(false);

  const { isSaved, save, unsave } = useLibrary();
  const saved = isSaved(recipe.id);

  // Pantry availability ("have N of M ingredients").
  const { ready: pantryReady, has: pantryHas } = usePantry();
  const ingLinks = recipe.ingredientLinks?.filter((l) => l.name_en.trim()) ?? [];
  const haveCount = pantryReady ? ingLinks.filter((l) => pantryHas(l)).length : 0;
  const showAvail = pantryReady && ingLinks.length > 0;
  const allAvail = showAvail && haveCount === ingLinks.length;

  // Allergen warning: does this recipe contain one of the user's allergens?
  const { prefs } = usePreferences();
  const myAllergenHits = prefs.allergies.length > 0
    ? detectAllergens(ingLinks.map((l) => l.name_en)).filter((a) => prefs.allergies.includes(a))
    : [];

  function handleSaveClick(e: React.MouseEvent) {
    e.preventDefault();
    if (saved) {
      unsave(recipe.id);
    } else {
      save(recipe.id);
    }
  }

  function handleAddToClick(e: React.MouseEvent) {
    e.preventDefault();
    setShowAddTo(true);
  }

  return (
    <>
      <motion.div
        variants={theme.cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        className="rounded-2xl overflow-hidden shadow-md flex flex-col"
        style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
      >
        {/* ── Image / gradient header ──────────────────────────────────── */}
        <Link href={`/recipe/${recipe.id}`} className="block relative">
          {recipe.imageUrl ? (
            <Image
              src={recipe.imageUrl}
              alt={recipe.title}
              width={400}
              height={160}
              className="w-full h-36 object-cover"
            />
          ) : (
            <div className={`h-24 flex items-center justify-center ${theme.cardGradient}`}>
              <span className="text-5xl" aria-hidden="true">{theme.emoji}</span>
            </div>
          )}

          {/* Cuisine label pill */}
          <span
            className={`absolute bottom-2 left-2 text-[11px] font-medium px-2 py-0.5 rounded-full ${theme.accentBg} ${theme.accentText}`}
          >
            {theme.emoji} {theme.label}
          </span>

          {/* Allergen warning */}
          {myAllergenHits.length > 0 && (
            <span className="absolute top-2 left-2 text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(192,57,43,0.92)", color: "#fff" }}
              title={`Contains: ${myAllergenHits.join(", ")}`}>
              ⚠ allergen
            </span>
          )}

          {/* Pantry availability pill */}
          {showAvail && (
            <span
              className="absolute bottom-2 right-2 text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: allAvail ? "rgba(102,116,69,0.92)" : "rgba(30,20,10,0.7)",
                color: "#fff",
              }}
              title={`You have ${haveCount} of ${ingLinks.length} ingredients`}
            >
              {allAvail ? "✓ have all" : `${haveCount}/${ingLinks.length} in pantry`}
            </span>
          )}

          {/* Save / Add-to button — inline position for reliability */}
          {saved ? (
            <button
              type="button"
              onClick={handleAddToClick}
              className="recipe-card-save-btn recipe-card-save-btn--saved"
              style={{ position: "absolute", top: 8, right: 8 }}
              aria-label="Add to…"
            >
              <Plus size={13} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveClick}
              className="recipe-card-save-btn"
              style={{ position: "absolute", top: 8, right: 8 }}
              aria-label="Save to Library"
            >
              <Bookmark size={13} />
              <span className="recipe-card-save-label">Save</span>
            </button>
          )}
        </Link>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <div className="p-3 flex flex-col flex-1 gap-2">
          <Link href={`/recipe/${recipe.id}`}>
            <h3 className="font-semibold text-sm leading-snug line-clamp-2 transition-colors" style={{ color: "var(--foreground)" }}>
              {recipe.title}
            </h3>
          </Link>

          {cardTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {cardTags.map((tag) => (
                <TagBadge key={tag} tag={tag} size="sm" animated={false} />
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 text-xs mt-auto pt-2 border-t" style={{ color: "var(--muted)", borderColor: "var(--border)" }}>
            {totalMins > 0 && (
              <span className="flex items-center gap-1">
                <span aria-hidden="true">🕐</span>
                {totalMins} min
              </span>
            )}
            {recipe.servings > 0 && (
              <span className="flex items-center gap-1">
                <span aria-hidden="true">👤</span>
                {recipe.servings}
              </span>
            )}
            {recipe.nutrition && (
              <span className={`flex items-center gap-1 font-medium ${calorieColor(recipe.nutrition.calories)}`}>
                <span aria-hidden="true">🔥</span>
                {Math.round(recipe.nutrition.calories)} kcal
              </span>
            )}
          </div>

          {(onEdit || onDelete) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: hovered ? 1 : 0, height: hovered ? "auto" : 0 }}
              transition={{ duration: 0.15 }}
              className="flex gap-2 overflow-hidden"
            >
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded-lg border transition"
                  style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                >
                  <Pencil size={11} /> Edit
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition"
                >
                  <Trash2 size={11} /> Delete
                </button>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {showAddTo && (
        <AddToModal
          recipeId={recipe.id}
          recipeTitle={recipe.title}
          onClose={() => setShowAddTo(false)}
        />
      )}
    </>
  );
}
