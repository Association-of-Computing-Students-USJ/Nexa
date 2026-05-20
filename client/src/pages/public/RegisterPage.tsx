import { Link } from "react-router-dom";
import Reveal from "../../components/Reveal";
import nexaLogo from "../../assets/images/logo/NEXA Colour.png";

const EVENT_INFO = [
  {
    icon: "calendar_today",
    label: "Event Date",
    value: "June 2026",
    sub: "One action-packed day",
  },
  {
    icon: "location_on",
    label: "Venue",
    value: "USJP, Sri Lanka",
    sub: "University of Sri Jayewardenepura",
  },
  {
    icon: "workspace_premium",
    label: "Access Level",
    value: "All-Access Pass",
    sub: "All sessions included",
  },
  {
    icon: "group",
    label: "Expected Attendees",
    value: "300+",
    sub: "Students & professionals",
  },
];

const STEPS = [
  { n: "01", title: "Fill the form",    desc: "Complete all fields in the Google Form below." },
  { n: "02", title: "Get confirmation", desc: "Receive a confirmation email within 24 hours."  },
  { n: "03", title: "Attend NEXA",      desc: "Show your pass at the entrance on the day."     },
];

export default function RegisterPage() {
  return (
    <div className="w-full min-w-0">

      {/* ═══════════════════════════════════════════════════
          HERO — dark section
          ═══════════════════════════════════════════════════ */}
      <section className="relative bg-[#0e0e0e] overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 grid-pattern" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[#19D1E6]/6 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-[#19D1E6]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl">
            <Reveal variant="fade-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#19D1E6]/30 bg-[#19D1E6]/8 mb-8">
                <span className="w-2 h-2 bg-[#19D1E6] rounded-full animate-pulse" />
                <span className="text-sm font-medium text-[#19D1E6]">Registration Now Open — June 2026</span>
              </div>
            </Reveal>

            <Reveal variant="fade-up" delayMs={80}>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[0.95] tracking-tight mb-6">
                <span className="text-white">Secure Your</span>
                <span className="block text-[#19D1E6]">Spot at</span>
                <span className="block text-white">NEXA 2026.</span>
              </h1>
            </Reveal>

            <Reveal variant="fade-up" delayMs={180}>
              <p className="text-lg text-[#888888] max-w-xl leading-relaxed mb-12">
                Join Sri Lanka's premier one-day tech talk series. Register below to secure your
                all-access pass to every session, panel discussion, and networking opportunity.
              </p>
            </Reveal>

            {/* Steps */}
            <div className="flex flex-col sm:flex-row gap-6">
              {STEPS.map((s, i) => (
                <Reveal key={s.n} variant="fade-up" delayMs={260 + i * 80}>
                  <div className="flex items-start gap-4">
                    <span className="text-2xl font-bold text-[#19D1E6]/30 leading-none select-none">{s.n}</span>
                    <div>
                      <h3 className="font-semibold text-white text-sm mb-1">{s.title}</h3>
                      <p className="text-[#888888] text-xs leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        {/* Marquee strip */}
        <div className="mt-20 border-t border-[#2a2a2a]/30 bg-[#0e0e0e]/60 py-4 overflow-hidden">
          <div className="animate-marquee flex gap-16 whitespace-nowrap">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex shrink-0 gap-16">
                {["NEXA 2026", "ACS × USJP", "REGISTER TODAY", "FREE ENTRY", "4 SESSIONS", "300+ ATTENDEES"].map(t => (
                  <span key={t} className="text-sm font-medium tracking-widest text-[#888888]/50">{t} •</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          EVENT INFO BENTO — light section
          ═══════════════════════════════════════════════════ */}
      <section className="relative bg-white py-20 overflow-hidden">
        <div className="absolute inset-0 grid-pattern-light" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <Reveal variant="fade-up">
              <span className="text-[#19D1E6] font-semibold tracking-wider uppercase text-sm">Event Details</span>
            </Reveal>
            <Reveal variant="fade-up" delayMs={80}>
              <h2 className="text-3xl md:text-4xl font-bold mt-3 text-gray-900">
                What to <span className="text-[#19D1E6]">Expect</span>
              </h2>
            </Reveal>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {EVENT_INFO.map((item, i) => (
              <Reveal key={item.label} variant="fade-up" delayMs={i * 70}>
                <div className="group p-6 rounded-2xl bg-gray-50 border border-gray-200 hover:border-[#19D1E6]/50 hover:bg-white hover:shadow-md transition-all duration-400">
                  <div className="p-3 rounded-xl bg-[#19D1E6]/10 text-[#19D1E6] w-fit mb-5 group-hover:bg-[#19D1E6] group-hover:text-white transition-colors duration-300">
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  </div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">{item.label}</p>
                  <p className="text-xl font-bold text-gray-900 mb-1">{item.value}</p>
                  <p className="text-sm text-gray-500">{item.sub}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          REGISTRATION FORM — dark section
          ═══════════════════════════════════════════════════ */}
      <section className="relative bg-[#0e0e0e] py-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#19D1E6]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <Reveal variant="fade-up">
              <span className="text-[#19D1E6] font-semibold tracking-wider uppercase text-sm">Registration Form</span>
            </Reveal>
            <Reveal variant="fade-up" delayMs={80}>
              <h2 className="text-3xl md:text-4xl font-bold mt-3 text-white">
                Fill in Your <span className="text-[#19D1E6]">Details</span>
              </h2>
            </Reveal>
            <Reveal variant="fade-up" delayMs={160}>
              <p className="text-[#888888] mt-3 max-w-lg mx-auto text-sm leading-relaxed">
                Complete the form below to register. A confirmation will be sent to your email address.
              </p>
            </Reveal>
          </div>

          {/* Form card */}
          <Reveal variant="fade-up" delayMs={240}>
            <div className="relative rounded-3xl overflow-hidden border border-[#2a2a2a]/60 bg-[#161616]">
              {/* Top bar */}
              <div className="flex items-center gap-2 px-6 py-4 border-b border-[#2a2a2a]/60 bg-[#111]">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                <span className="ml-3 text-xs text-[#444] font-mono">NEXA 2026 — Registration</span>
              </div>

              {/*
                GOOGLE FORM EMBED
                To update the form URL, change the `src` on the <iframe> below.
              */}
              <div className="bg-white">
                <iframe
                  title="NEXA 2026 Registration Form"
                  src="https://docs.google.com/forms/d/e/1FAIpQLSfHDPBXjm9L_lqIu9MkndPnwDX1xHKCCuaBK-SGLb7AnBidog/viewform?embedded=true"
                  className="block w-full max-w-[640px] mx-auto h-[1300px] border-0"
                  frameBorder={0}
                  marginHeight={0}
                  marginWidth={0}
                >
                  Loading…
                </iframe>
              </div>
            </div>
          </Reveal>

          <Reveal variant="fade-up" delayMs={100}>
            <p className="mt-6 text-center text-xs text-[#555] leading-relaxed">
              By registering you agree to our processing of personal data in accordance with our privacy policy.
              <br />Questions? Email us at{" "}
              <a href="mailto:nexa.acs.sjp@gmail.com" className="text-[#19D1E6] hover:underline">
                nexa.acs.sjp@gmail.com
              </a>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FOOTER CTA — light section
          ═══════════════════════════════════════════════════ */}
      <section className="relative bg-gray-50 py-20 overflow-hidden">
        <div className="absolute inset-0 grid-pattern-light" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <Reveal variant="fade-up">
            <span className="text-[#19D1E6] font-semibold tracking-wider uppercase text-sm">Any Questions?</span>
          </Reveal>
          <Reveal variant="fade-up" delayMs={80}>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4 text-gray-900">
              We're here to <span className="text-[#19D1E6]">help</span>
            </h2>
          </Reveal>
          <Reveal variant="fade-up" delayMs={160}>
            <p className="text-gray-500 max-w-lg mx-auto mb-8 leading-relaxed">
              Reach out to the organizing committee for any registration queries or partnership opportunities.
            </p>
          </Reveal>
          <Reveal variant="fade-up" delayMs={240}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="mailto:nexa.acs.sjp@gmail.com" data-cursor="Email"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#19D1E6] text-[#0e0e0e] font-semibold rounded-full hover:bg-[#19D1E6]/90 transition-all hover:scale-105 glow">
                <span className="material-symbols-outlined text-[1.1rem]">mail</span>
                Contact Us
              </a>
              <Link to="/" data-cursor="View"
                className="inline-flex items-center gap-2 px-8 py-4 border border-gray-300 text-gray-700 font-semibold rounded-full hover:border-[#19D1E6] hover:text-[#19D1E6] transition-all">
                Back to Home
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Mini footer */}
      <footer className="bg-[#0e0e0e] border-t border-[#2a2a2a]/30 py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img src={nexaLogo} alt="NEXA" className="h-6 w-6 object-contain" />
            <span className="text-sm font-bold text-[#19D1E6]">NEXA</span>
            <span className="text-[#555] text-sm ml-2">· ACS SJP</span>
          </div>
          <p className="text-[#555] text-sm">© 2026 NEXA · ACS SJP. All rights reserved.</p>
          <p className="text-[#555] text-sm">
            Crafted with <span className="text-[#19D1E6]">♥</span> by the ACS Team
          </p>
        </div>
      </footer>

    </div>
  );
}
