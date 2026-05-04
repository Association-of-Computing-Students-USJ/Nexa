import Reveal from "../../components/Reveal";
import EventSessions from "../../components/EventSessions";

export default function RegisterPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0e0e0e] pb-24 pt-28 sm:pt-32 md:pt-36">
      {/* Background orbs */}
      <div className="gradient-orb fixed right-[-10%] top-[-10%] z-0 h-[680px] w-[680px] rounded-full" />
      <div className="gradient-orb fixed bottom-[-20%] left-[-10%] z-0 h-[900px] w-[900px] rounded-full opacity-40" />

      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Header */}
        <Reveal className="mb-10 text-center sm:mb-14 md:mb-16 md:text-left" variant="fade-up">
          <span className="font-label mb-4 block text-xs uppercase tracking-[0.4em] text-[var(--brand)]">
            Event Access 2026
          </span>
          <h1 className="font-headline mb-6 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:mb-8 sm:text-5xl md:text-7xl">
            Secure Your <br />
            <i className="not-italic font-normal text-[var(--brand)]">Registration</i> Pass
          </h1>
          <p className="max-w-2xl text-base font-light leading-relaxed text-white/60 sm:text-xl">
            Join the premier observation of technological evolution. Registration grants access to all keynote streams,
            interactive workshops, and the archival research vault.
          </p>
        </Reveal>

        {/* Registration Card */}
        <Reveal className="glass-panel relative rounded-lg p-6 shadow-2xl sm:p-8 md:p-14" variant="fade-up" delayMs={80}>
          <div className="absolute right-0 top-0 p-8 opacity-10">
            <span className="material-symbols-outlined text-6xl text-[var(--brand)]">terminal</span>
          </div>

          <div className="-mx-2 overflow-hidden rounded-md border border-white/10 bg-white sm:-mx-4 md:-mx-6">
            <iframe
              title="Registration form"
              src="https://docs.google.com/forms/d/e/1FAIpQLSfHDPBXjm9L_lqIu9MkndPnwDX1xHKCCuaBK-SGLb7AnBidog/viewform?embedded=true"
              className="mx-auto block h-[1271px] w-full max-w-[640px] border-0"
              frameBorder={0}
              marginHeight={0}
              marginWidth={0}
            >
              Loading…
            </iframe>
          </div>
          <p className="mt-8 text-center text-[10px] uppercase tracking-[0.2em] text-white/30">
            By registering, you agree to our processing of personal data and editorial standards.
          </p>
        </Reveal>

        {/* Info Bento */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {[
            { icon: "calendar_today", title: "Registration Dates", value: "August 10th, 2026" },
            { icon: "pin_drop", title: "Primary Node", value: "USJP, Sri Lanka" },
            { icon: "workspace_premium", title: "Access Level", value: "All-Access Pass" }
          ].map((b) => (
            <Reveal
              key={b.title}
              className="glass-panel group rounded-lg p-8 transition-colors hover:bg-white/5"
              variant="fade-up"
              delayMs={140}
            >
              <span className="material-symbols-outlined mb-4 block text-[var(--brand)]">{b.icon}</span>
              <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">{b.title}</h3>
              <p className="font-headline text-lg italic text-white">{b.value}</p>
            </Reveal>
          ))}
        </div>

        <EventSessions sectionClassName="mt-20 sm:mt-24" />
      </div>
    </main>
  );
}

