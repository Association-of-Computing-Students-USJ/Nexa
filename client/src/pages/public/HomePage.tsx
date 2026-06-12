import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "../../components/Reveal";
import LazyImage from "../../components/LazyImage";
import MarqueeStrip from "../../components/MarqueeStrip";
import SectionFallback from "../../components/SectionFallback";
import AnimatedStat from "../../components/home/AnimatedStat";
import { useSmoothScroll } from "../../hooks/useSmoothScroll";
import { useHomeScroll } from "../../hooks/useHomeScroll";
import { HOME_NAV_LINKS, FOOTER_SUMMIT_LINKS } from "../../data/navigation";
import { EVENT_DATE } from "../../data/eventInfo";
import nexaLogo from "../../assets/images/logo/NEXA Colour.png";
import heroImage from "../../assets/images/logo/hero.jpg";
import acsLogo from "../../assets/images/logo/ACS.png";

const CustomCursor = lazy(() => import("../../components/CustomCursor"));
const EventSessions = lazy(() => import("../../components/EventSessions"));
const EventSpeakers = lazy(() => import("../../components/EventSpeakers"));
const SponsorsSection = lazy(() => import("../../components/SponsorsSection"));
const CommitteeSection = lazy(() => import("../../components/CommitteeSection"));

const HERO_MARQUEE = ["NEXA 2026", "ACS × USJP", "INNOVATION", "TECH TALKS", "NETWORKING", "KNOWLEDGE TRANSFER"];
const ACS_MARQUEE = ["INNOVATION", "COLLABORATION", "EXCELLENCE", "COMMUNITY", "GROWTH", "IMPACT"];

