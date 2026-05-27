"use client";

/**
 * FilterCoffeeScene — the soul of the home page.
 *
 * A meditative, cinematic scene of South Indian filter coffee:
 * the brass tumbler sitting in its davara (saucer), dark decoction visible inside,
 * slow organic steam rising in the early morning light.
 *
 * This is NOT restaurant-aesthetic. It is the quiet kitchen at 5:30 AM —
 * the brass still warm, the steam catching the first light through the window,
 * the kolam freshly drawn at the threshold.
 *
 * Visual elements:
 *   • Warm saffron/amber radial glow (early morning sunlight)
 *   • Davara (wide flat brass saucer) — the base
 *   • Tumbler (brass cylinder) sitting in the davara
 *   • Dark coffee surface with gentle shimmer
 *   • Organic steam wisps rising slowly
 *   • Floating spice particles (cardamom, clove, cinnamon)
 *   • Kolam dot pattern on the ground as decorative "threshold"
 *   • Fine grain texture overlay (paper/brass surface feel)
 */

import { motion } from "framer-motion";
import SteamWisps from "./SteamWisps";

// Floating spice particles — tiny, slow, calming
const SPICE_PARTICLES = [
  { content: "·", top: "68%", left: "12%",  delay: 0,   duration: 6.5, size: "1.1rem", color: "rgba(200, 130, 30, 0.5)"  },
  { content: "·", top: "72%", left: "78%",  delay: 2.1, duration: 7.2, size: "0.9rem", color: "rgba(170, 100, 25, 0.45)" },
  { content: "·", top: "62%", left: "22%",  delay: 1.4, duration: 5.8, size: "0.8rem", color: "rgba(180, 120, 20, 0.4)"  },
  { content: "·", top: "75%", left: "68%",  delay: 3.3, duration: 6.9, size: "1.0rem", color: "rgba(160, 90, 18, 0.42)"  },
  { content: "·", top: "58%", left: "83%",  delay: 0.7, duration: 8.1, size: "0.75rem", color: "rgba(195, 140, 35, 0.38)" },
  { content: "·", top: "80%", left: "36%",  delay: 4.1, duration: 5.5, size: "0.85rem", color: "rgba(155, 85, 20, 0.35)"  },
  { content: "·", top: "55%", left: "55%",  delay: 2.8, duration: 7.4, size: "0.7rem",  color: "rgba(210, 150, 40, 0.32)" },
];

// Ground kolam dots — the 3×3 grid of a traditional kolam base pattern
// Rendered below the tumbler as a "freshly drawn threshold"
const KOLAM_GROUND_DOTS = [
  // Row 1
  { cx: 66, cy: 218 }, { cx: 80, cy: 218 }, { cx: 94, cy: 218 },
  // Row 2
  { cx: 66, cy: 228 }, { cx: 80, cy: 228 }, { cx: 94, cy: 228 },
  // Row 3
  { cx: 66, cy: 238 }, { cx: 80, cy: 238 }, { cx: 94, cy: 238 },
];

// Connecting kolam lines (simplified — join the dots with short lines)
const KOLAM_CONNECT_PATHS = [
  "M 66 218 L 94 238",
  "M 94 218 L 66 238",
  "M 80 218 L 80 238",
  "M 66 228 L 94 228",
];

