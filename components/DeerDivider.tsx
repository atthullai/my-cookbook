"use client";

/**
 * DeerDivider — full-width page divider.
 * The deer.json canvas is 4368×1080 (~4:1). Width fills the container
 * and height scales proportionally via aspect-ratio CSS so the deer
 * walks from one edge of the page to the other.
 */
import LottieAnimation from "@/components/LottieAnimation";

interface DeerDividerProps {
  className?: string;
}

export default function DeerDivider({ className = "" }: DeerDividerProps) {
  return (
    <div
      className={`w-full overflow-hidden ${className}`}
      style={{ aspectRatio: "4368 / 1080" }}
      aria-hidden="true"
    >
      <LottieAnimation
        src="/animations/deer.json"
        loop
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
