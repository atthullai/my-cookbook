"use client";

/**
 * SteamWisps — organic, cinematic steam rising from a heat source.
 *
 * Designed for Tamil Nadu kitchen atmosphere: meditative, slow, natural.
 * Each wisp follows an organic S-curve path at a different speed and phase.
 * Meant to feel like watching steam rise from a simmering vessel in early morning.
 */

import { motion } from "framer-motion";

// Each wisp has a fixed organic path (S-curve) and animates:
//   pathLength: draws in from 0 → 1 → 0 (so it appears and dissolves)
//   opacity: fades in and out gently
//   y: the entire wisp drifts upward over time
// The combination creates natural, cinematic steam.

const WISP_PATHS = [
  // Wisp A — gentle left-leaning S
  "M 50 0 C 43 -22 57 -44 49 -66 C 41 -88 55 -106 50 -126",
  // Wisp B — right-leaning S, narrower
  "M 38 0 C 44 -20 32 -40 40 -60 C 47 -80 35 -98 42 -116",
  // Wisp C — broader left lean
  "M 63 0 C 55 -24 70 -46 61 -70 C 52 -92 66 -110 59 -132",
  // Wisp D — nearly straight with small wobble
  "M 50 0 C 48 -25 53 -50 50 -76 C 47 -100 51 -118 50 -140",
  // Wisp E — tight right curl
  "M 44 0 C 50 -18 38 -36 46 -55 C 53 -74 40 -90 47 -108",
];

interface WispDef {
  pathIndex: number;
  strokeOpacity: number;
  strokeWidth: number;
  driftY: number;      // total upward drift in pixels over one cycle
  duration: number;   // seconds per cycle
  delay: number;
  color: string;
}

// Carefully tuned wisp definitions — varied timing so they feel organic, not mechanical
const WISPS: WispDef[] = [
  { pathIndex: 0, strokeOpacity: 0.42, strokeWidth: 2.2, driftY: 28, duration: 4.2, delay: 0,    color: "rgba(255, 245, 225, 0.9)" },
  { pathIndex: 1, strokeOpacity: 0.30, strokeWidth: 1.6, driftY: 22, duration: 3.8, delay: 1.1,  color: "rgba(255, 240, 210, 0.85)" },
  { pathIndex: 2, strokeOpacity: 0.35, strokeWidth: 1.9, driftY: 32, duration: 4.8, delay: 2.2,  color: "rgba(255, 248, 230, 0.8)"  },
  { pathIndex: 3, strokeOpacity: 0.25, strokeWidth: 1.4, driftY: 18, duration: 5.1, delay: 0.7,  color: "rgba(255, 242, 220, 0.75)" },
  { pathIndex: 4, strokeOpacity: 0.32, strokeWidth: 1.7, driftY: 25, duration: 3.5, delay: 3.0,  color: "rgba(255, 245, 228, 0.82)" },
];

interface SteamWispsProps {
  /** CSS class for the outer SVG */
  className?: string;
  /** Width of the SVG — wisps are positioned relative to centre (50) */
  width?: number;
  /** Visible height of the steam column above the source */
  height?: number;
  /** How many wisps to render (1–5) */
  count?: number;
  /** Scale all opacities — use lower values for subtle background steam */
  intensity?: number;
}

export default function SteamWisps({
  className = "",
  width = 120,
  height = 130,
  count = 4,
  intensity = 1,
}: SteamWispsProps) {
  const visibleWisps = WISPS.slice(0, Math.min(count, 5));

  return (
    <svg
      viewBox={`0 0 100 ${height}`}
      width={width}
      height={height}
      className={className}
      aria-hidden="true"
      style={{ overflow: "visible", pointerEvents: "none" }}
    >
      {visibleWisps.map((w, i) => (
        <motion.path
          key={i}
          d={WISP_PATHS[w.pathIndex]}
          fill="none"
          stroke={w.color}
          strokeWidth={w.strokeWidth}
          strokeLinecap="round"
          // Offset the path so it starts at the bottom of the SVG
          transform={`translate(0, ${height})`}
          initial={{ pathLength: 0, opacity: 0, y: 0 }}
          animate={{
            // pathLength: draws the wisp stroke from root to tip, then dissolves
            pathLength: [0, 0, 0.7, 1, 0.7, 0],
            // opacity: breathes in then out
            opacity: [0, 0, w.strokeOpacity * intensity, w.strokeOpacity * intensity * 0.8, w.strokeOpacity * intensity * 0.4, 0],
            // y: entire wisp drifts upward — the "rise" of steam
            y: [0, 0, -w.driftY * 0.4, -w.driftY * 0.7, -w.driftY, -w.driftY * 1.4],
          }}
          transition={{
            duration: w.duration,
            delay: w.delay,
            repeat: Infinity,
            // Long soft easing — organic, not robotic
            ease: [0.25, 0.1, 0.6, 1.0],
            times: [0, 0.08, 0.35, 0.6, 0.82, 1],
          }}
        />
      ))}
    </svg>
  );
}
