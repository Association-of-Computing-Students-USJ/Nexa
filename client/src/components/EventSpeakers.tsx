import Reveal from "./Reveal";
import { SPEAKERS } from "../data/speakers";

type EventSpeakersProps = {
  sectionClassName?: string;
  includeAnchorId?: boolean;
};

export default function EventSpeakers({ sectionClassName = "", includeAnchorId = false }: EventSpeakersProps) {
  return (
    <section id={includeAnchorId ? "speakers" : undefined} className={sectionClassName}>
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#19D1E6]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-16">
          <Reveal variant="fade-up">
            <span className="text-[#19D1E6] font-semibold tracking-wider uppercase text-sm">Featured Speakers</span>
          </Reveal>
          <Reveal variant="fade-up" delayMs={80}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-4 mb-4 md:mb-6 leading-tight tracking-tight text-gray-900">
              Learn from Industry
              <span className="text-[#19D1E6]"> Leaders</span>
            </h2>
          </Reveal>
          <Reveal variant="fade-up" delayMs={160}>
            <p className="text-sm sm:text-base md:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Four expert voices sharing insights on innovation, strategy, and the future of tech in Sri Lanka.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {SPEAKERS.map((speaker, index) => (
            <Reveal key={speaker.id} variant="fade-up" delayMs={index * 70}>
              <article
                className="group h-full flex flex-col rounded-3xl overflow-hidden border border-gray-200 bg-white hover:border-[#19D1E6]/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-400"
                data-cursor="View"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                  {speaker.image ? (
                    <img
                      src={speaker.image}
                      alt={speaker.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50">
                      <div className="absolute inset-4 rounded-2xl border-2 border-dashed border-gray-200" />
                      <span className="material-symbols-outlined text-5xl text-gray-300 relative z-10">
                        add_photo_alternate
                      </span>
                      <span className="relative z-10 font-mono text-xs px-3 py-1.5 rounded-full bg-gray-200 text-gray-400 tracking-wider">
                        SPEAKER_{String(index + 1).padStart(2, "0")}_PHOTO
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-[#19D1E6] border border-[#19D1E6]/20">
                    Speaker {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="flex flex-col flex-1 p-5 md:p-6">
                  <h3 className="font-bold text-gray-900 text-lg leading-snug group-hover:text-[#19D1E6] transition-colors">
                    {speaker.name}
                  </h3>
                  <p className="text-[#19D1E6] text-sm font-medium mt-1">{speaker.position}</p>
                  <p className="text-gray-500 text-sm leading-relaxed mt-3 flex-1">{speaker.description}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
