"use client";

/**
 * LottieAnimation — thin wrapper around lottie-react.
 *
 * Loads Lottie JSON from /public/animations/ via URL (not inline import),
 * keeping JS bundle size unaffected by the large animation files.
 *
 * Usage:
 *   <LottieAnimation src="/animations/peacock.json" loop style={{ width: 300 }} />
 */

import { useEffect, useRef, useState } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";

interface LottieAnimationProps {
  /** Path relative to /public, e.g. "/animations/peacock.json" */
  src: string;
  loop?: boolean;
  autoplay?: boolean;
  style?: React.CSSProperties;
  className?: string;
  /** Called once the animation data has loaded */
  onReady?: () => void;
  /**
   * Passed straight through to the underlying lottie-web renderer.
   * Useful for controlling SVG alignment via `preserveAspectRatio`.
   * Example: { preserveAspectRatio: 'xMaxYMid meet' }
   */
  rendererSettings?: Record<string, unknown>;
}

export default function LottieAnimation({
  src,
  loop = true,
  autoplay = true,
  style,
  className,
  onReady,
  rendererSettings,
}: LottieAnimationProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const [animationData, setAnimationData] = useState<unknown>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<unknown>;
      })
      .then((data) => {
        if (!cancelled) {
          setAnimationData(data);
          onReady?.();
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [src, onReady]);

  if (error) return null;
  if (!animationData) return null;

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      style={style}
      className={className}
      {...(rendererSettings ? { rendererSettings } : {})}
    />
  );
}
