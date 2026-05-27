import { useEffect, useRef, useState, type RefObject } from "react";
import { HOME_SECTION_IDS } from "../data/navigation";

/**
 * Consolidates scroll-driven UI (progress bar, navbar state, hero parallax,
 * active nav section) into one rAF-throttled listener.
 */
export function useHomeScroll(parallaxRef: RefObject<HTMLImageElement | null>) {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActive] = useState("");
  const progressRef = useRef<HTMLDivElement>(null);
  const scrolledRef = useRef(false);

  useEffect(() => {
    let rafId = 0;

    const updateScrollUi = () => {
      const y = window.scrollY;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? (y / scrollable) * 100 : 0;

      progressRef.current?.style.setProperty("width", `${pct}%`);

      const isScrolled = y > 80;
      if (isScrolled !== scrolledRef.current) {
        scrolledRef.current = isScrolled;
        setScrolled(isScrolled);
      }

      parallaxRef.current?.style.setProperty("transform", `scale(1.08) translateY(${y * 0.22}px)`);
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateScrollUi);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    updateScrollUi();

    const sections = HOME_SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null
    );

    const ratios = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }

        let bestId = "";
        let bestRatio = 0;
        for (const [id, ratio] of ratios) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }

        if (bestId) setActive(bestId);
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    sections.forEach((el) => observer.observe(el));

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [parallaxRef]);

  return { scrolled, activeSection, progressRef };
}
