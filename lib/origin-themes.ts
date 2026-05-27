/**
 * Maps cuisine origin to design tokens:
 * - color palette (primary / accent / bg / cardBg)
 * - Framer Motion entrance animation variant name
 * - decorative pattern name (rendered in CSS / SVG by the consuming component)
 * - Google Font pairing (applied as fontFamily in inline styles)
 *
 * Usage:
 *   import { ORIGIN_THEMES } from '@/lib/origin-themes';
 *   const theme = ORIGIN_THEMES[recipe.origin ?? 'other'];
 */

export type CuisineOrigin =
  | "indian"
  | "italian"
  | "mexican"
  | "japanese"
  | "chinese"
  | "mediterranean"
  | "american"
  | "thai"
  | "french"
  | "other";

export type PatternName =
  | "rangoli"
  | "pasta"
  | "tile"
  | "sakura"
  | "cloud"
  | "olive"
  | "wave"
  | "stripe"
  | "fleur"
  | "none";

export type AnimationName =
  | "spice-burst"
  | "pasta-slide"
  | "fan-unfold"
  | "petal-fall"
  | "lantern-rise"
  | "olive-swirl"
  | "sunrise"
  | "wave-in"
  | "ribbon-fall"
  | "fade-up";

export interface OriginTheme {
  label:       string;
  flag:        string;
  primary:     string; // CSS hex — used for card header bg and accent borders
  accent:      string;
  bg:          string; // page background tint for a recipe detail page
  cardBg:      string; // card body background
  pattern:     PatternName;
  animation:   AnimationName;
  fontHeading: string; // Google Font name — load via next/font/google or a style tag
}

export const ORIGIN_THEMES: Record<CuisineOrigin, OriginTheme> = {
  indian: {
    label:       "Indian",
    flag:        "🇮🇳",
    primary:     "#C0392B",
    accent:      "#E67E22",
    bg:          "#FDF6F0",
    cardBg:      "#FFF8F3",
    pattern:     "rangoli",
    animation:   "spice-burst",
    fontHeading: "Playfair Display",
  },
  italian: {
    label:       "Italian",
    flag:        "🇮🇹",
    primary:     "#27AE60",
    accent:      "#C0392B",
    bg:          "#F9FBF9",
    cardBg:      "#FAFFF8",
    pattern:     "pasta",
    animation:   "pasta-slide",
    fontHeading: "Cormorant Garamond",
  },
  mexican: {
    label:       "Mexican",
    flag:        "🇲🇽",
    primary:     "#8E44AD",
    accent:      "#E74C3C",
    bg:          "#FDF4FF",
    cardBg:      "#FEF9FF",
    pattern:     "tile",
    animation:   "fan-unfold",
    fontHeading: "Josefin Sans",
  },
  japanese: {
    label:       "Japanese",
    flag:        "🇯🇵",
    primary:     "#C0392B",
    accent:      "#ECF0F1",
    bg:          "#FDF8F8",
    cardBg:      "#FFFAFA",
    pattern:     "sakura",
    animation:   "petal-fall",
    fontHeading: "Noto Serif JP",
  },
  chinese: {
    label:       "Chinese",
    flag:        "🇨🇳",
    primary:     "#E74C3C",
    accent:      "#F39C12",
    bg:          "#FFF9F0",
    cardBg:      "#FFFCF5",
    pattern:     "cloud",
    animation:   "lantern-rise",
    fontHeading: "Noto Serif SC",
  },
  mediterranean: {
    label:       "Mediterranean",
    flag:        "🌊",
    primary:     "#2980B9",
    accent:      "#27AE60",
    bg:          "#F0F8FF",
    cardBg:      "#F5FBFF",
    pattern:     "olive",
    animation:   "olive-swirl",
    fontHeading: "Lora",
  },
  american: {
    label:       "American",
    flag:        "🇺🇸",
    primary:     "#2C3E50",
    accent:      "#E74C3C",
    bg:          "#F8F9FA",
    cardBg:      "#FAFAFA",
    pattern:     "stripe",
    animation:   "sunrise",
    fontHeading: "Montserrat",
  },
  thai: {
    label:       "Thai",
    flag:        "🇹🇭",
    primary:     "#16A085",
    accent:      "#E74C3C",
    bg:          "#F0FFFE",
    cardBg:      "#F5FFFD",
    pattern:     "wave",
    animation:   "wave-in",
    fontHeading: "Sarabun",
  },
  french: {
    label:       "French",
    flag:        "🇫🇷",
    primary:     "#2C3E50",
    accent:      "#8E44AD",
    bg:          "#F9F9FC",
    cardBg:      "#FCFAFF",
    pattern:     "fleur",
    animation:   "ribbon-fall",
    fontHeading: "EB Garamond",
  },
  other: {
    label:       "Other",
    flag:        "🌍",
    primary:     "#7F8C8D",
    accent:      "#95A5A6",
    bg:          "#F8F9FA",
    cardBg:      "#FAFAFA",
    pattern:     "none",
    animation:   "fade-up",
    fontHeading: "Inter",
  },
};

/**
 * Returns the OriginTheme for a given cuisine origin string.
 * Safely falls back to 'other' for unknown or null values.
 */
export function getOriginTheme(origin: string | null | undefined): OriginTheme {
  return ORIGIN_THEMES[(origin ?? "other") as CuisineOrigin] ?? ORIGIN_THEMES.other;
}

/** List of all origins in display order (for filter dropdowns, etc.) */
export const ORIGIN_OPTIONS: Array<{ value: CuisineOrigin; label: string; flag: string }> =
  (Object.entries(ORIGIN_THEMES) as Array<[CuisineOrigin, OriginTheme]>).map(
    ([value, theme]) => ({ value, label: theme.label, flag: theme.flag })
  );
