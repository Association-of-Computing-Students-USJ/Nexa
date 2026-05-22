import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "../../components/Reveal";
import EventSessions from "../../components/EventSessions";
import CustomCursor from "../../components/CustomCursor";
import { useSmoothScroll } from "../../hooks/useSmoothScroll";
import { useCountUp } from "../../hooks/useCountUp";
import nexaLogo from "../../assets/images/logo/NEXA Colour.png";
import heroImage from "../../assets/images/logo/hero.png";
import hashanImage from "../../assets/images/committee/hashan.png";
import niluniImage from "../../assets/images/committee/niluni.png";
import vikumImage from "../../assets/images/committee/vikum.png";
import banulaImage from "../../assets/images/committee/banula.png";
import poornaImage from "../../assets/images/committee/poorna.png";
import praveenImage from "../../assets/images/committee/praveen.png";
import thiranImage from "../../assets/images/committee/thiran.png";
import rumethImage from "../../assets/images/committee/rumeeth.png";
import usjpLogo from "../../assets/images/logo/usjp.png";
import acsLogo from "../../assets/images/logo/ACS.png";

/* ─── Data ───────────────────────────────────────────────── */

const NAV_LINKS = [
  { href: "#about",    label: "About",    section: "about"    },
  { href: "#sessions", label: "Sessions", section: "sessions" },
  { href: "#contact",  label: "Committee", section: "contact"  },
];

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
];


const COMMITTEE = [
  { name: "Hashan Hirantha",     role: "Chairperson",           phone: "070 566 5091", image: hashanImage  },
  { name: "Niluni Sandunika",    role: "Secretary",             phone: "076 776 0746", image: niluniImage  },
  { name: "Vikum Deshan",        role: "Design Team Head",      phone: "070 210 6391", image: vikumImage   },
  { name: "Banula Bimsara",      role: "Technical Team Head",   phone: "070 210 6391", image: banulaImage  },
  { name: "Poorna Sachinthana",  role: "Finance Head",          phone: "070 210 6391", image: poornaImage  },
  { name: "Praveen Seneviratne", role: "Programming Team Head", phone: "070 210 6391", image: praveenImage },
  { name: "Thiran Ranathunga",   role: "Marketing Team Head",   phone: "070 210 6391", image: thiranImage  },
  { name: "Rumeth Sathnidu",     role: "HR & Logistics Head",   phone: "070 210 6391", image: rumethImage  },
];

/* ─── Image Slot ─────────────────────────────────────────────
   Replace the `src` prop with your actual image path.
   When src is provided it renders a plain <img>.
   When src is omitted it renders a labeled placeholder.
   ─────────────────────────────────────────────────────────── */
function ImgSlot({
  src,
  alt,
  label,
  className = "",
  dark = false,
}: {
  src?: string;
  alt?: string;
  label: string;
  className?: string;
  dark?: boolean;
}) {
  if (src) {
    return <img src={src} alt={alt ?? label} className={`w-full h-full object-cover ${className}`} />;
  }
  return (
    <div className={`img-slot relative flex flex-col items-center justify-center gap-3 rounded-2xl overflow-hidden ${className} ${dark ? "bg-[#1a1a1a]" : "bg-gray-100"}`}>
      <div className={`absolute inset-3 rounded-xl border-2 border-dashed pointer-events-none ${dark ? "border-[#303030]" : "border-gray-300"}`} />
      <span className={`material-symbols-outlined text-5xl relative z-10 ${dark ? "text-[#3a3a3a]" : "text-gray-300"}`}>add_photo_alternate</span>
      <span className={`relative z-10 font-mono text-xs px-3 py-1.5 rounded-full tracking-wider ${dark ? "bg-[#252525] text-[#555]" : "bg-gray-200 text-gray-400"}`}>
        {label}
      </span>
    </div>
  );
}

/* ─── Animated stat number ───────────────────────────────── */
function AnimatedStat({ value, label, light = false }: { value: string | number; label: string; light?: boolean }) {
  const { ref, display } = useCountUp(value);
  return (
    <div>
      <span ref={ref as React.RefObject<HTMLSpanElement>}
        className="text-4xl font-bold text-[#19D1E6]">{display}</span>
      <p className={`text-sm mt-1 ${light ? "text-gray-500" : "text-[#888888]"}`}>{label}</p>
    </div>
  );
}

/* ─── Scroll progress bar ────────────────────────────────── */
function ScrollProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setPct(h > 0 ? (window.scrollY / h) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      className="fixed top-0 left-0 z-[10003] h-[2px] bg-[#19D1E6] transition-[width] duration-75 will-change-[width]"
      style={{ width: `${pct}%` }}
    />
  );
}

