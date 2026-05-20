import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const dot  = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const mouse  = { x: -200, y: -200 };
    const lerped = { x: -200, y: -200 };
    let raf = 0;

    // Reveal cursors on first move
    const onFirstMove = () => {
      dot.style.opacity  = "1";
      ring.style.opacity = "1";
      window.removeEventListener("mousemove", onFirstMove);
    };
    window.addEventListener("mousemove", onFirstMove);

    // Dot moves DIRECTLY on mousemove — zero frame delay
    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      dot.style.transform = `translate3d(${mouse.x}px,${mouse.y}px,0) translate(-50%,-50%)`;
    };

    const onMouseDown = () => dot.classList.add("cursor-dot--click");
    const onMouseUp   = () => dot.classList.remove("cursor-dot--click");

    const onEnter = (e: Event) => {
      ring.classList.add("cursor-ring--hover");
      dot.classList.add("cursor-dot--hover");
      const label = (e.currentTarget as HTMLElement).getAttribute("data-cursor");
      if (textRef.current) textRef.current.textContent = label ?? "";
    };
    const onLeave = () => {
      ring.classList.remove("cursor-ring--hover");
      dot.classList.remove("cursor-dot--hover");
      if (textRef.current) textRef.current.textContent = "";
    };

    // rAF loop ONLY for the lagging ring
    const tick = () => {
      lerped.x += (mouse.x - lerped.x) * 0.20;
      lerped.y += (mouse.y - lerped.y) * 0.20;
      ring.style.transform = `translate3d(${lerped.x}px,${lerped.y}px,0) translate(-50%,-50%)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup",   onMouseUp);

    // WeakSet prevents duplicate listeners on already-attached elements
    const attached = new WeakSet<HTMLElement>();
    const attach = () => {
      document.querySelectorAll<HTMLElement>(
        "a, button, [role='button'], [data-cursor], input, textarea, select, label"
      ).forEach(el => {
        if (attached.has(el)) return;
        attached.add(el);
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
      });
    };

    const timer = setTimeout(() => {
      attach();
      const mo = new MutationObserver(attach);
      mo.observe(document.body, { childList: true, subtree: true });
      return () => mo.disconnect();
    }, 100);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousemove", onFirstMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup",   onMouseUp);
    };
  }, []);

  return (
    <>
      <div ref={dotRef}  className="cursor-dot"  aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true">
        <span ref={textRef} className="cursor-ring__text" />
      </div>
    </>
  );
}
