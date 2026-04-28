"use client";

import AppIcon from "@/components/AppIcon";
import { getBadgeIcon, getBadgeLabel } from "@/lib/recipe-types";

type BadgeChipProps = {
  badge: string;
  lang: "en" | "de";
  active?: boolean;
  asButton?: boolean;
  onClick?: () => void;
};

export default function BadgeChip({ badge, lang, active = false, asButton = false, onClick }: BadgeChipProps) {
  const content = (
    <>
      <span className="chip-icon">
        <AppIcon name={getBadgeIcon(badge)} size={16} />
      </span>
      <span>{getBadgeLabel(badge, lang)}</span>
    </>
  );

  if (asButton) {
    return (
      <button className={`chip chip-button${active ? " chip-active" : ""}`} type="button" onClick={onClick}>
        {content}
      </button>
    );
  }

  return <span className={`chip${active ? " chip-active" : ""}`}>{content}</span>;
}
