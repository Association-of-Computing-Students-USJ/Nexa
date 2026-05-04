const HIGHLIGHTS = [
  {
    label: "Purpose",
    title: "Industry-shaped learning",
    body: "NEXA connects students with practical conversations around the technologies, workflows, and decisions shaping modern software teams."
  },
  {
    label: "Format",
    title: "Focused tech sessions",
    body: "The program brings together expert talks, discussion spaces, and student engagement in a compact one-day experience."
  },
  {
    label: "Community",
    title: "Built by ACS",
    body: "Organized by the Association of Computer Science, NEXA is designed for students who want clearer paths from campus learning to real-world practice."
  }
];

export default function AboutPage() {
  return (
    <section className="space-y-10">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">About NEXA</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          A tech talk series for the next wave of builders.
        </h1>
        <p className="mt-5 text-base leading-7 text-zinc-300 sm:text-lg">
          NEXA is a one-day technology talk series by the Association of Computer Science, created to bridge academic learning with the pace and expectations of the technology industry.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {HIGHLIGHTS.map((item) => (
          <article key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
              {item.label}
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-tight text-white">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">{item.body}</p>
          </article>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <div className="grid gap-8 md:grid-cols-[1fr_0.8fr] md:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">What participants can expect</h2>
            <p className="mt-3 leading-7 text-zinc-300">
              The event focuses on current technology themes, practical skills, and conversations that help students understand where computing is heading and how they can prepare for it.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <div className="text-3xl font-semibold text-white">300+</div>
              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-400">Participants</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <div className="text-3xl font-semibold text-white">4</div>
              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-400">Sessions</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
