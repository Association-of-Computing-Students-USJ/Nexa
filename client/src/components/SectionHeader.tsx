import type { ReactNode } from "react";
import Reveal from "./Reveal";

type SectionHeaderProps = {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  align?: "center" | "left";
  dark?: boolean;
};

export default function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  dark = false,
}: SectionHeaderProps) {
  const alignClass = align === "center" ? "text-center" : "text-left";
  const descClass = dark ? "text-[#888888]" : "text-gray-500";

  return (
    <div className={`${alignClass} mb-10 md:mb-16`}>
      <Reveal variant="fade-up">
        <span className="text-[#19D1E6] font-semibold tracking-wider uppercase text-sm">{eyebrow}</span>
      </Reveal>
      <Reveal variant="fade-up" delayMs={80}>
        <h2
          className={`text-3xl sm:text-4xl md:text-5xl font-bold mt-4 mb-4 md:mb-6 leading-tight tracking-tight ${
            dark ? "text-white" : "text-gray-900"
          }`}
        >
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal variant="fade-up" delayMs={160}>
          <p className={`text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed ${descClass} ${align === "center" ? "mx-auto" : ""}`}>
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}
