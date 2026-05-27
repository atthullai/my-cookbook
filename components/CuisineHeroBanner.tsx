"use client";

/**
 * CuisineHeroBanner — full-width hero banner for a cuisine origin.
 *
 * Applies the cuisine theme's heroGradient as background.
 * Shows a large emoji, localised label, and the one-line descriptor.
 * Animates in with the theme's heroVariants.
 * Uses a subtle repeating-dot SVG as an overlay pattern.
 * Indian cuisines get ambient steam wisps. Tamil Nadu gets a kolam dot accent.
 *
 * Usage:
 *   <CuisineHeroBanner cuisine="indian-tamil-nadu" />
 */
import { motion } from "framer-motion";
import type { CuisineOrigin } from "@/types";
import { getCuisineTheme, INDIAN_CUISINE_ORIGINS } from "@/lib/cuisine-themes";
import SteamWisps from "./SteamWisps";

// Cuisines with hot liquid dishes that warrant a steam effect
const STEAMY_CUISINES = new Set<string>([
  ...INDIAN_CUISINE_ORIGINS,
  "japanese", "chinese", "vietnamese", "thai", "korean",
  "turkish", "moroccan", "persian", "ethiopian",
]);

interface CuisineHeroBannerProps {
  cuisine: CuisineOrigin | string;
  /** Optional override for the title shown below the label */
  title?:  string;
}

export default function CuisineHeroBanner({ cuisine, title }: CuisineHeroBannerProps) {
  const theme = getCuisineTheme(cuisine as CuisineOrigin);
  const hasSteam = STEAMY_CUISINES.has(cuisine);
  const isTamilNadu = cuisine === "indian-tamil-nadu";

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

      {/* Steam wisps — for hot/liquid cuisines, rising from the centre-bottom */}
      {hasSteam && (
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ zIndex: 2 }}
        >
          <SteamWisps
            width={180}
            height={110}
            count={isTamilNadu ? 5 : 3}
            intensity={isTamilNadu ? 0.55 : 0.35}
          />
        </div>
      )}

      {/* Tamil Nadu: subtle kolam dot accent in bottom-left */}
      {isTamilNadu && (
        <svg
          aria-hidden="true"
          className="absolute bottom-3 left-4 pointer-events-none opacity-30"
          width="64"
          height="64"
          viewBox="0 0 64 64"
          style={{ zIndex: 3 }}
        >
          {/* 3×3 kolam base grid */}
          {[16,32,48].flatMap((x) =>
            [16,32,48].map((y) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill="rgba(212,160,23,0.9)" />
            ))
          )}
          {/* Connecting lines */}
          <line x1="16" y1="16" x2="48" y2="48" stroke="rgba(212,160,23,0.5)" strokeWidth="0.8" />
          <line x1="48" y1="16" x2="16" y2="48" stroke="rgba(212,160,23,0.5)" strokeWidth="0.8" />
          <line x1="16" y1="32" x2="48" y2="32" stroke="rgba(212,160,23,0.5)" strokeWidth="0.8" />
          <line x1="32" y1="16" x2="32" y2="48" stroke="rgba(212,160,23,0.5)" strokeWidth="0.8" />
        </svg>
      )}

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
