"use client";

/**
 * TagBadge — animated recipe tag badge.
 *
 * Uses TAG_META from lib/recipe-tags.ts for colors and display copy.
 * Entrance: spring-pop from scale 0.8.
 * Hover: slight scale-up with border glow.
 *
 * Usage:
 *   <TagBadge tag="spicy" />
 *   <TagBadge tag="vegan" size="sm" />
 *   <TagBadge tag="quick" animated={false} />
 */
import { motion } from "framer-motion";
import type { RecipeTag } from "@/types";
import { TAG_META } from "@/lib/recipe-tags";

interface TagBadgeProps {
  tag:       RecipeTag;
  size?:     "sm" | "md";
  animated?: boolean;
}

export default function TagBadge({ tag, size = "md", animated = true }: TagBadgeProps) {
  const meta = TAG_META[tag];

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-xs gap-1"
      : "px-2.5 py-1 text-sm gap-1.5";

  const badge = (
    <span
      className={[
        "inline-flex items-center rounded-full font-medium border",
        sizeClasses,
        meta.color,
        meta.textColor,
        meta.borderColor,
      ].join(" ")}
      title={meta.description}
    >
      <span aria-hidden="true">{meta.emoji}</span>
      {meta.label}
    </span>
  );

  if (!animated) return badge;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      whileHover={{ scale: 1.06 }}
      className="inline-flex"
    >
      {badge}
    </motion.div>
  );
}
