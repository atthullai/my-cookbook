"use client";

/**
 * DeerDivider — full-width page divider.
 * lottie-web stamps explicit px dimensions on the inner SVG at init time.
 * We override them with !important so the SVG scales to 100% container
 * width while height is derived from the SVG viewBox (4368×1080, ~4:1).
 */
import LottieAnimation from "@/components/LottieAnimation";

interface DeerDividerProps {
  className?: string;
}

export default function DeerDivider({ className = "" }: DeerDividerProps) {
  return (
    <div className={`deer-divider-wrap w-full overflow-hidden ${className}`} aria-hidden="true">
      <style>{`.deer-divider-wrap svg { width: 100% !important; height: auto !important; display: block; }`}</style>
      <LottieAnimation src="/animations/deer.json" loop style={{ width: "100%" }} />
    </div>
  );
}
