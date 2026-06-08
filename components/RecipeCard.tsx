"use client";

/**
 * RecipeCard — clean recipe card matching the design reference.
 * Photo + bookmark (save) + ⋯ menu (Add to / Edit / Delete), title, "N ingredients · X min".
 * Used on Home, Discover and Library.
 */
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Pencil, Trash2, Bookmark, MoreHorizontal } from "lucide-react";
import type { RecipeSummary } from "@/types";
import { getCuisineTheme } from "@/lib/cuisine-themes";
import { useLibrary } from "@/components/LibraryProvider";
import AddToModal from "@/components/AddToModal";

interface RecipeCardProps {
  recipe:    RecipeSummary;
  onEdit?:   () => void;
  onDelete?: () => void;
}

export default function RecipeCard({ recipe, onEdit, onDelete }: RecipeCardProps) {
  const theme     = getCuisineTheme(recipe.cuisine);
  const totalMins = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
  const ingCount  = recipe.ingredientLinks?.filter((l) => l.name_en.trim()).length ?? 0;

  const [showAddTo, setShowAddTo] = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);

  const { isSaved, save, unsave } = useLibrary();
  const saved = isSaved(recipe.id);

  return (
    <>
      <div className="recipe-card">
        <Link href={`/recipe/${recipe.id}`} className="recipe-card-img" aria-label={recipe.title}>
          {recipe.imageUrl ? (
            <Image src={recipe.imageUrl} alt={recipe.title} width={400} height={240} className="recipe-card-photo"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div className={`recipe-card-fallback ${theme.cardGradient}`}>
              <span aria-hidden="true">{theme.emoji}</span>
            </div>
          )}
          <button
            type="button"
            className={saved ? "recipe-card-bookmark saved" : "recipe-card-bookmark"}
            aria-label={saved ? "Remove from Library" : "Save to Library"}
            aria-pressed={saved}
            onClick={(e) => { e.preventDefault(); if (saved) unsave(recipe.id); else save(recipe.id); }}
          >
            <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
          </button>
        </Link>

        <div className="recipe-card-body">
          <Link href={`/recipe/${recipe.id}`} className="recipe-card-title">{recipe.title}</Link>
          <div className="recipe-card-meta">
            {ingCount > 0 && <span>{ingCount} ingredient{ingCount === 1 ? "" : "s"}</span>}
            {ingCount > 0 && totalMins > 0 && <span aria-hidden="true">·</span>}
            {totalMins > 0 && <span>{totalMins} min</span>}
          </div>
        </div>

        <div className="recipe-card-menu">
          <button type="button" aria-label="More options" onClick={() => setMenuOpen((v) => !v)}>
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div className="recipe-card-menu-pop" onMouseLeave={() => setMenuOpen(false)}>
              <button type="button" onClick={() => { setMenuOpen(false); setShowAddTo(true); }}>Add to…</button>
              {onEdit && <button type="button" onClick={() => { setMenuOpen(false); onEdit(); }}><Pencil size={13} /> Edit</button>}
              {onDelete && <button type="button" className="danger" onClick={() => { setMenuOpen(false); onDelete(); }}><Trash2 size={13} /> Delete</button>}
            </div>
          )}
        </div>
      </div>

      {showAddTo && (
        <AddToModal recipeId={recipe.id} recipeTitle={recipe.title} onClose={() => setShowAddTo(false)} />
      )}
    </>
  );
}
