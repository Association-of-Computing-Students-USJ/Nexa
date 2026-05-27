import Reveal from "./Reveal";
import LazyImage from "./LazyImage";
import { COMMITTEE } from "../data/committee";

export default function CommitteeSection() {
  return (
    <section id="contact" className="section-deferred relative py-16 md:py-24 bg-[#0e0e0e] overflow-hidden scroll-mt-20">
      <div className="absolute inset-0 grid-pattern" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#19D1E6]/4 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 md:mb-14">
          <Reveal variant="fade-up">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#19D1E6]" />
              <span className="text-sm text-[#888888] font-medium tracking-wide">Organizing Team</span>
            </div>
          </Reveal>
          <Reveal variant="fade-up" delayMs={80}>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight mb-4">
              Meet the Organizing <span className="text-[#19D1E6]">Committee</span>
            </h2>
          </Reveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <Reveal variant="fade-up" delayMs={160}>
              <p className="text-[#888888] text-lg max-w-xl leading-relaxed">
                Dedicated students working tirelessly to create an unforgettable experience.
              </p>
            </Reveal>
            <Reveal variant="fade-up" delayMs={200}>
              <a
                href="mailto:nexa.acs.sjp@gmail.com"
                data-cursor="Email"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#19D1E6] hover:text-[#19D1E6]/70 transition-colors min-w-0 break-all"
              >
                <span className="material-symbols-outlined text-base shrink-0">mail</span>
                nexa.acs.sjp@gmail.com
              </a>
            </Reveal>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {COMMITTEE.map((member, i) => (
            <Reveal key={member.name} variant="fade-up" delayMs={i * 50}>
              <article
                className="group rounded-2xl overflow-hidden border border-[#2a2a2a] bg-[#161616] hover:border-[#19D1E6]/40 transition-all duration-400 hover:-translate-y-1"
                data-cursor="View"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-[#111]">
                  <LazyImage
                    src={member.image}
                    alt={member.name}
                    skeletonDark
                    className="w-full h-full"
                    imgClassName="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                </div>
                <div className="px-2.5 py-2.5 sm:px-4 sm:py-3.5 bg-[#161616] border-t border-[#2a2a2a]">
                  <h3 className="font-semibold text-white text-xs sm:text-sm truncate group-hover:text-[#19D1E6] transition-colors">
                    {member.name}
                  </h3>
                  <p className="text-[#888888] text-[10px] sm:text-xs mt-0.5 truncate">{member.role}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
