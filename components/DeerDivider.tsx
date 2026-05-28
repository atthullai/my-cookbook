"use client";

/**
 * DeerDivider — replaces KolamDivider.
 * Renders the Deer Lottie animation as a centered page divider.
 *
 * The deer.json canvas is 4368×1080 (~4:1). The deer character walks from
 * right to left across the full width over ~3 seconds. We render the
 * animation at its natural 4:1 aspect ratio so the walk is visible.
 * `height` controls the strip height (default 80px); width is derived.
 */
import LottieAnimation from "@/components/LottieAnimation";

const CANVAS_ASPECT = 4368 / 1080; // ≈ 4.04 : 1

interface DeerDividerProps {
  className?: string;
  /** Height of the animation strip in px (default 80). Width is auto-calculated from aspect ratio. */
  height?: number;
}

export default function DeerDivider({ className = "", height = 80 }: DeerDividerProps) {
  const width = Math.round(height * CANVAS_ASPECT);
  return (
    <div className={`flex items-center justify-center ${className}`} aria-hidden="true">
      <LottieAnimation
        src="/animations/deer.json"
        loop
        style={{ width, height }}
      />
    </div>
  );
}
