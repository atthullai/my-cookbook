"use client";

/**
 * DeerDivider — replaces KolamDivider.
 * Renders the Deer Lottie animation as a centered page divider.
 * Matches the same sizing contract as KolamDivider so it drops in everywhere.
 */
import LottieAnimation from "@/components/LottieAnimation";

interface DeerDividerProps {
  className?: string;
  /** Width of the animation in px (default 120) */
  size?: number;
}

export default function DeerDivider({ className = "", size = 120 }: DeerDividerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`} aria-hidden="true">
      <LottieAnimation
        src="/animations/deer.json"
        loop
        style={{ width: size, height: size }}
      />
    </div>
  );
}