const ABOUT_FEATURES = [
  {
    icon: "target",
    title: "Focused Tech Talks",
    desc: "Deep-dive sessions delivering actionable industry insights you can apply immediately.",
  },
  {
    icon: "lightbulb",
    title: "Innovation & Networking",
    desc: "Connect with professionals and discover emerging technologies shaping tech in Sri Lanka.",
  },
  {
    icon: "rocket_launch",
    title: "Career Growth",
    desc: "Unlock real-world career pathways bridging your academic journey with the industry.",
  },
] as const;

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const heroImageRef = useRef<HTMLImageElement>(null);
  const { scrolled, activeSection, progressRef } = useHomeScroll(heroImageRef);

  useSmoothScroll();

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = heroImage;
    document.head.appendChild(link);
    return () => link.remove();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <div id="top" className="w-full min-w-0">
      <Suspense fallback={null}>
        <CustomCursor />
      </Suspense>
      <div
        ref={progressRef}
        className="fixed top-0 left-0 z-[10003] h-[2px] bg-[#19D1E6] will-change-[width]"
        style={{ width: "0%" }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={0}
        aria-label="Page scroll progress"
      />
      <div className="noise-overlay" />

      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
          scrolled
            ? "bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-100"
            : "bg-white/90 backdrop-blur-md border-b border-gray-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-4">
            <a href="#top" className="flex items-center gap-2.5" data-cursor="Home">
              <img src={nexaLogo} alt="NEXA" className="h-8 w-8 object-contain" width={32} height={32} />
              <span className="text-xl font-bold tracking-tight text-[#19D1E6]">NEXA</span>
            </a>

            <div className="hidden md:flex items-center gap-8">
              {HOME_NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  data-cursor="View"
                  className={`text-sm font-medium transition-colors duration-300 relative group ${
                    activeSection === l.section ? "text-[#19D1E6]" : "text-gray-600 hover:text-[#19D1E6]"
                  }`}
                >
                  {l.label}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-[#19D1E6] transition-all duration-300 ${
                      activeSection === l.section ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </a>
              ))}
              <Link
                to="/register"
                data-cursor="Register"
                className="px-6 py-2.5 bg-[#19D1E6] text-[#0e0e0e] font-semibold text-sm rounded-full hover:bg-[#19D1E6]/90 transition-all duration-300 hover:scale-105 glow"
              >
                Register Now
              </Link>
            </div>

            <button
              type="button"
              className="md:hidden p-2 text-gray-700 hover:text-[#19D1E6] transition-colors"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="material-symbols-outlined">{menuOpen ? "close" : "menu"}</span>
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col items-center justify-center gap-8 md:hidden">
          {HOME_NAV_LINKS.map((l, i) => (
            <Reveal key={l.href} variant="fade-up" delayMs={i * 60}>
              <a
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="text-3xl font-semibold text-gray-900 hover:text-[#19D1E6] transition-colors"
              >
                {l.label}
              </a>
            </Reveal>
          ))}
          <Reveal variant="fade-up" delayMs={HOME_NAV_LINKS.length * 60}>
            <Link
              to="/register"
              onClick={() => setMenuOpen(false)}
              className="px-8 py-3 bg-[#19D1E6] text-[#0e0e0e] font-semibold rounded-full text-lg glow"
            >
              Register Now
            </Link>
          </Reveal>
        </div>
      )}

      <main>
        <section className="relative min-h-[100dvh] min-h-screen flex flex-col overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <LazyImage
              ref={heroImageRef}
              src={heroImage}
              alt=""
              priority
              skeletonDark
              className="w-full h-full"
              imgClassName="w-full h-full object-cover object-[center_30%] sm:object-center will-change-transform"
              imgStyle={{ transform: "scale(1.08) translateY(0px)" }}
            />
            <div className="absolute inset-0 bg-black/50" aria-hidden />
            <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/25 to-black/75" aria-hidden />
            <div
              className="absolute inset-0"
              aria-hidden
              style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 100%)" }}
            />
          </div>

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(5.5rem+env(safe-area-inset-top,0px))] pb-24 sm:pb-28 md:pb-32 text-center">
            <Reveal variant="fade-up" delayMs={80} className="w-full">
              <h1
                className="mx-auto max-w-[12ch] sm:max-w-none text-[clamp(2.25rem,9.5vw,5.5rem)] sm:text-5xl md:text-7xl lg:text-[5.5rem] font-bold leading-[0.95] sm:leading-[0.92] tracking-tight text-white mb-5 sm:mb-6"
                style={{ textShadow: "0 2px 40px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.8)" }}
              >
                Building Tomorrow&apos;s
                <span
                  className="block text-[#19D1E6] mt-1"
                  style={{ textShadow: "0 0 60px rgba(25,209,230,0.5), 0 2px 20px rgba(0,0,0,0.5)" }}
                >
                  Leaders.
                </span>
              </h1>
            </Reveal>

            <Reveal variant="fade-up" delayMs={200} className="w-full">
              <ul className="mx-auto mb-8 sm:mb-10 flex w-full max-w-sm sm:max-w-none flex-col items-center gap-2.5 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-3 sm:gap-y-2 text-white/80 text-[11px] sm:text-xs font-semibold tracking-[0.08em] sm:tracking-[0.14em] uppercase">
                <li className="flex items-center justify-center gap-1.5 text-center">
                  <span className="material-symbols-outlined text-[#19D1E6] text-sm shrink-0">calendar_today</span>
                  <span>{EVENT_DATE}</span>
                </li>
                <li className="hidden sm:block text-white/30" aria-hidden="true">
                  ·
                </li>
                <li className="flex items-center justify-center gap-1.5 text-center">
                  <span className="material-symbols-outlined text-[#19D1E6] text-sm shrink-0">location_on</span>
                  <span className="sm:hidden">USJP, Sri Lanka</span>
                  <span className="hidden sm:inline">University of Sri Jayewardenepura</span>
                </li>
                <li className="hidden sm:block text-white/30" aria-hidden="true">
                  ·
                </li>
                <li className="flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[#19D1E6] text-sm shrink-0">group</span>
                  <span>300+ Attendees</span>
                </li>
              </ul>
            </Reveal>

            <Reveal variant="fade-up" delayMs={300} className="w-full flex justify-center">
              <div className="flex w-full max-w-xs sm:max-w-none flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
                <Link
                  to="/register"
                  data-cursor="Register"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-7 sm:px-8 py-3.5 sm:py-4 bg-[#19D1E6] text-[#0e0e0e] font-bold rounded-full text-sm sm:text-base hover:bg-[#19D1E6]/90 transition-all duration-300 hover:scale-105 glow shadow-2xl"
                >
                  Register Now
                  <span className="material-symbols-outlined text-[1.1rem]">arrow_forward</span>
                </Link>
                <a
                  href="#sessions"
                  data-cursor="View"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-7 sm:px-8 py-3.5 sm:py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-full text-sm sm:text-base hover:bg-white/20 hover:border-white/50 transition-all duration-300"
                >
                  Explore Sessions
                </a>
              </div>
            </Reveal>
          </div>

          <div className="absolute bottom-[3.75rem] sm:bottom-14 left-1/2 z-10 -translate-x-1/2 hidden min-[580px]:flex">
            <a
              href="#about"
              data-cursor="Scroll"
              className="flex flex-col items-center gap-1 text-white/50 hover:text-white transition-colors"
              aria-label="Scroll to about section"
            >
              <span className="material-symbols-outlined animate-bounce text-3xl drop-shadow-lg">keyboard_arrow_down</span>
            </a>
          </div>

          <MarqueeStrip
            items={HERO_MARQUEE}
            className="absolute bottom-0 left-0 right-0 z-10 bg-black/40 backdrop-blur-md border-t border-white/10 py-3 sm:py-3.5"
            itemClassName="text-[10px] sm:text-xs font-bold tracking-[0.18em] sm:tracking-[0.22em] text-white/40"
          />
        </section>

        <section id="about" className="relative py-16 md:py-32 bg-white overflow-hidden scroll-mt-20">
          <div className="absolute inset-0 grid-pattern-light" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#19D1E6]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 md:mb-14">
              <Reveal variant="fade-up">
                <span className="text-[#19D1E6] font-semibold tracking-wider uppercase text-sm">About NEXA</span>
              </Reveal>
              <Reveal variant="fade-up" delayMs={80}>
                <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mt-4 mb-6 leading-tight tracking-tight text-gray-900">
                  Where Vision
                  <span className="block text-[#19D1E6]">Meets Reality</span>
                </h2>
              </Reveal>
              <Reveal variant="fade-up" delayMs={160}>
                <p className="text-base md:text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
                  For the first time, the Association of Computing Students (ACS) of the University of
                  Sri Jayewardenepura presents NEXA — a one-day tech talk series bridging the gap between
                  academic learning and the rapidly evolving technology industry.
                </p>
              </Reveal>
            </div>

            <Reveal variant="fade-up" delayMs={240}>
              <div className="flex flex-wrap justify-center gap-8 md:gap-10 mb-10 md:mb-14 text-center">
                <AnimatedStat value="300+" label="Expected Participants" light />
                <AnimatedStat value="4" label="Expert Sessions" light />
                <AnimatedStat value="1" label="Action-Packed Day" light />
              </div>
            </Reveal>

            <div className="space-y-3 md:space-y-4 max-w-2xl mx-auto">
              {ABOUT_FEATURES.map((f, i) => (
                <Reveal key={f.title} variant="fade-up" delayMs={320 + i * 80}>
                  <div
                    className="group p-4 md:p-5 rounded-2xl bg-gray-50 border border-gray-200 hover:border-[#19D1E6]/50 hover:bg-white transition-all duration-400 hover:shadow-sm"
                    data-cursor="Learn"
                  >
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="p-2.5 rounded-xl bg-[#19D1E6]/10 text-[#19D1E6] group-hover:bg-[#19D1E6] group-hover:text-white transition-colors duration-300 shrink-0">
                        <span className="material-symbols-outlined text-lg">{f.icon}</span>
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-[#19D1E6] transition-colors text-sm md:text-base">
                          {f.title}
                        </h3>
                        <p className="text-gray-500 text-xs md:text-sm leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <Suspense fallback={<SectionFallback />}>
          <EventSessions
            includeAnchorId
            sectionClassName="relative py-16 md:py-32 bg-[#0e0e0e] overflow-hidden scroll-mt-20"
          />
          <EventSpeakers
            includeAnchorId
            sectionClassName="relative py-16 md:py-32 bg-white overflow-hidden scroll-mt-20"
          />
          <SponsorsSection includeAnchorId />
          <CommitteeSection />
        </Suspense>

        <section className="relative py-16 md:py-32 bg-white overflow-hidden">
          <div className="absolute inset-0 grid-pattern-light" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#19D1E6]/4 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div>
                <Reveal variant="fade-right">
                  <span className="text-[#19D1E6] font-semibold tracking-wider uppercase text-sm">About ACS</span>
                </Reveal>
                <Reveal variant="fade-right" delayMs={80}>
                  <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mt-4 mb-6 leading-tight tracking-tight text-gray-900">
                    Driving Innovation
                    <span className="block text-[#19D1E6]">in Sri Lanka</span>
                  </h2>
                </Reveal>
                <Reveal variant="fade-right" delayMs={160}>
                  <p className="text-base md:text-lg text-gray-500 leading-relaxed mb-5">
                    The Association of Computing Students (ACS) at the University of Sri Jayewardenepura
                    is a vibrant community dedicated to fostering innovation, collaboration, and excellence
                    in computing. As a student-driven initiative under the Faculty of Computing, ACS
                    connects students with industry professionals and emerging technologies.
                  </p>
                </Reveal>
                <Reveal variant="fade-right" delayMs={240}>
                  <p className="text-base md:text-lg text-gray-500 leading-relaxed mb-8 hidden sm:block">
                    Through workshops, networking events, and collaborative projects, ACS empowers
                    students and cultivates future technology leaders — inspiring creativity and
                    practical learning.
                  </p>
                </Reveal>
                <Reveal variant="fade-right" delayMs={320}>
                  <div className="grid grid-cols-2 gap-3 md:gap-5">
                    <div className="p-4 md:p-5 rounded-2xl bg-gray-50 border border-gray-200">
                      <span className="text-xl md:text-2xl font-bold text-[#19D1E6]">300+</span>
                      <p className="text-xs md:text-sm text-gray-500 mt-1">Expected Attendees</p>
                    </div>
                    <div className="p-4 md:p-5 rounded-2xl bg-gray-50 border border-gray-200">
                      <span className="text-xl md:text-2xl font-bold text-[#19D1E6]">3</span>
                      <p className="text-xs md:text-sm text-gray-500 mt-1">Expert Speakers</p>
                    </div>
                    <div className="p-4 md:p-5 rounded-2xl bg-gray-50 border border-gray-200">
                      <span className="text-xl md:text-2xl font-bold text-[#19D1E6]">2025</span>
                      <p className="text-xs md:text-sm text-gray-500 mt-1">Inaugural Year</p>
                    </div>
                    <div className="p-4 md:p-5 rounded-2xl bg-[#19D1E6]/8 border border-[#19D1E6]/30">
                      <span className="text-xl md:text-2xl font-bold text-[#19D1E6]">1</span>
                      <p className="text-xs md:text-sm text-gray-500 mt-1">Action-Packed Day</p>
                    </div>
                  </div>
                </Reveal>
              </div>

              <Reveal variant="fade-left" className="hidden lg:block">
                <div className="w-full aspect-square rounded-3xl overflow-hidden bg-[#0e0e0e] flex items-center justify-center p-10 md:p-14">
                  <LazyImage
                    src={acsLogo}
                    alt="Association of Computing Students"
                    className="w-full h-full flex items-center justify-center"
                    imgClassName="w-full h-full object-contain"
                  />
                </div>
              </Reveal>
            </div>
          </div>

          <MarqueeStrip
            items={ACS_MARQUEE}
            slow
            className="mt-12 md:mt-24 border-y border-gray-100 py-5"
            itemClassName="text-lg md:text-2xl font-bold text-[#19D1E6]/15 tracking-widest"
          />
        </section>
      </main>

      <footer className="relative bg-[#0e0e0e] pt-16 md:pt-24 pb-8 overflow-hidden border-t border-[#2a2a2a]/30">
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#19D1E6]/4 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal variant="fade-up">
            <div className="text-center mb-14 md:mb-20">
              <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-5 tracking-tight text-white">
                Ready to <span className="text-[#19D1E6]">Join Us?</span>
              </h2>
              <p className="text-base md:text-lg text-[#888888] max-w-2xl mx-auto mb-8">
                Don&apos;t miss the most anticipated tech event of 2026. Secure your spot today.
              </p>
              <Link
                to="/register"
                data-cursor="Go"
                className="inline-flex items-center gap-2 px-8 md:px-10 py-4 md:py-5 bg-[#19D1E6] text-[#0e0e0e] font-bold rounded-full text-base md:text-lg hover:bg-[#19D1E6]/90 transition-all hover:scale-105 glow"
              >
                Register Now
                <span className="material-symbols-outlined text-[1.1rem]">arrow_forward</span>
              </Link>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
            <div>
              <p className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug mb-5 max-w-xs">
                One Day. One Vision. <span className="text-[#19D1E6]">Endless Impact.</span>
              </p>
              <div className="flex items-center gap-2 mb-4">
                <img src={nexaLogo} alt="NEXA" className="h-7 w-7 object-contain" loading="lazy" decoding="async" />
                <span className="text-xl font-bold text-[#19D1E6]">NEXA</span>
              </div>
              <p className="text-[#888888] text-sm leading-relaxed max-w-xs">
                Building Tomorrow&apos;s Leaders. The premier one-day tech talk series for students and professionals.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Summit</h4>
              <ul className="space-y-3">
                {FOOTER_SUMMIT_LINKS.map(({ label, href }) => (
                  <li key={label}>
                    {href.startsWith("/") ? (
                      <Link to={href} className="text-[#888888] text-sm hover:text-[#19D1E6] transition-colors">
                        {label}
                      </Link>
                    ) : (
                      <a href={href} className="text-[#888888] text-sm hover:text-[#19D1E6] transition-colors">
                        {label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Contact</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="mailto:nexa.acs.sjp@gmail.com"
                    className="flex items-center gap-2 text-[#888888] text-sm hover:text-[#19D1E6] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[#19D1E6] text-base shrink-0">mail</span>
                    nexa.acs.sjp@gmail.com
                  </a>
                </li>
                <li className="flex items-start gap-2 text-[#888888] text-sm">
                  <span className="material-symbols-outlined text-[#19D1E6] text-base mt-0.5 shrink-0">location_on</span>
                  <span>
                    University of Sri Jayewardenepura
                    <br />
                    Sri Lanka
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#2a2a2a]/30 flex flex-col sm:flex-row justify-between items-center gap-3 text-center">
            <p className="text-[#888888] text-sm">© 2026 NEXA · ACS SJP. All rights reserved.</p>
            <p className="text-[#888888] text-sm">
              Crafted with <span className="text-[#19D1E6]">♥</span> by the ACS Team
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
