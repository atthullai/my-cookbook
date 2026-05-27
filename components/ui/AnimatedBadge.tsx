"use client";

/**
 * AnimatedBadge
 * Animated recipe tag badge used on recipe cards and detail pages.
 *
 * Renders a spring-pop entrance on mount.
 * Badges marked pulse:true animate their icon on a slow loop
 * (e.g. 🌶️ for Spicy, 💪 for High Protein).
 *
 * Usage:
 *   <AnimatedBadge type="spicy" />
 *   <AnimatedBadge type="vegan" />
 *
 * Complements the existing BadgeChip component — use AnimatedBadge
 * for recipe cards / Phase 2 UI; BadgeChip for the legacy recipe form.
 */
import { motion } from "framer-motion";

export type AnimatedBadgeType =
  | "spicy"
  | "veg"
  | "vegan"
  | "protein"
  | "quick"
  | "festive"
  | "diabetic_friendly";

interface BadgeConfig {
  label: string;
  icon:  string;
  bg:    string;
  text:  string;
  pulse: boolean;
}

const BADGE_CONFIG: Record<AnimatedBadgeType, BadgeConfig> = {
  spicy:             { label: "Spicy",             icon: "🌶️", bg: "#FFF0EE", text: "#C0392B", pulse: true  },
  veg:               { label: "Veg",               icon: "🌿", bg: "#EFFFEF", text: "#27AE60", pulse: false },
  vegan:             { label: "Vegan",             icon: "🌱", bg: "#EFFFEF", text: "#1E8449", pulse: false },
  protein:           { label: "High Protein",      icon: "💪", bg: "#EEF0FF", text: "#2C3E7A", pulse: true  },
  quick:             { label: "Quick",             icon: "⚡", bg: "#FFF9E6", text: "#B7770D", pulse: false },
  festive:           { label: "Festive",           icon: "🎉", bg: "#FFF0FB", text: "#8E2FAA", pulse: true  },
  diabetic_friendly: { label: "Diabetic Friendly", icon: "💙", bg: "#EEF8FF", text: "#1A6FA0", pulse: false },
};

interface AnimatedBadgeProps {
  type: AnimatedBadgeType;
}

export function AnimatedBadge({ type }: AnimatedBadgeProps) {
  const cfg = BADGE_CONFIG[type];

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      style={{ background: cfg.bg, color: cfg.text }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium select-none"
    >
      <motion.span
        animate={cfg.pulse ? { scale: [1, 1.2, 1] } : {}}
        transition={cfg.pulse ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : {}}
        aria-hidden="true"
      >
        {cfg.icon}
      </motion.span>
      {cfg.label}
    </motion.span>
  );
}
