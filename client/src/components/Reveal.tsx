import { useMemo, useRef } from "react";
import { useInView } from "../hooks/useInView";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Delay in ms for staggered reveals */
  delayMs?: number;
  /** Animation style */
  variant?: "fade-up" | "fade" | "fade-left" | "fade-right";
} & React.HTMLAttributes<HTMLDivElement>;

// Wrapper that animates children in when scrolled into view.
export default function Reveal({ children, className, delayMs = 0, variant = "fade-up", ...rest }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const shown = useInView(ref, { threshold: 0.15, rootMargin: "0px 0px -10% 0px", once: true });

  const variantClass = useMemo(() => {
    switch (variant) {
      case "fade":
        return "reveal-fade";
      case "fade-left":
        return "reveal-left";
      case "fade-right":
        return "reveal-right";
      default:
        return "reveal-up";
    }
  }, [variant]);

  return (
    <div
      ref={ref}
      className={[
        "reveal-base",
        variantClass,
        shown ? "reveal-show" : "",
        className ?? ""
      ].join(" ")}
      style={{ ...(rest.style ?? {}), transitionDelay: `${delayMs}ms` }}
      {...rest}
    >
      {children}
    </div>
  );
}

