import type { NutritionBadgeProps, NutritionSource } from "@/types";

const BADGE_CONFIG: Record<NutritionSource, { label: string; title: string; bg: string; color: string }> = {
  ifct: {
    label: "IFCT",
    title: "Indian Food Composition Tables 2017 — lab verified",
    bg: "var(--color-background-success, #dcfce7)",
    color: "var(--color-text-success, #166534)",
  },
  usda: {
    label: "USDA",
    title: "USDA FoodData Central — lab verified",
    bg: "var(--color-background-success, #dcfce7)",
    color: "var(--color-text-success, #166534)",
  },
  estimated: {
    label: "≈ estimated",
    title: "Some ingredients not matched to library — accuracy may vary",
    bg: "var(--color-background-warning, #fef9c3)",
    color: "var(--color-text-warning, #854d0e)",
  },
  unknown: {
    label: "? unverified",
    title: "Ingredients not matched to library — nutrition is a rough estimate",
    bg: "var(--color-background-danger, #fee2e2)",
    color: "var(--color-text-danger, #991b1b)",
  },
};

export function NutritionBadge({ source, confidence, unmatchedCount = 0, totalCount = 0 }: NutritionBadgeProps) {
  const display: NutritionSource =
    unmatchedCount > 0 && unmatchedCount === totalCount
      ? "unknown"
      : confidence === "estimate" || unmatchedCount > 0
      ? "estimated"
      : source;

  const cfg = BADGE_CONFIG[display];
  const showPartialWarning = unmatchedCount > 0 && unmatchedCount < totalCount;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <span
        title={cfg.title}
        style={{
          fontSize: 11,
          fontWeight: 600,
          padding: "2px 8px",
          borderRadius: 20,
          background: cfg.bg,
          color: cfg.color,
          cursor: "default",
          letterSpacing: "0.02em",
        }}
      >
        {cfg.label}
      </span>
      {showPartialWarning && (
        <span style={{ fontSize: 11, color: "var(--color-text-warning, #854d0e)" }}>
          {unmatchedCount} of {totalCount} unmatched
        </span>
      )}
    </div>
  );
}
