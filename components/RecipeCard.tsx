"use client";

/**
 * RecipeCard — the core recipe card used on the /recipes listing page
 * and the meal planner sidebar.
 *
 * Visual structure (dark gradient header + white body):
 * ┌────────────────────────────────────────┐
 * │ [cuisine gradient + emoji + label]     │
 * │  ♡ (favourite)     ✏ 🗑 (actions)     │
 * ├────────────────────────────────────────┤
 * │ Recipe title                           │
 * │ [Tag badges — up to 4]                 │
 * │ ─────────────────────────────────────  │
 * │ 🕐 25 min  👤 4 servings  🔥 320 kcal  │
 * └────────────────────────────────────────┘
 *
 * Clicking the card navigates to /recipes/[id].
 * Edit and delete buttons appear on hover.
 * Uses the cuisine theme's cardVariants for Framer Motion entrance.
 */
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Pencil, Trash2, Heart } from "lucide-react";
import type { RecipeSummary } from "@/types";
import { getCuisineTheme } from "@/lib/cuisine-themes";
import { getCardTags } from "@/lib/recipe-tags";
import TagBadge from "@/components/TagBadge";
import { calorieColor } from "@/lib/nutrition";

interface RecipeCardProps {
  recipe:        RecipeSummary;
  onEdit?:       () => void;
  onDelete?:     () => void;
  onFavourite?:  (id: string, next: boolean) => void;
}

export default function RecipeCard({ recipe, onEdit, onDelete, onFavourite }: RecipeCardProps) {
  const theme      = getCuisineTheme(recipe.cuisine);
  const cardTags   = getCardTags(recipe.tags);
  const totalMins  = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
  const [hovered, setHovered] = useState(false);
  const [isFav, setIsFav] = useState(recipe.isFavourite);

  return (
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
      {/* ── Gradient header ─────────────────────────────────────────── */}
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

        {/* Favourite heart */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            const next = !isFav;
            setIsFav(next);
            onFavourite?.(recipe.id, next);
          }}
          className="absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition"
          style={{ background: "rgba(255,255,255,0.80)" }}
          aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
        >
          <Heart
            size={14}
            className={isFav ? "fill-red-500 stroke-red-500" : "stroke-gray-400"}
          />
        </button>
      </Link>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div className="p-3 flex flex-col flex-1 gap-2">
        {/* Title */}
        <Link href={`/recipe/${recipe.id}`}>
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 transition-colors" style={{ color: "var(--foreground)" }}>
            {recipe.title}
          </h3>
        </Link>

        {/* Tags */}
        {cardTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {cardTags.map((tag) => (
              <TagBadge key={tag} tag={tag} size="sm" animated={false} />
            ))}
          </div>
        )}

        {/* Meta strip */}
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

        {/* Action buttons — appear on hover */}
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
  );
}
