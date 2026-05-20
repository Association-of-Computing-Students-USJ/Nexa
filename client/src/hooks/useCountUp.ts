import { useEffect, useRef, useState } from "react";
import { useInView } from "./useInView";

/**
 * Animates a number from 0 to `target` when the ref element enters the viewport.
 * Returns { ref, display } — attach ref to a DOM node, render display as the text.
 * Handles suffixes like "+" or "K" appended to the value string.
 */
export function useCountUp(value: string | number, duration = 1600) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref as React.RefObject<Element>, { threshold: 0.5, once: true });
  const [display, setDisplay] = useState("0");
  const ran = useRef(false);

  useEffect(() => {
    if (!inView || ran.current) return;
    ran.current = true;

    const raw = String(value);
    const numeric = parseInt(raw.replace(/\D/g, ""), 10);
    const suffix = raw.replace(/[\d,]/g, ""); // e.g. "+" or "K+"

    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // cubic ease-out
      const current = Math.round(numeric * eased);
      setDisplay(`${current}${p < 1 ? "" : suffix}`);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value, duration]);

  return { ref, display };
}
