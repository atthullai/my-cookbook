"use client";

/**
 * CuisineHeroBanner — full-width hero banner for a cuisine origin.
 *
 * Applies the cuisine theme's heroGradient as background.
 * Shows a large emoji, localised label, and the one-line descriptor.
 * Animates in with the theme's heroVariants.
 * Uses a subtle repeating-dot SVG as an overlay pattern.
 *
 * Usage:
 *   <CuisineHeroBanner cuisine="indian-tamil-nadu" />
 */
import { motion } from "framer-motion";
import type { CuisineOrigin } from "@/types";
import { getCuisineTheme } from "@/lib/cuisine-themes";

interface CuisineHeroBannerProps {
  cuisine: CuisineOrigin | string;
  /** Optional override for the title shown below the label */
  title?:  string;
}

export default function CuisineHeroBanner({ cuisine, title }: CuisineHeroBannerProps) {
  const theme = getCuisineTheme(cuisine as CuisineOrigin);

  return (
    <motion.div
      variants={theme.heroVariants}
      initial="hidden"
      animate="visible"
      className={`relative w-full overflow-hidden rounded-2xl ${theme.heroGradient}`}
    >
      {/* Subtle dot-grid pattern overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center py-14 px-6 text-center gap-3">
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 20 }}
          className="text-6xl leading-none select-none"
          aria-hidden="true"
        >
          {theme.emoji}
        </motion.span>

        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="space-y-1"
        >
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${theme.textColor} opacity-70`}>
            {theme.label} Cuisine
          </p>
          {title && (
            <h1 className={`text-3xl sm:text-4xl font-bold leading-tight ${theme.headingColor}`}>
              {title}
            </h1>
          )}
          <p className={`text-sm sm:text-base italic ${theme.textColor} opacity-80 max-w-md mx-auto`}>
            {theme.descriptor}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
