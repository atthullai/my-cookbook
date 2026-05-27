"use client";

/**
 * TadkaEffect — the micro-animation of South Indian tempering (tadka/thalippu).
 *
 * When a recipe is saved, a dish is completed, or a key action succeeds —
 * mustard seeds crackle outward and curry leaf shapes flicker briefly.
 * The effect is subtle, joyful, and deeply rooted in Tamil Nadu cooking ritual.
 *
 * Usage:
 *   const [burst, setBurst] = useState(false);
 *   <TadkaEffect trigger={burst} onComplete={() => setBurst(false)} />
 *   <button onClick={() => setBurst(true)}>Save</button>
 */

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

// Mustard seed burst — 8 small circles radiating outward at different angles
const SEED_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const SEED_DISTANCES = [28, 36, 30, 38, 26, 34, 32, 30];

// Curry leaf — simplified SVG path (elongated leaf shape)
const LEAF_POSITIONS = [
  { x: -22, y: -14, rotate: -30, scale: 0.9 },
  { x:  18, y: -20, rotate:  25, scale: 1.0 },
  { x: -16, y:  18, rotate: -45, scale: 0.85 },
  { x:  24, y:  12, rotate:  35, scale: 0.95 },
];

// Oil shimmer — horizontal golden wave
function OilShimmer({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="absolute inset-x-0 bottom-0 h-0.5 rounded-full overflow-hidden"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <motion.div
            className="h-full w-full"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(212,160,23,0.8), rgba(255,200,60,0.9), rgba(200,140,20,0.7), transparent)",
            }}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface TadkaEffectProps {
  /** Trigger the burst when true */
  trigger: boolean;
  /** Called when animation completes so parent can reset trigger */
  onComplete?: () => void;
  /** Position of the effect origin — defaults to "centered on parent" */
  className?: string;
}

export default function TadkaEffect({ trigger, onComplete, className = "" }: TadkaEffectProps) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    const t0 = setTimeout(() => setActive(true), 0);
    const t1 = setTimeout(() => {
      setActive(false);
      onComplete?.();
    }, 900);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
    };
  }, [trigger, onComplete]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-visible ${className}`} aria-hidden="true">
      <AnimatePresence>
        {active && (
          <>
            {/* Mustard seed burst */}
            {SEED_ANGLES.map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const dist = SEED_DISTANCES[i];
              const tx = Math.cos(rad) * dist;
              const ty = Math.sin(rad) * dist;

              return (
                <motion.div
                  key={`seed-${i}`}
                  className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full"
                  style={{
                    background: i % 2 === 0
                      ? "rgba(58, 35, 12, 0.85)"   // dark mustard seed
                      : "rgba(180, 130, 20, 0.75)", // golden seed
                    marginLeft: -3,
                    marginTop: -3,
                  }}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                  animate={{
                    x: tx,
                    y: ty,
                    scale: [0, 1.4, 0.8, 0],
                    opacity: [1, 1, 0.6, 0],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.65,
                    delay: i * 0.025,
                    ease: [0.2, 0, 0.4, 1],
                  }}
                />
              );
            })}

            {/* Curry leaf shapes */}
            {LEAF_POSITIONS.map((leaf, i) => (
              <motion.div
                key={`leaf-${i}`}
                className="absolute left-1/2 top-1/2"
                style={{ marginLeft: -6, marginTop: -3 }}
                initial={{ x: 0, y: 0, rotate: 0, scale: 0, opacity: 0 }}
                animate={{
                  x: leaf.x,
                  y: leaf.y,
                  rotate: leaf.rotate,
                  scale: [0, leaf.scale, leaf.scale * 0.7, 0],
                  opacity: [0, 0.85, 0.6, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.75,
                  delay: 0.08 + i * 0.05,
                  ease: [0.25, 1, 0.5, 1],
                }}
              >
                {/* Simple leaf SVG */}
                <svg width="12" height="6" viewBox="0 0 12 6" fill="none">
                  <path
                    d="M 1 3 Q 3 0.5 6 0.5 Q 9 0.5 11 3 Q 9 5.5 6 5.5 Q 3 5.5 1 3 Z"
                    fill="rgba(45, 90, 25, 0.80)"
                  />
                  <line x1="1" y1="3" x2="11" y2="3" stroke="rgba(55, 110, 30, 0.4)" strokeWidth="0.5" />
                </svg>
              </motion.div>
            ))}

            {/* Central flash — like the moment mustard seeds hit hot oil */}
            <motion.div
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{
                marginLeft: -16,
                marginTop: -16,
                width: 32,
                height: 32,
                background: "radial-gradient(circle, rgba(255,200,60,0.55) 0%, transparent 70%)",
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 2.5, 1.5, 0], opacity: [0, 1, 0.4, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.2, 0, 0.4, 1] }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Oil shimmer along the bottom edge */}
      <OilShimmer active={active} />
    </div>
  );
}
