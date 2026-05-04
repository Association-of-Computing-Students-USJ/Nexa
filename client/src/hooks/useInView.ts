import { useEffect, useState } from "react";

// Small IntersectionObserver hook for scroll-reveal animations.
export function useInView<T extends Element>(
  ref: React.RefObject<T | null>,
  options: IntersectionObserverInit & { once?: boolean } = {}
) {
  const { once = true, ...io } = options;
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
    }, io);

    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, once, io.root, io.rootMargin, io.threshold]);

  return inView;
}

