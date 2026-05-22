import Reveal from "./Reveal";
import { SESSION_CARDS } from "../data/sessionCards";

type EventSessionsProps = {
  sectionClassName?: string;
  includeAnchorId?: boolean;
};

const SESSION_ICONS = ["eco", "manage_accounts", "security", "groups"];

/*
  SESSION IMAGE PLACEHOLDERS
  ─────────────────────────────────────────────────────────────────
  Each SESSION_CARD has an `img` field (currently Google-hosted URLs).
  Replace each `img` value in client/src/data/sessionCards.ts with
  your local asset path, e.g.:
    import session1 from "../assets/images/sessions/session1.jpg";
    { img: session1, ... }
  Or keep the URL. The <img> below will use it directly.
  ─────────────────────────────────────────────────────────────────
*/

export default function EventSessions({ sectionClassName = "", includeAnchorId = false }: EventSessionsProps) {
  return (
    <section id={includeAnchorId ? "sessions" : undefined} className={sectionClassName}>
      {/* Subtle top glow */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#19D1E6]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 md:mb-16">
          <Reveal variant="fade-up">
            <span className="text-[#19D1E6] font-semibold tracking-wider uppercase text-sm">Featured Sessions</span>
          </Reveal>
          <Reveal variant="fade-up" delayMs={80}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mt-4 mb-4 md:mb-6 leading-tight tracking-tight text-white">
              Learn from the
              <span className="text-[#19D1E6]"> Best</span>
            </h2>
          </Reveal>
          <Reveal variant="fade-up" delayMs={160}>
            <p className="text-sm sm:text-base md:text-lg text-[#888888] max-w-2xl mx-auto leading-relaxed">
              Carefully curated sessions covering the most impactful topics in technology today.
            </p>
          </Reveal>
        </div>

        {/* Session cards — 1-col on mobile, 2-col on md */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {SESSION_CARDS.map((card, index) => (
            <Reveal key={card.title} variant="fade-up" delayMs={index * 80}>
              <div className="group relative h-full p-5 md:p-8 rounded-3xl bg-[#161616] border border-[#2a2a2a]/50 hover:border-[#19D1E6]/50 transition-all duration-500 overflow-hidden hover:-translate-y-1.5">
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#19D1E6]/8 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="relative z-10">
                  {/* Icon + session number */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-4 rounded-2xl bg-[#19D1E6]/10 text-[#19D1E6] group-hover:bg-[#19D1E6] group-hover:text-[#0e0e0e] transition-all duration-300">
                      <span className="material-symbols-outlined text-2xl">{SESSION_ICONS[index] ?? "school"}</span>
                    </div>
                    <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#2a2a2a] group-hover:text-[#19D1E6]/20 transition-colors select-none">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  {/*
                    SESSION IMAGE
                    ─────────────────────────────────────────────────────────────
                    Image source comes from SESSION_CARDS[index].img
                    To swap: edit the `img` field in client/src/data/sessionCards.ts
                    ─────────────────────────────────────────────────────────────
                  */}
                  <div className="relative h-48 mb-6 rounded-2xl overflow-hidden bg-[#111]">
                    {card.img ? (
                      <>
                        <img
                          src={card.img}
                          alt={card.title}
                          className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/20 to-transparent" />
                      </>
                    ) : (
                      /* Placeholder shown when img is empty */
                      <>
                        <div className="absolute inset-0 bg-[#1a1a1a]" />
                        <div className="absolute inset-3 rounded-xl border-2 border-dashed border-[#2a2a2a]" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-4xl text-[#333]">add_photo_alternate</span>
                          <span className="font-mono text-xs text-[#444] px-3 py-1 bg-[#222] rounded-full">
                            SESSION_{String(index + 1).padStart(2, "0")}_IMAGE
                          </span>
                        </div>
                      </>
                    )}
                    {/* Session type badge */}
                    <div className="absolute bottom-3 left-4 z-10">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-[#0e0e0e]/70 backdrop-blur-sm text-[#19D1E6] border border-[#19D1E6]/30">
                        {card.place || card.date}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-3 text-white group-hover:text-[#19D1E6] transition-colors leading-snug">
                    {card.title}
                  </h3>

                  {card.desc && (
                    <p className="text-[#888888] text-sm leading-relaxed mb-4">{card.desc}</p>
                  )}

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="flex items-center gap-1.5 text-[#888888]">
                      <span className="material-symbols-outlined text-[#19D1E6] text-sm">calendar_today</span>
                      {card.date}
                    </span>
                    {card.place && card.date !== card.place && (
                      <>
                        <span className="text-[#2a2a2a]">•</span>
                        <span className="text-[#888888]">{card.place}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Corner accent */}
                <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-[#19D1E6]/5 rounded-full blur-xl group-hover:bg-[#19D1E6]/10 transition-colors pointer-events-none" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