export default function FilterCoffeeScene() {
  return (
    <div
      className="relative select-none"
      aria-hidden="true"
      style={{ width: 280, height: 320 }}
    >
      {/* ── Ambient morning light glow ──────────────────────────────── */}
      {/* Layered warm radial gradients simulating early morning sunlight */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: [
            "radial-gradient(ellipse 85% 70% at 50% 75%, rgba(212, 158, 30, 0.28) 0%, transparent 65%)",
            "radial-gradient(ellipse 55% 45% at 50% 65%, rgba(255, 200, 80, 0.16) 0%, transparent 60%)",
            "radial-gradient(ellipse 100% 40% at 50% 92%, rgba(180, 100, 20, 0.14) 0%, transparent 70%)",
          ].join(", "),
        }}
      />

      {/* ── Steam wisps (positioned above the tumbler) ──────────────── */}
      <div
        className="absolute"
        style={{ left: 84, top: 44, zIndex: 10 }}
      >
        <SteamWisps
          width={112}
          height={90}
          count={5}
          intensity={0.85}
        />
      </div>

      {/* ── Main SVG — brass tumbler and davara ────────────────────── */}
      <svg
        viewBox="0 0 160 260"
        width={280}
        height={280}
        className="absolute inset-0"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Brass main gradient — warm gold with left/right shading for cylinder depth */}
          <linearGradient id="brassBody" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#6B4A10" />
            <stop offset="12%"  stopColor="#9B7020" />
            <stop offset="28%"  stopColor="#D4A030" />
            <stop offset="46%"  stopColor="#E8C060" />  {/* highlight band */}
            <stop offset="58%"  stopColor="#D4A030" />
            <stop offset="78%"  stopColor="#A07820" />
            <stop offset="92%"  stopColor="#7A5A12" />
            <stop offset="100%" stopColor="#5C4010" />
          </linearGradient>

          {/* Brass rim — brighter */}
          <linearGradient id="brassRim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#8B6818" />
            <stop offset="30%"  stopColor="#D4A028" />
            <stop offset="50%"  stopColor="#F0D060" />
            <stop offset="70%"  stopColor="#C89028" />
            <stop offset="100%" stopColor="#7A5A12" />
          </linearGradient>

          {/* Brass davara (saucer) — slightly different shade */}
          <linearGradient id="brassDavara" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#7A5A12" />
            <stop offset="25%"  stopColor="#C08020" />
            <stop offset="50%"  stopColor="#E0B040" />  {/* highlight */}
            <stop offset="75%"  stopColor="#B07820" />
            <stop offset="100%" stopColor="#704A0E" />
          </linearGradient>

          {/* Coffee inside tumbler — dark, rich, with a tiny light reflection */}
          <linearGradient id="coffeeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#2A1508" stopOpacity="0.95" />
            <stop offset="40%"  stopColor="#3D2010" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#1E0D05" stopOpacity="1"   />
          </linearGradient>

          {/* Coffee surface shimmer */}
          <radialGradient id="coffeeSurface" cx="35%" cy="38%">
            <stop offset="0%"  stopColor="rgba(255, 220, 160, 0.22)" />
            <stop offset="60%" stopColor="rgba(80, 40, 10, 0)" />
          </radialGradient>

          {/* Ground shadow under davara */}
          <radialGradient id="groundShadow" cx="50%" cy="50%">
            <stop offset="0%"  stopColor="rgba(60, 35, 10, 0.22)" />
            <stop offset="100%" stopColor="rgba(60, 35, 10, 0)" />
          </radialGradient>

          {/* Grain texture filter for the brass surfaces */}
          <filter id="brassGrain" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.92" numOctaves="3" stitchTiles="stitch" result="noise" />
            <feComposite in="SourceGraphic" in2="noise" operator="in" />
          </filter>

          {/* Soft drop shadow for the vessels */}
          <filter id="vesselShadow" x="-20%" y="-5%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#3D2010" floodOpacity="0.32" />
          </filter>
        </defs>

        {/* ── Ground shadow ellipse ────────────────────────────────── */}
        <ellipse cx="80" cy="244" rx="52" ry="8" fill="url(#groundShadow)" />

        {/* ── Kolam ground pattern ─────────────────────────────────── */}
        {/* The threshold kolam drawn in front of the vessel */}
        {KOLAM_CONNECT_PATHS.map((d, i) => (
          <motion.path
            key={`kline-${i}`}
            d={d}
            stroke="rgba(195, 140, 30, 0.22)"
            strokeWidth="0.6"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 3,
              delay: 1.5 + i * 0.3,
              ease: [0.4, 0, 0.3, 1],
            }}
          />
        ))}
        {KOLAM_GROUND_DOTS.map((dot, i) => (
          <motion.circle
            key={`kdot-${i}`}
            cx={dot.cx}
            cy={dot.cy}
            r="1"
            fill="rgba(195, 140, 30, 0.28)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 1.2 + i * 0.08,
              duration: 0.35,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          />
        ))}

        {/* ── Davara (wide flat brass saucer) ─────────────────────── */}
        {/* The outer wide saucer the tumbler sits in */}
        <g filter="url(#vesselShadow)">
          {/* Davara body */}
          <path
            d="M 26 212 Q 26 228 80 228 Q 134 228 134 212 L 128 200 Q 108 210 80 210 Q 52 210 32 200 Z"
            fill="url(#brassDavara)"
          />
          {/* Davara rim — top ellipse */}
          <ellipse cx="80" cy="200" rx="48" ry="7" fill="url(#brassRim)" />
          {/* Davara inner well (slightly recessed) */}
          <ellipse cx="80" cy="200" rx="38" ry="5" fill="rgba(50, 32, 10, 0.45)" />
          {/* Davara coffee pool (thin layer of coffee in the saucer) */}
          <ellipse cx="80" cy="200" rx="33" ry="4" fill="#2A1508" opacity="0.7" />
          {/* Davara coffee surface light reflection */}
          <ellipse cx="68" cy="198" rx="12" ry="2" fill="rgba(255, 220, 160, 0.12)" />
        </g>

        {/* ── Tumbler body ─────────────────────────────────────────── */}
        {/* Classic South Indian filter coffee tumbler — tall, slightly tapered */}
        <g filter="url(#vesselShadow)">
          {/* Tumbler body shape: wider at base, slight taper upward */}
          <path
            d="M 50 196 L 48 118 Q 48 110 56 108 L 104 108 Q 112 110 112 118 L 110 196 Z"
            fill="url(#brassBody)"
          />

          {/* Coffee fill inside the tumbler */}
          <path
            d="M 51 196 L 49 128 Q 50 120 56 118 L 104 118 Q 110 120 111 128 L 109 196 Z"
            fill="url(#coffeeFill)"
          />

          {/* Coffee surface at top — visible inside the rim */}
          <ellipse cx="80" cy="118" rx="26" ry="4.5" fill="#2A1508" />
          <ellipse cx="80" cy="118" rx="26" ry="4.5" fill="url(#coffeeSurface)" />

          {/* Coffee surface gentle ripple animation */}
          <motion.ellipse
            cx="80"
            cy="118"
            fill="none"
            stroke="rgba(255, 220, 160, 0.18)"
            strokeWidth="0.5"
            initial={{ rx: 4, ry: 0.8, opacity: 0 }}
            animate={{
              rx: [4, 20, 25],
              ry: [0.8, 3.5, 4.5],
              opacity: [0.45, 0.2, 0],
            }}
            transition={{
              duration: 3.8,
              delay: 0.5,
              repeat: Infinity,
              repeatDelay: 2.4,
              ease: "easeOut",
            }}
          />

          {/* Tumbler top rim — bright brass ring */}
          <ellipse cx="80" cy="108" rx="28" ry="5" fill="url(#brassRim)" />

          {/* Tumbler bottom base — thicker, sits on davara */}
          <ellipse cx="80" cy="196" rx="30" ry="5" fill="#7A5A12" />
          <ellipse cx="80" cy="196" rx="27" ry="3.5" fill="#A07820" opacity="0.6" />

          {/* Highlight stripe — the characteristic "light band" on a polished brass tumbler */}
          <motion.rect
            x="67"
            y="120"
            width="3"
            height="70"
            rx="1.5"
            fill="rgba(255, 245, 200, 0.14)"
            animate={{ opacity: [0.1, 0.22, 0.1] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Secondary narrower highlight */}
          <rect
            x="75"
            y="115"
            width="1.2"
            height="75"
            rx="0.6"
            fill="rgba(255, 248, 210, 0.09)"
          />
        </g>

        {/* ── Warm morning light ray (very subtle) ─────────────────── */}
        <motion.path
          d="M 80 108 L 30 70 M 80 108 L 130 65"
          stroke="rgba(255, 215, 100, 0.06)"
          strokeWidth="18"
          strokeLinecap="round"
          fill="none"
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>

      {/* ── Floating spice particles ──────────────────────────────── */}
      {SPICE_PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          className="absolute pointer-events-none select-none"
          style={{
            top: p.top,
            left: p.left,
            fontSize: p.size,
            color: p.color,
            lineHeight: 1,
          }}
          animate={{
            y: [0, -14, -8, -18, 0],
            x: [0, 3, -2, 1, 0],
            opacity: [0, 0.6, 0.9, 0.5, 0],
            scale: [0.6, 1, 1.1, 0.9, 0.6],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {p.content}
        </motion.span>
      ))}

      {/* ── Grain texture overlay — gives worn brass / paper feel ─── */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundSize: "120px 120px",
          opacity: 0.6,
          mixBlendMode: "multiply",
        }}
      />
    </div>
  );
}
