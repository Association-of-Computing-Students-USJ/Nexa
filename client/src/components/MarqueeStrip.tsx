type MarqueeStripProps = {
  items: string[];
  /** Use the slower animation variant (ACS section). */
  slow?: boolean;
  className?: string;
  itemClassName?: string;
  gapClassName?: string;
};

export default function MarqueeStrip({
  items,
  slow = false,
  className = "",
  itemClassName = "",
  gapClassName = slow ? "gap-12" : "gap-10 sm:gap-16",
}: MarqueeStripProps) {
  const trackClass = slow ? "animate-marquee-slow" : "animate-marquee";

  return (
    <div className={`overflow-hidden ${className}`}>
      <div className={`${trackClass} flex ${gapClassName} whitespace-nowrap`}>
        {[0, 1].map((copy) => (
          <div key={copy} className={`flex shrink-0 ${gapClassName}`}>
            {items.map((text) => (
              <span key={`${copy}-${text}`} className={itemClassName}>
                {text} •
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
