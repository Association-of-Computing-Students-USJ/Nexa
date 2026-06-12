import Reveal from "./Reveal";
import LazyImage from "./LazyImage";
import SectionHeader from "./SectionHeader";
import { SPEAKERS, type Speaker } from "../data/speakers";

type EventSpeakersProps = {
  sectionClassName?: string;
  includeAnchorId?: boolean;
};

function isAnnounced(speaker: Speaker) {
  return speaker.announced !== false;
}

function SpeakerCard({ speaker, index }: { speaker: Speaker; index: number }) {
  const isTba = !isAnnounced(speaker);

  return (
    <article
      className={`group h-full flex flex-col rounded-3xl overflow-hidden border bg-white transition-all duration-400 ${
        isTba
          ? "border-dashed border-gray-300"
          : "border-gray-200 hover:border-[#19D1E6]/40 hover:shadow-lg hover:-translate-y-1"
      }`}
      data-cursor="View"
    >
      <div className={`relative aspect-[4/5] overflow-hidden ${isTba ? "bg-gray-50" : "bg-gray-100"}`}>
        {speaker.image ? (
          <LazyImage
            src={speaker.image}
            alt={speaker.name}
            className="w-full h-full"
            imgClassName="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="material-symbols-outlined text-5xl text-[#19D1E6]/30 relative z-10">schedule</span>
            <p className="relative z-10 text-sm font-semibold text-gray-400 leading-snug">To be announced soon</p>
          </div>
        )}
        {!isTba && (
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        )}
        <span className="absolute top-2 left-2 sm:top-3 sm:left-3 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-white/90 backdrop-blur-sm text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-[#19D1E6] border border-[#19D1E6]/20">
          Speaker {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <div className="flex flex-col flex-1 p-3 sm:p-5 md:p-6">
        <h3
          className={`font-bold text-sm sm:text-lg leading-snug transition-colors ${
            isTba ? "text-gray-400" : "text-gray-900 group-hover:text-[#19D1E6]"
          }`}
        >
          {speaker.name}
        </h3>
        {!isTba && speaker.position && (
          <p className="text-[#19D1E6] text-xs sm:text-sm font-medium mt-1 line-clamp-2">{speaker.position}</p>
        )}
        {!isTba && speaker.description && (
          <p className="text-gray-500 text-xs sm:text-sm leading-relaxed mt-2 sm:mt-3 flex-1 line-clamp-3 sm:line-clamp-none">
            {speaker.description}
          </p>
        )}
      </div>
    </article>
  );
}

export default function EventSpeakers({ sectionClassName = "", includeAnchorId = false }: EventSpeakersProps) {
  return (
    <section id={includeAnchorId ? "speakers" : undefined} className={`section-deferred ${sectionClassName}`}>
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#19D1E6]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Featured Speakers"
          title={
            <>
              Learn from Industry
              <span className="text-[#19D1E6]"> Leaders</span>
            </>
          }
          description="Three expert voices sharing insights on innovation, strategy, and the future of tech in Sri Lanka."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 md:gap-6">
          {SPEAKERS.map((speaker, index) => (
            <Reveal key={speaker.id} variant="fade-up" delayMs={index * 70}>
              <SpeakerCard speaker={speaker} index={index} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
