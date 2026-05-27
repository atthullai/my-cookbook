"use client";

/**
 * KolamDivider — SVG geometric divider inspired by South Indian kolam patterns.
 *
 * A kolam is drawn by women at the threshold of Tamil homes at dawn — connecting dots
 * with flowing curves in a single unbroken motion. Here, we animate that drawing
 * ritual slowly and meditatively as a page divider.
 *
 * The geometry uses concentric diamonds with radiating dot-points — a common kolam
 * base grid simplified for digital use. Animation draws the lines slowly via
 * pathLength, then holds, giving the feeling of a just-drawn threshold pattern.
 */

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

// Kolam geometry — simplified 5-point star pattern inscribed in concentric diamonds
// Centred at cx=100, cy=40 for a horizontal divider layout
const KOLAM_PATHS = [
  // Outer diamond
  "M 100 8 L 136 40 L 100 72 L 64 40 Z",
  // Inner diamond (rotated 45°)
  "M 100 20 L 126 40 L 100 60 L 74 40 Z",
  // Horizontal axis line
  "M 52 40 L 148 40",
  // Vertical axis line
  "M 100 4 L 100 76",
  // Corner accent lines — top-right
  "M 100 8 L 136 40",
  // Decorative diagonal petals
  "M 83 23 Q 100 14 117 23",
  "M 117 57 Q 100 66 83 57",
  "M 68 40 Q 76 26 90 26",
  "M 110 54 Q 124 54 132 40",
];

// The 9 dot positions of a traditional 3×3 kolam grid (relative to the shape above)
const KOLAM_DOTS = [
  { cx: 100, cy: 8 },   // top
  { cx: 136, cy: 40 },  // right
  { cx: 100, cy: 72 },  // bottom
  { cx: 64,  cy: 40 },  // left
  { cx: 100, cy: 40 },  // centre
  { cx: 100, cy: 20 },  // inner top
  { cx: 126, cy: 40 },  // inner right
  { cx: 100, cy: 60 },  // inner bottom
  { cx: 74,  cy: 40 },  // inner left
];

interface KolamDividerProps {
  className?: string;
  /** Color of the kolam lines and dots */
  color?: string;
  /** Whether to animate in on scroll into view */
  animateOnView?: boolean;
  /** Slow the draw animation even more for contemplative loading states */
  slow?: boolean;
}

export default function KolamDivider({
  className = "",
  color = "rgba(200, 140, 30, 0.28)",
  animateOnView = true,
  slow = false,
}: KolamDividerProps) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const shouldAnimate = !animateOnView || inView;

  const duration = slow ? 5 : 3;

  return (
    <svg
      ref={ref}
      viewBox="0 0 200 80"
      className={`w-full max-w-xs mx-auto ${className}`}
      aria-hidden="true"
      style={{ overflow: "visible" }}
    >
      {/* Left wing — thin horizontal line with taper */}
      <motion.line
        x1="4" y1="40" x2="60" y2="40"
        stroke={color}
        strokeWidth="0.8"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={shouldAnimate ? { pathLength: 1, opacity: 1 } : {}}
        transition={{ duration: 1.2, delay: 0, ease: "easeOut" }}
      />

      {/* Right wing */}
      <motion.line
        x1="196" y1="40" x2="140" y2="40"
        stroke={color}
        strokeWidth="0.8"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={shouldAnimate ? { pathLength: 1, opacity: 1 } : {}}
        transition={{ duration: 1.2, delay: 0, ease: "easeOut" }}
      />

      {/* Kolam paths — each draws in with staggered delay */}
      {KOLAM_PATHS.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={i < 2 ? 0.9 : 0.7}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={shouldAnimate ? { pathLength: 1, opacity: 1 } : {}}
          transition={{
            pathLength: {
              duration: duration * (0.6 + i * 0.12),
              delay: i * 0.18,
              ease: [0.4, 0, 0.3, 1],
            },
            opacity: {
              duration: 0.4,
              delay: i * 0.18,
            },
          }}
        />
      ))}

      {/* Kolam dots — appear after paths are drawn */}
      {KOLAM_DOTS.map((dot, i) => (
        <motion.circle
          key={i}
          cx={dot.cx}
          cy={dot.cy}
          r={i === 4 ? 2.2 : 1.4} // centre dot slightly larger
          fill={color}
          initial={{ scale: 0, opacity: 0 }}
          animate={shouldAnimate ? { scale: 1, opacity: 1 } : {}}
          transition={{
            delay: duration * 0.55 + i * 0.06,
            duration: 0.4,
            ease: [0.34, 1.56, 0.64, 1],
          }}
        />
      ))}
    </svg>
  );
}
