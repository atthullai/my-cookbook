"use client";

import { getBadgeEmoji, getBadgeLabel } from "@/lib/recipe-types";

type BadgeChipProps = {
  badge: string;
  lang: "en" | "de";
  active?: boolean;
  asButton?: boolean;
  onClick?: () => void;
};

export default function BadgeChip({ badge, lang, active = false, asButton = false, onClick }: BadgeChipProps) {
  const tone =
    badge.includes("Vegan") ? "chip-vegan" :
    badge.includes("Non-Veg") ? "chip-nonveg" :
    badge.includes("Egg") ? "chip-egg" :
    badge.includes("Veg") ? "chip-veg" :
    badge.includes("Spicy") ? "chip-spicy" :
    badge.includes("High Protein") ? "chip-protein" :
    badge.includes("Quick Meal") ? "chip-quick" :
    badge.includes("One Pot") ? "chip-onepot" :
    badge.includes("Festival") ? "chip-festival" :
    badge.includes("Breakfast") ? "chip-breakfast" :
    badge.includes("Lunch") ? "chip-lunch" :
    badge.includes("Dinner") ? "chip-dinner" :
    badge.includes("Dessert") ? "chip-dessert" :
    badge.includes("Excellent") ? "chip-excellent" :
    badge.includes("Good") ? "chip-good" :
    "chip-default";

  const content = (
    <>
      <span className="chip-icon">
        {getBadgeEmoji(badge)}
      </span>
      <span>{getBadgeLabel(badge, lang)}</span>
    </>
  );

  if (asButton) {
    return (
      <button className={`chip chip-button ${tone}${active ? " chip-active" : ""}`} type="button" onClick={onClick}>
        {content}
      </button>
    );
  }

  return <span className={`chip ${tone}${active ? " chip-active" : ""}`}>{content}</span>;
}