/* ─── Component ──────────────────────────────────────────── */
export default function HomePage() {
  const [menuOpen, setMenuOpen]    = useState(false);
  const [scrolled, setScrolled]    = useState(false);
  const [activeSection, setActive] = useState("");

  const orb1Ref = useRef<HTMLImageElement>(null);

  useSmoothScroll();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });

    const ids = NAV_LINKS.map(l => l.section);
    const observers = ids.map(id => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) setActive(id); },
        { rootMargin: "-40% 0px -55% 0px" }
      );
      obs.observe(el);
      return obs;
    });

    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKey);

    const onParallax = () => {
      const y = window.scrollY;
      // Parallax on the hero background image
      if (orb1Ref.current) orb1Ref.current.style.transform = `scale(1.08) translateY(${y * 0.22}px)`;
    };
    window.addEventListener("scroll", onParallax, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onParallax);
      observers.forEach(o => o?.disconnect());
    };
  }, []);

  return (
    <div id="top" className="w-full min-w-0">
      <CustomCursor />
      <ScrollProgress />
      <div className="noise-overlay" />

      {/* ── Navbar ─────────────────────────────────────────── */}
      {/* Light navbar — reads clearly over all section types */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-100"
          : "bg-white/90 backdrop-blur-md border-b border-gray-100"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-4">
            <a href="#top" className="flex items-center gap-2.5" data-cursor="Home">
              <img src={nexaLogo} alt="NEXA" className="h-8 w-8 object-contain" />
              <span className="text-xl font-bold tracking-tight text-[#19D1E6]">NEXA</span>
            </a>

            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map(l => (
                <a key={l.href} href={l.href} data-cursor="View"
                  className={`text-sm font-medium transition-colors duration-300 relative group ${
                    activeSection === l.section
                      ? "text-[#19D1E6]"
                      : "text-gray-600 hover:text-[#19D1E6]"
                  }`}>
                  {l.label}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#19D1E6] transition-all duration-300 ${
                    activeSection === l.section ? "w-full" : "w-0 group-hover:w-full"
                  }`} />
                </a>
              ))}
              <Link to="/register" data-cursor="Register"
                className="px-6 py-2.5 bg-[#19D1E6] text-[#0e0e0e] font-semibold text-sm rounded-full hover:bg-[#19D1E6]/90 transition-all duration-300 hover:scale-105 glow">
                Register Now
              </Link>
            </div>

            <button type="button"
              className="md:hidden p-2 text-gray-700 hover:text-[#19D1E6] transition-colors"
              aria-label="Toggle menu"
              onClick={() => setMenuOpen(v => !v)}>
              <span className="material-symbols-outlined">{menuOpen ? "close" : "menu"}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile menu ────────────────────────────────────── */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-white flex flex-col items-center justify-center gap-8 md:hidden">
          {NAV_LINKS.map((l, i) => (
            <Reveal key={l.href} variant="fade-up" delayMs={i * 60}>
              <a href={l.href} onClick={() => setMenuOpen(false)}
                className="text-3xl font-semibold text-gray-900 hover:text-[#19D1E6] transition-colors">
                {l.label}
              </a>
            </Reveal>
          ))}
          <Reveal variant="fade-up" delayMs={NAV_LINKS.length * 60}>
            <Link to="/register" onClick={() => setMenuOpen(false)}
              className="px-8 py-3 bg-[#19D1E6] text-[#0e0e0e] font-semibold rounded-full text-lg glow">
              Register Now
            </Link>
          </Reveal>
        </div>
      )}

      <main>

        {/* ═══════════════════════════════════════════════════
            HERO — full-bleed image
            ═══════════════════════════════════════════════════ */}
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

          {/* Background image with parallax */}
          <div className="absolute inset-0 overflow-hidden">
            <img
              ref={orb1Ref}
              src={heroImage}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover object-center will-change-transform"
              style={{ transform: "scale(1.08) translateY(0px)" }}
            />
            {/* Multi-layer overlay for strong text contrast */}
            {/* 1. Dark base wash over entire image */}
            <div className="absolute inset-0 bg-black/50" />
            {/* 2. Deep gradient: stronger at top & bottom, lighter in middle */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/70" />
            {/* 3. Subtle radial vignette around edges */}
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)" }} />
          </div>

          {/* Content */}
          <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 sm:pt-24 sm:pb-32 md:pb-36 flex flex-col items-center text-center">

            {/* Badge */}
            <Reveal variant="fade-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#19D1E6]/50 bg-[#19D1E6]/15 backdrop-blur-md mb-8">
                <span className="w-2 h-2 bg-[#19D1E6] rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-[#19D1E6] tracking-wide">Early Bird Registration Open</span>
              </div>
            </Reveal>

            {/* Headline */}
            <Reveal variant="fade-up" delayMs={80}>
              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-[5.5rem] font-bold leading-[0.92] tracking-tight text-white mb-6"
                style={{ textShadow: "0 2px 40px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.8)" }}>
                Building Tomorrow's
                <span className="block text-[#19D1E6]"
                  style={{ textShadow: "0 0 60px rgba(25,209,230,0.5), 0 2px 20px rgba(0,0,0,0.5)" }}>
                  Leaders.
                </span>
              </h1>
            </Reveal>

            {/* Event meta */}
            <Reveal variant="fade-up" delayMs={200}>
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 sm:gap-3 text-white/75 text-xs font-semibold tracking-[0.14em] uppercase mb-10">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#19D1E6] text-sm">calendar_today</span>
                  June 2026
                </span>
                <span className="hidden sm:inline text-white/30">·</span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#19D1E6] text-sm shrink-0">location_on</span>
                  <span className="sm:hidden">USJP, Sri Lanka</span>
                  <span className="hidden sm:inline">University of Sri Jayewardenepura</span>
                </span>
                <span className="hidden sm:inline text-white/30">·</span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#19D1E6] text-sm">group</span>
                  300+ Attendees
                </span>
              </div>
            </Reveal>

            {/* CTAs */}
            <Reveal variant="fade-up" delayMs={300}>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register" data-cursor="Register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#19D1E6] text-[#0e0e0e] font-bold rounded-full text-base hover:bg-[#19D1E6]/90 transition-all duration-300 hover:scale-105 glow shadow-2xl">
                  Register Now
                  <span className="material-symbols-outlined text-[1.1rem]">arrow_forward</span>
                </Link>
                <a href="#sessions" data-cursor="View"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-full text-base hover:bg-white/20 hover:border-white/50 transition-all duration-300">
                  Explore Sessions
                </a>
              </div>
            </Reveal>
          </div>

          {/* Scroll cue — sits above the marquee strip */}
          <div className="absolute bottom-16 sm:bottom-14 left-1/2 -translate-x-1/2 z-10">
            <a href="#about" data-cursor="Scroll"
              className="flex flex-col items-center gap-1 text-white/50 hover:text-white transition-colors">
              <span className="material-symbols-outlined animate-bounce text-3xl drop-shadow-lg">keyboard_arrow_down</span>
            </a>
          </div>

          {/* Marquee strip */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-md border-t border-white/10 py-3.5 overflow-hidden">
            <div className="animate-marquee flex gap-16 whitespace-nowrap">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex shrink-0 gap-16">
                  {["NEXA 2026", "ACS × USJP", "INNOVATION", "TECH TALKS", "NETWORKING", "KNOWLEDGE TRANSFER"].map(t => (
                    <span key={t} className="text-xs font-bold tracking-[0.22em] text-white/40">{t} •</span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            ABOUT NEXA — light section
            ═══════════════════════════════════════════════════ */}
        <section id="about" className="relative py-16 md:py-32 bg-white overflow-hidden scroll-mt-20">
          <div className="absolute inset-0 grid-pattern-light" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#19D1E6]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

              {/* Image — hidden on mobile, shown from lg up to avoid stacking issues */}
              <Reveal variant="fade-right" className="hidden lg:block">
                <div className="relative">
                  <ImgSlot
                    label="ABOUT_SECTION"
                    className="w-full aspect-square rounded-3xl"
                  />
                  {/* Logo strip */}
                  <div className="absolute bottom-6 left-6 right-6 p-3 rounded-2xl bg-white/90 backdrop-blur-sm border border-gray-100 shadow-lg flex items-center justify-center gap-4">
                    <img src={usjpLogo} alt="USJP" className="h-8 w-8 object-contain" />
                    <div className="w-px h-6 bg-gray-200" />
                    <img src={acsLogo}  alt="ACS"  className="h-8 w-8 object-contain" />
                    <div className="w-px h-6 bg-gray-200" />
                    <span className="text-sm font-semibold text-gray-600">ACS × USJP</span>
                  </div>
                </div>
              </Reveal>

              {/* Text + features */}
              <div>
                <Reveal variant="fade-left">
                  <span className="text-[#19D1E6] font-semibold tracking-wider uppercase text-sm">About NEXA</span>
                </Reveal>
                <Reveal variant="fade-left" delayMs={80}>
                  <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mt-4 mb-6 leading-tight tracking-tight text-gray-900">
                    Where Vision
                    <span className="block text-[#19D1E6]">Meets Reality</span>
                  </h2>
                </Reveal>
                <Reveal variant="fade-left" delayMs={160}>
                  <p className="text-base md:text-lg text-gray-500 leading-relaxed mb-8">
                    For the first time, the Association of Computing Students (ACS) of the University of
                    Sri Jayewardenepura presents NEXA — a one-day tech talk series bridging the gap between
                    academic learning and the rapidly evolving technology industry.
                  </p>
                </Reveal>
                <Reveal variant="fade-left" delayMs={240}>
                  <div className="flex flex-wrap gap-8 md:gap-10 mb-10">
                    <AnimatedStat value="300+" label="Expected Participants" light />
                    <AnimatedStat value="4"    label="Expert Sessions"       light />
                    <AnimatedStat value="1"    label="Action-Packed Day"     light />
                  </div>
                </Reveal>

                <div className="space-y-3 md:space-y-4">
                  {ABOUT_FEATURES.map((f, i) => (
                    <Reveal key={f.title} variant="fade-left" delayMs={320 + i * 80}>
                      <div className="group p-4 md:p-5 rounded-2xl bg-gray-50 border border-gray-200 hover:border-[#19D1E6]/50 hover:bg-white transition-all duration-400 hover:shadow-sm"
                        data-cursor="Learn">
                        <div className="flex items-start gap-3 md:gap-4">
                          <div className="p-2.5 rounded-xl bg-[#19D1E6]/10 text-[#19D1E6] group-hover:bg-[#19D1E6] group-hover:text-white transition-colors duration-300 shrink-0">
                            <span className="material-symbols-outlined text-lg">{f.icon}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-[#19D1E6] transition-colors text-sm md:text-base">{f.title}</h3>
                            <p className="text-gray-500 text-xs md:text-sm leading-relaxed">{f.desc}</p>
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            SESSIONS — dark section
            ═══════════════════════════════════════════════════ */}
        <EventSessions
          includeAnchorId
          sectionClassName="relative py-16 md:py-32 bg-[#0e0e0e] overflow-hidden scroll-mt-20"
        />


        {/* ═══════════════════════════════════════════════════
            ABOUT ACS — light section
            ═══════════════════════════════════════════════════ */}
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
                      <span className="text-xl md:text-2xl font-bold text-[#19D1E6]">4</span>
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

              {/* Right: visual — hidden on small screens to avoid layout overflow */}
              <Reveal variant="fade-left" className="hidden lg:block">
                <div className="relative pb-8 pr-8">
                  <ImgSlot
                    label="ACS_SECTION"
                    className="w-full aspect-square rounded-3xl"
                  />
                  {/* Floating logo badge — stays within the padded container */}
                  <div className="absolute bottom-0 right-0 p-4 rounded-2xl bg-white border border-gray-200 shadow-xl flex items-center gap-3">
                    <img src={acsLogo} alt="ACS" className="h-9 w-9 object-contain" />
                    <div>
                      <div className="font-bold text-gray-900 text-sm">ACS</div>
                      <div className="text-xs text-gray-500">Faculty of Computing</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>

          {/* Marquee strip */}
          <div className="mt-12 md:mt-24 border-y border-gray-100 py-5 overflow-hidden">
            <div className="animate-marquee-slow flex gap-12 whitespace-nowrap">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex shrink-0 gap-12">
                  {["INNOVATION", "COLLABORATION", "EXCELLENCE", "COMMUNITY", "GROWTH", "IMPACT"].map(t => (
                    <span key={t} className="text-lg md:text-2xl font-bold text-[#19D1E6]/15 tracking-widest">{t} •</span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            COMMITTEE — dark section (portrait card layout)
            ═══════════════════════════════════════════════════ */}
        <section id="contact" className="relative py-16 md:py-24 bg-[#0e0e0e] overflow-hidden scroll-mt-20">
          <div className="absolute inset-0 grid-pattern" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#19D1E6]/4 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Left-aligned header */}
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
                  <a href="mailto:nexa.acs.sjp@gmail.com" data-cursor="Email"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#19D1E6] hover:text-[#19D1E6]/70 transition-colors shrink-0">
                    <span className="material-symbols-outlined text-base">mail</span>
                    nexa.acs.sjp@gmail.com
                  </a>
                </Reveal>
              </div>
            </div>

            {/* Portrait card grid — 1 col on very small (Z Fold), 2 on ≥480px, 3 on md, 4 on lg */}
            <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {COMMITTEE.map((member, i) => (
                <Reveal key={member.name} variant="fade-up" delayMs={i * 50}>
                  <div className="group rounded-2xl overflow-hidden border border-[#2a2a2a] bg-[#161616] hover:border-[#19D1E6]/40 transition-all duration-400 hover:-translate-y-1"
                    data-cursor="View">

                    {/* Portrait image */}
                    <div className="relative aspect-[3/4] overflow-hidden bg-[#111]">
                      {/*
                        COMMITTEE MEMBER IMAGES
                        To swap: update the `image` field in the COMMITTEE array.
                      */}
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover object-top grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                      />
                      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                    </div>

                    {/* Info bar — dark panel at bottom */}
                    <div className="px-4 py-3.5 bg-[#161616] border-t border-[#2a2a2a] flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-white text-sm truncate group-hover:text-[#19D1E6] transition-colors">{member.name}</h3>
                        <p className="text-[#888888] text-xs mt-0.5 truncate">{member.role}</p>
                      </div>
                      <a
                        href={`tel:${member.phone.replace(/\s/g, "")}`}
                        data-cursor="Call"
                        className="w-8 h-8 rounded-lg bg-[#222] text-[#555] flex items-center justify-center shrink-0 hover:bg-[#19D1E6] hover:text-[#0e0e0e] transition-colors duration-300"
                        title={member.phone}
                      >
                        <span className="material-symbols-outlined text-[1rem]">phone</span>
                      </a>
                    </div>

                  </div>
                </Reveal>
              ))}
            </div>

          </div>
        </section>

      </main>

      {/* ═══════════════════════════════════════════════════
          FOOTER — dark
          ═══════════════════════════════════════════════════ */}
      <footer className="relative bg-[#0e0e0e] pt-16 md:pt-24 pb-8 overflow-hidden border-t border-[#2a2a2a]/30">
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#19D1E6]/4 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* CTA */}
          <Reveal variant="fade-up">
            <div className="text-center mb-14 md:mb-20">
              <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-5 tracking-tight text-white">
                Ready to <span className="text-[#19D1E6]">Join Us?</span>
              </h2>
              <p className="text-base md:text-lg text-[#888888] max-w-2xl mx-auto mb-8">
                Don't miss the most anticipated tech event of 2026. Secure your spot today.
              </p>
              <Link to="/register" data-cursor="Go"
                className="inline-flex items-center gap-2 px-8 md:px-10 py-4 md:py-5 bg-[#19D1E6] text-[#0e0e0e] font-bold rounded-full text-base md:text-lg hover:bg-[#19D1E6]/90 transition-all hover:scale-105 glow">
                Register Now
                <span className="material-symbols-outlined text-[1.1rem]">arrow_forward</span>
              </Link>
            </div>
          </Reveal>

          {/* Footer links — 3 columns (Opportunities removed) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={nexaLogo} alt="NEXA" className="h-7 w-7 object-contain" />
                <span className="text-xl font-bold text-[#19D1E6]">NEXA</span>
              </div>
              <p className="text-[#888888] text-sm leading-relaxed max-w-xs">
                Building Tomorrow's Leaders. The premier one-day tech talk series for students and professionals.
              </p>
            </div>

            {/* Summit links */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Summit</h4>
              <ul className="space-y-3">
                {[["About", "#about"], ["Sessions", "#sessions"], ["Committee", "#contact"], ["Register", "/register"]].map(([l, h]) => (
                  <li key={l}><a href={h} className="text-[#888888] text-sm hover:text-[#19D1E6] transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Contact</h4>
              <ul className="space-y-3">
                <li>
                  <a href="mailto:nexa.acs.sjp@gmail.com"
                    className="flex items-center gap-2 text-[#888888] text-sm hover:text-[#19D1E6] transition-colors">
                    <span className="material-symbols-outlined text-[#19D1E6] text-base shrink-0">mail</span>
                    nexa.acs.sjp@gmail.com
                  </a>
                </li>
                <li className="flex items-start gap-2 text-[#888888] text-sm">
                  <span className="material-symbols-outlined text-[#19D1E6] text-base mt-0.5 shrink-0">location_on</span>
                  <span>University of Sri Jayewardenepura<br />Sri Lanka</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#2a2a2a]/30 flex flex-col sm:flex-row justify-between items-center gap-3 text-center">
            <p className="text-[#888888] text-sm">© 2026 NEXA · ACS SJP. All rights reserved.</p>
            <p className="text-[#888888] text-sm">Crafted with <span className="text-[#19D1E6]">♥</span> by the ACS Team</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
