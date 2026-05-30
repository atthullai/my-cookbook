/**
 * Visual identity system for every cuisine origin.
 *
 * getCuisineTheme(cuisine) returns the full CuisineTheme for a given origin,
 * including Tailwind gradient classes, color tokens, Framer Motion variants,
 * and a one-line culinary descriptor.
 *
 * Usage:
 *   import { getCuisineTheme } from "@/lib/cuisine-themes";
 *   const theme = getCuisineTheme("indian-tamil-nadu");
 *   <div className={theme.cardGradient}>…</div>
 */

import type { Variants } from "framer-motion";
import type { CuisineOrigin } from "@/types";

export type MotionVariants = Variants;

export interface CuisineTheme {
  label: string;
  emoji: string;
  /** Tailwind gradient for recipe cards */
  cardGradient: string;
  /** Tailwind gradient for hero banners */
  heroGradient: string;
  headingColor: string;
  textColor: string;
  borderColor: string;
  accentBg: string;
  accentText: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  /** Framer Motion variants for card entrance */
  cardVariants: MotionVariants;
  /** Framer Motion variants for hero entrance */
  heroVariants: MotionVariants;
  /** One-line descriptor for About page / tooltips */
  descriptor: string;
  /** Key used to pick a CSS SVG background pattern */
  patternKey: string;
}

