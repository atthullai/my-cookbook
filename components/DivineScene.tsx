"use client";

/**
 * DivineScene — hero animation for the home page.
 *
 * A meditative depiction of Lord Krishna:
 *   • Peacock feather — the most iconic symbol, floating with divine grace
 *   • Bansuri (flute) — Krishna's beloved instrument, rendered in golden bamboo
 *   • Sacred lotus — divine purity rising from stillness
 *   • Floating light particles — divine radiance
 *   • Warm golden glow — the atmosphere of Vrindavan at dawn
 */

import { motion } from "framer-motion";

const LIGHT_PARTICLES = [
  { top: "72%", left: "18%",  delay: 0,   duration: 6.2 },
  { top: "65%", left: "76%",  delay: 1.8, duration: 7.5 },
  { top: "58%", left: "28%",  delay: 1.0, duration: 5.8 },
  { top: "78%", left: "60%",  delay: 3.0, duration: 6.9 },
  { top: "50%", left: "82%",  delay: 0.5, duration: 8.0 },
  { top: "80%", left: "40%",  delay: 4.0, duration: 5.5 },
  { top: "55%", left: "52%",  delay: 2.5, duration: 7.2 },
];

export default function DivineScene() {
  return (
    <div
      className="relative select-none"
      aria-hidden="true"
      style={{ width: 280, height: 320 }}
    >
      {/* ── Divine radial glow ───────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            "radial-gradient(ellipse 80% 65% at 50% 60%, rgba(255, 200, 60, 0.22) 0%, transparent 65%)",
            "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(255, 165, 0, 0.14) 0%, transparent 55%)",
            "radial-gradient(ellipse 100% 45% at 50% 90%, rgba(180, 100, 20, 0.12) 0%, transparent 70%)",
          ].join(", "),
        }}
      />

      {/* ── Main SVG scene ───────────────────────────────────────── */}
      <svg
        viewBox="0 0 160 280"
        width={280}
        height={310}
        className="absolute inset-0"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Peacock feather shaft gradient */}
          <linearGradient id="featherShaft" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#3a7a30" />
            <stop offset="40%"  stopColor="#5cb85c" />
            <stop offset="100%" stopColor="#2d5e24" />
          </linearGradient>

          {/* Peacock eye — the blue-green ocellus */}
          <radialGradient id="peacockEye" cx="50%" cy="50%">
            <stop offset="0%"   stopColor="#1a1a6e" />
            <stop offset="30%"  stopColor="#0d4b91" />
            <stop offset="55%"  stopColor="#1a8a7a" />
            <stop offset="75%"  stopColor="#1fae60" />
            <stop offset="88%"  stopColor="#4ac24a" />
            <stop offset="100%" stopColor="rgba(100,200,80,0)" />
          </radialGradient>

          {/* Bansuri (flute) bamboo gradient */}
          <linearGradient id="bansuri" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#c8a848" />
            <stop offset="35%"  stopColor="#e8c85a" />
            <stop offset="65%"  stopColor="#d0a840" />
            <stop offset="100%" stopColor="#a07828" />
          </linearGradient>

          {/* Lotus petal gradient */}
          <linearGradient id="lotusPetal" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%"   stopColor="#d63384" stopOpacity="0.85" />
            <stop offset="60%"  stopColor="#f06fa0" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fbb8d0" stopOpacity="0.7" />
          </linearGradient>

          {/* Divine halo ring */}
          <radialGradient id="haloGlow" cx="50%" cy="50%">
            <stop offset="60%" stopColor="rgba(255,200,60,0)" />
            <stop offset="80%" stopColor="rgba(255,200,60,0.35)" />
            <stop offset="100%" stopColor="rgba(255,200,60,0)" />
          </radialGradient>

          {/* Ground shadow */}
          <radialGradient id="groundShadow" cx="50%" cy="50%">
            <stop offset="0%"  stopColor="rgba(60, 30, 10, 0.18)" />
            <stop offset="100%" stopColor="rgba(60, 30, 10, 0)" />
          </radialGradient>

          {/* Soft glow filter */}
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>

          {/* Eye glow filter */}
          <filter id="eyeGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* ── Ground shadow ─────────────────────────────────────── */}
        <ellipse cx="80" cy="255" rx="50" ry="7" fill="url(#groundShadow)" />

        {/* ── Sacred lotus base ─────────────────────────────────── */}
        {/* Lotus petals — a 6-petal arrangement at the base */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const cx  = 80 + Math.cos(rad) * 18;
          const cy  = 240 + Math.sin(rad) * 7;
          return (
            <motion.ellipse
              key={`lotus-petal-${i}`}
              cx={cx}
              cy={cy}
              rx="11"
              ry="20"
              fill="url(#lotusPetal)"
              transform={`rotate(${angle + 90}, ${cx}, ${cy})`}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.12, duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
            />
          );
        })}

        {/* Lotus center */}
        <motion.ellipse
          cx="80" cy="236" rx="12" ry="8"
          fill="#f8d7e8"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 1.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        />
        <motion.ellipse
          cx="80" cy="234" rx="6" ry="4"
          fill="#e8a0c0"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: 1.3, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        />

        {/* ── Bansuri (flute) — horizontal, golden bamboo ───────── */}
        <motion.g
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.25, 0.1, 0.4, 1] }}
        >
          {/* Flute body */}
          <rect x="18" y="190" width="124" height="7" rx="3.5" fill="url(#bansuri)" />
          {/* Finger holes */}
          {[38, 52, 66, 80, 94, 108].map((x, i) => (
            <circle key={i} cx={x} cy="193.5" r="2.2" fill="rgba(90, 50, 10, 0.55)" />
          ))}
          {/* Blowing hole */}
          <ellipse cx="28" cy="193.5" rx="3" ry="2.5" fill="rgba(90, 50, 10, 0.7)" />
          {/* Bamboo nodes */}
          {[60, 90, 120].map((x, i) => (
            <line key={i} x1={x} y1="190" x2={x} y2="197" stroke="rgba(120,70,10,0.4)" strokeWidth="1" />
          ))}
        </motion.g>

        {/* ── Peacock feather ───────────────────────────────────── */}
        <motion.g
          initial={{ opacity: 0, y: 20, rotate: -8 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ delay: 0.2, duration: 1.0, ease: [0.25, 0.1, 0.4, 1] }}
          style={{ transformOrigin: "80px 230px" }}
        >
          {/* Feather shaft — long curved stem */}
          <motion.path
            d="M 80 228 Q 72 180 68 140 Q 65 100 72 60 Q 76 30 80 18"
            stroke="url(#featherShaft)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.4, duration: 1.4, ease: [0.4, 0, 0.3, 1] }}
          />

          {/* Feather barbs — wispy lines along the shaft */}
          {[
            { x1: 68, y1: 140, x2: 45, y2: 128, x3: 95, y3: 132 },
            { x1: 69, y1: 118, x2: 46, y2: 106, x3: 96, y3: 110 },
            { x1: 71, y1: 96,  x2: 50, y2: 84,  x3: 96, y3: 88  },
            { x1: 73, y1: 74,  x2: 55, y2: 62,  x3: 96, y3: 66  },
            { x1: 75, y1: 54,  x2: 60, y2: 42,  x3: 96, y3: 46  },
          ].map((b, i) => (
            <motion.g key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.65 }}
              transition={{ delay: 0.8 + i * 0.15, duration: 0.5 }}
            >
              <line x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} stroke="#3a7030" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
              <line x1={b.x1} y1={b.y1} x2={b.x3} y2={b.y3} stroke="#3a7030" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
            </motion.g>
          ))}

          {/* The peacock eye (ocellus) — the most distinctive feature */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ transformOrigin: "80px 42px" }}
          >
            {/* Outer golden ring */}
            <ellipse cx="80" cy="42" rx="20" ry="22" fill="rgba(200,160,20,0.15)" />
            {/* Eye gradient fill */}
            <ellipse cx="80" cy="42" rx="16" ry="18" fill="url(#peacockEye)" filter="url(#eyeGlow)" />
            {/* Inner dark pupil */}
            <ellipse cx="80" cy="42" rx="5" ry="5.5" fill="#0a0a40" />
            {/* Eye highlight */}
            <ellipse cx="77" cy="39" rx="2" ry="2.2" fill="rgba(255,255,255,0.35)" />
            {/* Golden rim */}
            <ellipse cx="80" cy="42" rx="16" ry="18" fill="none" stroke="rgba(210,170,30,0.55)" strokeWidth="1.5" />
            {/* Divine halo around the eye */}
            <ellipse cx="80" cy="42" rx="22" ry="24" fill="url(#haloGlow)" />
          </motion.g>

          {/* Feather tip wisps above the eye */}
          {[-12, -6, 0, 6, 12].map((dx, i) => (
            <motion.path
              key={i}
              d={`M ${80 + dx} 20 Q ${80 + dx * 1.3} 10 ${80 + dx * 0.8} 2`}
              stroke={i === 2 ? "rgba(200,160,20,0.8)" : "rgba(50,130,50,0.5)"}
              strokeWidth={i === 2 ? 1.5 : 1}
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 1.8 + i * 0.1, duration: 0.4 }}
            />
          ))}
        </motion.g>

        {/* ── Divine halo (gentle pulse) ─────────────────────────── */}
        <motion.ellipse
          cx="80" cy="42"
          rx="28" ry="30"
          fill="none"
          stroke="rgba(255, 210, 50, 0.25)"
          strokeWidth="1"
          animate={{ rx: [28, 32, 28], ry: [30, 34, 30], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.ellipse
          cx="80" cy="42"
          rx="36" ry="38"
          fill="none"
          stroke="rgba(255, 200, 40, 0.12)"
          strokeWidth="0.8"
          animate={{ rx: [36, 40, 36], ry: [38, 42, 38], opacity: [0.12, 0.22, 0.12] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
      </svg>

      {/* ── Floating divine light particles ───────────────────── */}
      {LIGHT_PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          className="absolute pointer-events-none select-none"
          style={{ top: p.top, left: p.left, fontSize: "0.7rem", lineHeight: 1 }}
          animate={{
            y: [0, -16, -8, -20, 0],
            x: [0, 3, -2, 1, 0],
            opacity: [0, 0.7, 0.9, 0.5, 0],
            scale: [0.5, 1, 1.1, 0.8, 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          ✦
        </motion.span>
      ))}

      {/* ── Sacred "Om" glow dot near the eye ─────────────────── */}
      <motion.div
        className="absolute pointer-events-none"
        style={{ top: "6%", left: "50%", transform: "translateX(-50%)", fontSize: "0.55rem", color: "rgba(200,160,20,0.7)", fontWeight: 700, letterSpacing: "0.05em" }}
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        ॐ
      </motion.div>
    </div>
  );
}
