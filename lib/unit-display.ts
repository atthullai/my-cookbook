/**
 * Presentation-only metric↔imperial conversion for the recipe view's
 * "Convert Units" toggle. This is deliberately separate from lib/conversion.ts
 * (which converts to canonical base g/ml/whole for pantry math) — here we only
 * reformat what the cook reads, never what we store.
 */

export type UnitSystem = "metric" | "imperial";

type Display = { amount: number; unit: string };

const round = (n: number, dp = 2) => {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
};

// Metric → imperial
const TO_IMPERIAL: Record<string, (q: number) => Display> = {
  g: (q) => (q >= 28.35 ? { amount: round(q / 28.35), unit: "oz" } : { amount: q, unit: "g" }),
  kg: (q) => ({ amount: round(q * 2.20462), unit: "lb" }),
  ml: (q) => (q >= 240 ? { amount: round(q / 240), unit: "cup" } : { amount: round(q / 29.5735), unit: "fl oz" }),
  l: (q) => ({ amount: round(q * 4.16667), unit: "cup" }),
};

// Imperial → metric
const TO_METRIC: Record<string, (q: number) => Display> = {
  oz: (q) => ({ amount: round(q * 28.35, 0), unit: "g" }),
  lb: (q) => ({ amount: round(q * 453.592, 0), unit: "g" }),
  cup: (q) => ({ amount: round(q * 240, 0), unit: "ml" }),
  "fl oz": (q) => ({ amount: round(q * 29.5735, 0), unit: "ml" }),
};

/** Returns the amount+unit to display for the chosen system, or null to keep the original. */
export function convertForDisplay(amount: number, unit: string, system: UnitSystem): Display | null {
  const u = unit.trim().toLowerCase();
  const table = system === "imperial" ? TO_IMPERIAL : TO_METRIC;
  const fn = table[u] ?? table[u === "litre" || u === "liter" ? "l" : u];
  if (!fn) return null;
  return fn(amount);
}
