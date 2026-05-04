import Reveal from "./Reveal";
import { SESSION_CARDS } from "../data/sessionCards";

type EventSessionsProps = {
  sectionClassName?: string;
  includeAnchorId?: boolean;
};

export default function EventSessions({ sectionClassName = "", includeAnchorId = false }: EventSessionsProps) {
  return (
    <section id={includeAnchorId ? "sessions" : undefined} className={sectionClassName}>
      <Reveal className="mx-auto mb-16 flex max-w-7xl items-end justify-between" variant="fade-up">
        <div>
          <span className="font-label mb-4 block text-[0.6875rem] font-bold uppercase tracking-[0.3em] text-[var(--brand)]">
            Knowledge Transfer
          </span>
          <h2 className="font-headline text-5xl font-bold uppercase tracking-tighter text-white md:text-6xl">Event Sessions</h2>
        </div>
      </Reveal>

      <Reveal className="mx-auto grid max-w-7xl grid-cols-1 gap-4 pb-10 md:grid-cols-2 xl:grid-cols-4" variant="fade-up" delayMs={80}>
        {SESSION_CARDS.map((card) => (
          <div key={card.title} className="group w-full cursor-pointer border border-white/5 bg-[#131313]">
            <div className="relative h-72 overflow-hidden sm:h-80 lg:h-96">
              <img
                alt={card.title}
                className="h-full w-full object-cover grayscale transition-transform duration-700 group-hover:scale-105 group-hover:grayscale-0"
                src={card.img}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-transparent to-transparent" />
            </div>
            <div className="p-8">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-label text-[0.65rem] font-bold uppercase tracking-widest text-[var(--brand)]">{card.date}</span>
                <span className="font-label text-[0.65rem] uppercase tracking-widest text-white/40">{card.place}</span>
              </div>
              <h4 className="font-headline mb-4 text-3xl font-bold uppercase tracking-tighter text-white">{card.title}</h4>
              <p className="font-body text-sm text-white/60">{card.desc}</p>
            </div>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
