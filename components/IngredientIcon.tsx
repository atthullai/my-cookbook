"use client";

/**
 * IngredientIcon — small visual icon for an ingredient or piece of equipment.
 *
 * Strategy:
 * 1. Look up the icon config via getIngredientIcon / getEquipmentIcon.
 * 2. Try to render the matching Lucide icon dynamically.
 *    Because Lucide has 1000+ icons and we can't statically import all of them,
 *    we keep a curated static map of the icons actually used in ingredient-icons.ts.
 * 3. Fall back to the emoji in a styled pill.
 *
 * Usage:
 *   <IngredientIcon name="garlic" />
 *   <IngredientIcon name="wok" type="equipment" size={20} />
 */
import {
  Leaf, Circle, Flame, Wheat, Fish, Egg, Box, GlassWater,
  Square, Pipette, Droplets, Apple, Banana, Zap, Filter,
  Wind, Scissors, Minus, Carrot, Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getIngredientIcon, getEquipmentIcon } from "@/lib/ingredient-icons";
import { resolveIngredientImage } from "@/lib/ingredient-images";

/** Curated static map of Lucide icons used in ingredient/equipment configs */
const LUCIDE_ICON_MAP: Record<string, LucideIcon> = {
  Leaf, Circle, Flame, Wheat, Fish, Egg, Box, GlassWater,
  Square, Pipette, Droplets, Apple, Banana, Zap, Filter,
  Wind, Scissors, Minus, Carrot, Wrench,
};

interface IngredientIconProps {
  name:  string;
  type?: "ingredient" | "equipment";
  /** Icon size in px */
  size?: number;
  className?: string;
}

export default function IngredientIcon({
  name,
  type = "ingredient",
  size = 16,
  className = "",
}: IngredientIconProps) {
  // Prefer the real cut-out icon when one matches (EN/DE/Tamil/Hindi aware).
  const imageSrc = type === "ingredient" ? resolveIngredientImage(name) : null;
  if (imageSrc) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full ${className}`}
        style={{ width: size + 8, height: size + 8, background: "#fff", overflow: "hidden", flexShrink: 0 }}
        title={name}
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageSrc} alt="" width={size + 4} height={size + 4} style={{ objectFit: "contain" }} loading="lazy" />
      </span>
    );
  }

  const config = type === "equipment"
    ? getEquipmentIcon(name)
    : getIngredientIcon(name);

  const LucideComponent = LUCIDE_ICON_MAP[config.lucide];

  if (LucideComponent) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full bg-white/10 p-1 ${className}`}
        title={name}
        aria-hidden="true"
      >
        <LucideComponent size={size} strokeWidth={1.5} />
      </span>
    );
  }

  // Emoji fallback
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-white/10 ${className}`}
      style={{ fontSize: size, width: size + 8, height: size + 8 }}
      title={name}
      aria-hidden="true"
    >
      {config.emoji}
    </span>
  );
}
