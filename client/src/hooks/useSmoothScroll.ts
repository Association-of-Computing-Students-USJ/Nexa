import { useEffect } from "react";

/**
 * Attaches a Lenis smooth-scroll instance after idle time so initial paint stays fast.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let lenis: { raf: (time: number) => void; destroy: () => void } | null = null;
    let raf = 0;
    let cancelled = false;

    const start = () => {
      import("lenis").then(({ default: Lenis }) => {
        if (cancelled) return;

        lenis = new Lenis({
          duration: 1.15,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          touchMultiplier: 1.8,
        });

        function tick(time: number) {
          lenis?.raf(time);
          raf = requestAnimationFrame(tick);
        }
        raf = requestAnimationFrame(tick);
      });
    };

    if ("requestIdleCallback" in window) {
      const idleId = requestIdleCallback(start, { timeout: 2500 });
      return () => {
        cancelled = true;
        cancelIdleCallback(idleId);
        cancelAnimationFrame(raf);
        lenis?.destroy();
      };
    }

    const timer = setTimeout(start, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, []);
}