// ── Reusable animation presets ─────────────────────────────────────────────
const fadeSlideUp: MotionVariants = {
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};
const fadeSlideRight: MotionVariants = {
  hidden:  { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
};
const scaleIn: MotionVariants = {
  hidden:  { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: [0.34, 1.56, 0.64, 1] } },
};
const rotateIn: MotionVariants = {
  hidden:  { opacity: 0, rotate: -6, scale: 0.92 },
  visible: { opacity: 1, rotate: 0, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
};
const waveIn: MotionVariants = {
  hidden:  { opacity: 0, y: 20, scaleX: 0.96 },
  visible: { opacity: 1, y: 0, scaleX: 1, transition: { duration: 0.6, ease: "easeOut" } },
};
const lanternSwing: MotionVariants = {
  hidden:  { opacity: 0, rotate: -10 },
  visible: { opacity: 1, rotate: 0, transition: { duration: 0.7, type: "spring", stiffness: 80 } },
};
const waltzSpin: MotionVariants = {
  hidden:  { opacity: 0, rotate: 4, scale: 0.94 },
  visible: { opacity: 1, rotate: 0, scale: 1, transition: { duration: 0.65, ease: "easeOut" } },
};
const sakuraDrop: MotionVariants = {
  hidden:  { opacity: 0, y: -20, rotate: 8 },
  visible: { opacity: 1, y: 0, rotate: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const confettiBurst: MotionVariants = {
  hidden:  { opacity: 0, scale: 0.8, rotate: -4 },
  visible: { opacity: 1, scale: 1, rotate: 0, transition: { duration: 0.5, type: "spring", stiffness: 120 } },
};
const templeReveal: MotionVariants = {
  hidden:  { opacity: 0, scaleY: 0.85, y: 16 },
  visible: { opacity: 1, scaleY: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};
const sandSwirl: MotionVariants = {
  hidden:  { opacity: 0, x: 20, rotate: 3 },
  visible: { opacity: 1, x: 0, rotate: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const riverWave: MotionVariants = {
  hidden:  { opacity: 0, x: -16, scaleX: 0.94 },
  visible: { opacity: 1, x: 0, scaleX: 1, transition: { duration: 0.55, ease: "easeOut" } },
};

// ── Full theme map ─────────────────────────────────────────────────────────
export const CUISINE_THEMES: Record<CuisineOrigin, CuisineTheme> = {
  // Indian regional
  "indian-tamil-nadu": {
    label: "Tamil Nadu", emoji: "🌺",
    cardGradient: "bg-gradient-to-br from-rose-900 via-amber-800 to-yellow-700",
    heroGradient: "bg-gradient-to-r from-rose-950 via-red-900 to-amber-800",
    headingColor: "text-amber-200", textColor: "text-amber-100",
    borderColor: "border-rose-700", accentBg: "bg-rose-800", accentText: "text-amber-100",
    palette: { primary: "#9B1C1C", secondary: "#92400E", accent: "#FCD34D", background: "#1C0A00" },
    cardVariants: templeReveal, heroVariants: fadeSlideRight,
    descriptor: "Temple spices, kolam floors & Chettinad fire", patternKey: "kolam",
  },
  "indian-andhra": {
    label: "Andhra Pradesh / Telangana", emoji: "🌶️",
    cardGradient: "bg-gradient-to-br from-red-900 via-orange-800 to-yellow-600",
    heroGradient: "bg-gradient-to-r from-red-950 via-red-800 to-orange-700",
    headingColor: "text-yellow-200", textColor: "text-orange-100",
    borderColor: "border-red-700", accentBg: "bg-red-800", accentText: "text-yellow-100",
    palette: { primary: "#7F1D1D", secondary: "#C2410C", accent: "#FDE68A", background: "#1A0500" },
    cardVariants: confettiBurst, heroVariants: fadeSlideRight,
    descriptor: "Bold Deccan fire — Guntur chillies & tangy tamarind", patternKey: "kalamkari",
  },
  "indian-karnataka": {
    label: "Karnataka", emoji: "🌻",
    cardGradient: "bg-gradient-to-br from-yellow-800 via-amber-700 to-red-700",
    heroGradient: "bg-gradient-to-r from-yellow-900 via-amber-800 to-red-800",
    headingColor: "text-yellow-100", textColor: "text-amber-100",
    borderColor: "border-yellow-700", accentBg: "bg-amber-700", accentText: "text-yellow-100",
    palette: { primary: "#92400E", secondary: "#B45309", accent: "#FDE68A", background: "#1C1000" },
    cardVariants: fadeSlideUp, heroVariants: fadeSlideUp,
    descriptor: "Mysore grandeur, Udupi purity & coastal coconut", patternKey: "mysore-silk",
  },
  "indian-kerala": {
    label: "Kerala", emoji: "🥥",
    cardGradient: "bg-gradient-to-br from-green-900 via-emerald-800 to-teal-700",
    heroGradient: "bg-gradient-to-r from-green-950 via-green-800 to-teal-700",
    headingColor: "text-emerald-200", textColor: "text-green-100",
    borderColor: "border-green-700", accentBg: "bg-emerald-800", accentText: "text-green-100",
    palette: { primary: "#064E3B", secondary: "#065F46", accent: "#FCD34D", background: "#022C22" },
    cardVariants: waveIn, heroVariants: waveIn,
    descriptor: "Backwater serenity, coconut richness & sadya feasts", patternKey: "backwater-ripple",
  },
  "indian-north": {
    label: "North Indian", emoji: "🫓",
    cardGradient: "bg-gradient-to-br from-orange-900 via-amber-700 to-yellow-600",
    heroGradient: "bg-gradient-to-r from-orange-950 via-amber-800 to-yellow-700",
    headingColor: "text-amber-200", textColor: "text-orange-100",
    borderColor: "border-orange-700", accentBg: "bg-orange-700", accentText: "text-amber-100",
    palette: { primary: "#9A3412", secondary: "#92400E", accent: "#FDE68A", background: "#1C0A00" },
    cardVariants: fadeSlideUp, heroVariants: fadeSlideUp,
    descriptor: "Mughal richness, tandoor warmth & creamy gravies", patternKey: "mughal-arch",
  },
  "indian-rajasthan": {
    label: "Rajasthan", emoji: "🏜️",
    cardGradient: "bg-gradient-to-br from-amber-800 via-yellow-700 to-orange-600",
    heroGradient: "bg-gradient-to-r from-amber-900 via-yellow-800 to-orange-700",
    headingColor: "text-yellow-100", textColor: "text-amber-100",
    borderColor: "border-amber-600", accentBg: "bg-yellow-700", accentText: "text-amber-100",
    palette: { primary: "#92400E", secondary: "#3730A3", accent: "#FDE68A", background: "#1C1000" },
    cardVariants: sandSwirl, heroVariants: sandSwirl,
    descriptor: "Desert gold, royal Rajput feasts & village hearths", patternKey: "leheriya",
  },
  "indian-bengal": {
    label: "Bengali", emoji: "🐟",
    cardGradient: "bg-gradient-to-br from-yellow-700 via-amber-600 to-red-700",
    heroGradient: "bg-gradient-to-r from-yellow-800 via-amber-700 to-red-700",
    headingColor: "text-yellow-100", textColor: "text-amber-100",
    borderColor: "border-yellow-600", accentBg: "bg-yellow-700", accentText: "text-red-100",
    palette: { primary: "#92400E", secondary: "#991B1B", accent: "#FDE68A", background: "#1A0E00" },
    cardVariants: riverWave, heroVariants: riverWave,
    descriptor: "Mustard oil, mishti doi & river fish poetry", patternKey: "kantha",
  },
  "indian-goa": {
    label: "Goan", emoji: "🌊",
    cardGradient: "bg-gradient-to-br from-orange-700 via-red-600 to-pink-600",
    heroGradient: "bg-gradient-to-r from-orange-800 via-red-700 to-pink-700",
    headingColor: "text-orange-100", textColor: "text-pink-100",
    borderColor: "border-orange-500", accentBg: "bg-red-600", accentText: "text-orange-100",
    palette: { primary: "#C2410C", secondary: "#9D174D", accent: "#FCD34D", background: "#1A0500" },
    cardVariants: confettiBurst, heroVariants: confettiBurst,
    descriptor: "Coastal vindaloo, Portuguese spice & beach sunsets", patternKey: "azulejo",
  },
  "indian-maharashtra": {
    label: "Maharashtrian", emoji: "🥜",
    cardGradient: "bg-gradient-to-br from-orange-800 via-amber-700 to-yellow-600",
    heroGradient: "bg-gradient-to-r from-orange-900 via-amber-800 to-yellow-700",
    headingColor: "text-amber-100", textColor: "text-orange-100",
    borderColor: "border-orange-600", accentBg: "bg-amber-700", accentText: "text-orange-100",
    palette: { primary: "#C2410C", secondary: "#92400E", accent: "#FDE68A", background: "#1C0800" },
    cardVariants: fadeSlideUp, heroVariants: fadeSlideUp,
    descriptor: "Vada pav grit, Kolhapuri fire & Konkan seas", patternKey: "warli",
  },
  "indian-gujarat": {
    label: "Gujarati", emoji: "🎨",
    cardGradient: "bg-gradient-to-br from-pink-700 via-fuchsia-700 to-purple-700",
    heroGradient: "bg-gradient-to-r from-pink-800 via-fuchsia-800 to-purple-800",
    headingColor: "text-pink-100", textColor: "text-fuchsia-100",
    borderColor: "border-pink-500", accentBg: "bg-fuchsia-700", accentText: "text-pink-100",
    palette: { primary: "#9D174D", secondary: "#7E22CE", accent: "#FDE68A", background: "#180020" },
    cardVariants: rotateIn, heroVariants: rotateIn,
    descriptor: "Sweet, salty & the rainbow of the Rann of Kutch", patternKey: "bandhani",
  },
  // European
  german: {
    label: "German", emoji: "🥨",
    cardGradient: "bg-gradient-to-br from-stone-800 via-amber-900 to-yellow-800",
    heroGradient: "bg-gradient-to-r from-stone-900 via-amber-900 to-yellow-900",
    headingColor: "text-amber-200", textColor: "text-stone-200",
    borderColor: "border-stone-600", accentBg: "bg-amber-800", accentText: "text-amber-100",
    palette: { primary: "#292524", secondary: "#92400E", accent: "#D97706", background: "#0C0A09" },
    cardVariants: scaleIn, heroVariants: fadeSlideUp,
    descriptor: "Forest-smoked comfort, pretzels & hearty Bavarian tradition", patternKey: "bavarian-diamond",
  },
  austrian: {
    label: "Austrian", emoji: "🎼",
    cardGradient: "bg-gradient-to-br from-red-900 via-stone-800 to-zinc-700",
    heroGradient: "bg-gradient-to-r from-red-950 via-stone-800 to-zinc-700",
    headingColor: "text-red-200", textColor: "text-stone-200",
    borderColor: "border-red-700", accentBg: "bg-red-800", accentText: "text-stone-100",
    palette: { primary: "#7F1D1D", secondary: "#292524", accent: "#E5E7EB", background: "#0C0505" },
    cardVariants: waltzSpin, heroVariants: waltzSpin,
    descriptor: "Imperial elegance, Viennese pastry & alpine warmth", patternKey: "biedermeier",
  },
  french: {
    label: "French", emoji: "🥐",
    cardGradient: "bg-gradient-to-br from-slate-800 via-blue-900 to-rose-900",
    heroGradient: "bg-gradient-to-r from-slate-900 via-blue-900 to-rose-900",
    headingColor: "text-rose-200", textColor: "text-slate-200",
    borderColor: "border-blue-700", accentBg: "bg-rose-800", accentText: "text-rose-100",
    palette: { primary: "#1E3A5F", secondary: "#881337", accent: "#F9FAFB", background: "#050810" },
    cardVariants: fadeSlideUp, heroVariants: fadeSlideUp,
    descriptor: "Refined sauces, Parisian bistro soul & butter philosophy", patternKey: "fleur-de-lis",
  },
  italian: {
    label: "Italian", emoji: "🍝",
    cardGradient: "bg-gradient-to-br from-red-800 via-orange-800 to-yellow-700",
    heroGradient: "bg-gradient-to-r from-red-900 via-orange-800 to-yellow-800",
    headingColor: "text-orange-100", textColor: "text-red-100",
    borderColor: "border-red-600", accentBg: "bg-orange-700", accentText: "text-orange-100",
    palette: { primary: "#991B1B", secondary: "#C2410C", accent: "#FDE68A", background: "#1A0500" },
    cardVariants: fadeSlideUp, heroVariants: fadeSlideRight,
    descriptor: "Rustic Sunday ragù, fresh pasta & la dolce vita", patternKey: "roman-arch",
  },
  // Asian
  chinese: {
    label: "Chinese", emoji: "🏮",
    cardGradient: "bg-gradient-to-br from-red-900 via-rose-800 to-amber-700",
    heroGradient: "bg-gradient-to-r from-red-950 via-red-800 to-amber-700",
    headingColor: "text-amber-200", textColor: "text-red-100",
    borderColor: "border-red-600", accentBg: "bg-red-700", accentText: "text-amber-100",
    palette: { primary: "#7F1D1D", secondary: "#92400E", accent: "#FCD34D", background: "#0C0000" },
    cardVariants: lanternSwing, heroVariants: lanternSwing,
    descriptor: "Lantern-lit woks, dim sum delicacy & ancient spice routes", patternKey: "chinese-lattice",
  },
  japanese: {
    label: "Japanese", emoji: "🌸",
    cardGradient: "bg-gradient-to-br from-slate-800 via-zinc-700 to-rose-800",
    heroGradient: "bg-gradient-to-r from-slate-900 via-zinc-800 to-rose-800",
    headingColor: "text-rose-200", textColor: "text-slate-200",
    borderColor: "border-rose-700", accentBg: "bg-rose-800", accentText: "text-rose-100",
    palette: { primary: "#1F2937", secondary: "#9F1239", accent: "#FDE8D8", background: "#030712" },
    cardVariants: sakuraDrop, heroVariants: sakuraDrop,
    descriptor: "Minimalist umami, sakura precision & wabi-sabi flavour", patternKey: "seigaiha",
  },
  thai: {
    label: "Thai", emoji: "🍜",
    cardGradient: "bg-gradient-to-br from-green-800 via-teal-700 to-yellow-700",
    heroGradient: "bg-gradient-to-r from-green-900 via-teal-800 to-yellow-800",
    headingColor: "text-green-100", textColor: "text-teal-100",
    borderColor: "border-green-600", accentBg: "bg-teal-700", accentText: "text-green-100",
    palette: { primary: "#065F46", secondary: "#0F766E", accent: "#FDE68A", background: "#021207" },
    cardVariants: waveIn, heroVariants: waveIn,
    descriptor: "Lemongrass thunder, lime leaf balance & coconut velvet", patternKey: "thai-lotus",
  },
  // Americas
  mexican: {
    label: "Mexican", emoji: "🌮",
    cardGradient: "bg-gradient-to-br from-orange-700 via-yellow-600 to-green-700",
    heroGradient: "bg-gradient-to-r from-orange-800 via-yellow-700 to-green-800",
    headingColor: "text-yellow-100", textColor: "text-orange-100",
    borderColor: "border-orange-500", accentBg: "bg-yellow-600", accentText: "text-orange-100",
    palette: { primary: "#C2410C", secondary: "#15803D", accent: "#FDE68A", background: "#1A0A00" },
    cardVariants: confettiBurst, heroVariants: confettiBurst,
    descriptor: "Mole depth, Aztec roots & fiesta colour on every plate", patternKey: "aztec-geo",
  },
  american: {
    label: "American", emoji: "🍔",
    cardGradient: "bg-gradient-to-br from-blue-900 via-red-800 to-stone-700",
    heroGradient: "bg-gradient-to-r from-blue-950 via-red-900 to-stone-800",
    headingColor: "text-blue-100", textColor: "text-stone-200",
    borderColor: "border-blue-700", accentBg: "bg-red-700", accentText: "text-blue-100",
    palette: { primary: "#1E3A5F", secondary: "#7F1D1D", accent: "#E5E7EB", background: "#020509" },
    cardVariants: scaleIn, heroVariants: fadeSlideUp,
    descriptor: "Bold, unapologetic comfort — BBQ smoke & heartland soul", patternKey: "stars-stripes",
  },
  other: {
    label: "World Kitchen", emoji: "🌍",
    cardGradient: "bg-gradient-to-br from-stone-800 via-zinc-700 to-slate-700",
    heroGradient: "bg-gradient-to-r from-stone-900 via-zinc-800 to-slate-800",
    headingColor: "text-stone-200", textColor: "text-zinc-200",
    borderColor: "border-stone-600", accentBg: "bg-stone-700", accentText: "text-stone-100",
    palette: { primary: "#292524", secondary: "#44403C", accent: "#D6D3D1", background: "#0C0A09" },
    cardVariants: fadeSlideUp, heroVariants: fadeSlideUp,
    descriptor: "Every corner of the globe, one treasured plate", patternKey: "world-dots",
  },
};

/**
 * Returns the CuisineTheme for a given origin, falling back to "other" for unknown values.
 */
export function getCuisineTheme(cuisine: CuisineOrigin | string): CuisineTheme {
  return CUISINE_THEMES[cuisine as CuisineOrigin] ?? CUISINE_THEMES["other"];
}

/**
 * Lazy-built reverse map: human-readable label → CuisineOrigin key.
 * Used to heal legacy data saved with getCuisineTheme().label instead of the raw key.
 * e.g. "Tamil Nadu" → "indian-tamil-nadu", "World Kitchen" → "other"
 */
let _labelToKey: Map<string, CuisineOrigin> | null = null;
function getLabelToKeyMap(): Map<string, CuisineOrigin> {
  if (!_labelToKey) {
    _labelToKey = new Map();
    for (const [key, theme] of Object.entries(CUISINE_THEMES) as [CuisineOrigin, CuisineTheme][]) {
      _labelToKey.set(theme.label.toLowerCase(), key);
    }
  }
  return _labelToKey;
}

/**
 * Normalizes a cuisine value to a valid CuisineOrigin key.
 * Accepts both valid keys ("indian-tamil-nadu") and the legacy human-readable
 * labels that were incorrectly stored before the add-page bug was fixed
 * ("Tamil Nadu", "World Kitchen", etc.). Falls back to "other".
 */
export function normalizeCuisineToKey(value: string | null | undefined): CuisineOrigin {
  if (!value) return "other";
  // Already a valid key?
  if (value in CUISINE_THEMES) return value as CuisineOrigin;
  // Try case-insensitive label match (heals legacy label data)
  const fromLabel = getLabelToKeyMap().get(value.toLowerCase());
  if (fromLabel) return fromLabel;
  return "other";
}

/** Indian regional origins in display order */
export const INDIAN_CUISINE_ORIGINS: CuisineOrigin[] = [
  "indian-tamil-nadu", "indian-andhra", "indian-karnataka", "indian-kerala",
  "indian-north", "indian-rajasthan", "indian-bengal", "indian-goa",
  "indian-maharashtra", "indian-gujarat",
];

/** All origins in display order (Indian first, then global) */
export const ALL_CUISINE_ORIGINS: CuisineOrigin[] = [
  ...INDIAN_CUISINE_ORIGINS,
  "german", "austrian", "french", "italian",
  "chinese", "japanese", "thai",
  "mexican", "american", "other",
];
