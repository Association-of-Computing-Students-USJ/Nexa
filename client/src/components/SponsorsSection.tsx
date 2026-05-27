import Reveal from "./Reveal";
import LazyImage from "./LazyImage";
import SectionHeader from "./SectionHeader";
import { PARTNER_SPONSORS, TITLE_SPONSOR } from "../data/sponsors";

type SponsorsSectionProps = {
  includeAnchorId?: boolean;
};

export default function SponsorsSection({ includeAnchorId = false }: SponsorsSectionProps) {
  return (
    <section
      id={includeAnchorId ? "sponsors" : undefined}
      className="section-deferred relative py-16 md:py-32 bg-gray-50 overflow-hidden scroll-mt-20"
    >
      <div className="absolute inset-0 grid-pattern-light" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#19D1E6]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Our Partners"
          title={
            <>
              Proudly Supported by
              <span className="text-[#19D1E6]"> Industry Leaders</span>
            </>
          }
          description="NEXA 2026 is made possible through the generous support of our sponsors and partners."
        />

        <Reveal variant="fade-up" delayMs={200}>
          <div className="max-w-4xl mx-auto mb-10 md:mb-14">
            <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[#19D1E6] mb-4">
              {TITLE_SPONSOR.role}
            </p>
            <div
              className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:border-[#19D1E6]/40 hover:shadow-md transition-all duration-400"
              data-cursor="View"
            >
              <LazyImage
                src={TITLE_SPONSOR.logo}
                alt={`${TITLE_SPONSOR.name} logo`}
                imgClassName="w-full h-auto object-contain"
              />
            </div>
            <p className="text-center font-semibold text-gray-900 mt-4 text-sm md:text-base">{TITLE_SPONSOR.name}</p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          {PARTNER_SPONSORS.map((sponsor, i) => (
            <Reveal key={sponsor.name} variant="fade-up" delayMs={280 + i * 80}>
              <div className="flex flex-col h-full" data-cursor="View">
                <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[#19D1E6] mb-4">
                  {sponsor.role}
                </p>
                <div className="flex-1 rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:border-[#19D1E6]/40 hover:shadow-md transition-all duration-400 flex items-center justify-center p-4 md:p-6">
                  <LazyImage
                    src={sponsor.logo}
                    alt={`${sponsor.name} logo`}
                    className="w-full flex items-center justify-center min-h-[8rem]"
                    imgClassName="w-full max-h-40 md:max-h-48 object-contain"
                  />
                </div>
                <p className="text-center font-semibold text-gray-900 mt-4 text-sm md:text-base">{sponsor.name}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
