import { useEffect, useState, type RefObject } from "react";

type UseInViewOptions = IntersectionObserverInit & { once?: boolean };

// Small IntersectionObserver hook for scroll-reveal animations.
export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  options: UseInViewOptions = {}
) {
  const { once = true, root = null, rootMargin, threshold } = options;
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        if (once) obs.disconnect();
      } else if (!once) {
        setInView(false);
      }
    }, { root, rootMargin, threshold });

    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, once, root, rootMargin, threshold]);

  return inView;
}
