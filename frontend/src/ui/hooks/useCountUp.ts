import { useEffect, useRef, useState } from "react";

/**
 * Anima un número desde el valor anterior hasta `target` con easing out.
 * Con prefers-reduced-motion salta directo al valor final.
 */
export function useCountUp(target: number, durationMs = 600) {
  const [value, setValue] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? target
      : 0,
  );
  const fromRef = useRef(0);

  useEffect(() => {
    let raf: number;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      raf = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(raf);
    }

    const from = fromRef.current;
    fromRef.current = target;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}
