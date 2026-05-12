import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Reveal from "../../components/Reveal";
import EventSessions from "../../components/EventSessions";
import nexaLogo from "../../assets/images/logo/NEXA Colour.png";
import hashanImage from "../../assets/images/committee/hashan.jpeg";
import niluniImage from "../../assets/images/committee/niluni.jpeg";
import vikumImage from "../../assets/images/committee/vikum.jpeg";
import banulaImage from "../../assets/images/committee/banula.png";
import poornaImage from "../../assets/images/committee/poorna.jpeg";
import praveenImage from "../../assets/images/committee/praveen.jpeg";
import thiranImage from "../../assets/images/committee/thiran.jpeg";
import rumethImage from "../../assets/images/committee/rumeeth.png";
import usjpLogo from "../../assets/images/logo/usjp.png";
import acsLogo from "../../assets/images/logo/ACS.png";

const MOBILE_NAV_ITEMS = [
  { href: "#about", label: "About" },
  { href: "#sessions", label: "Sessions" },
  { href: "#sponsors", label: "Sponsors" },
  { href: "#contact", label: "Contact" }
];

const SPONSORSHIP_PACKAGES = [
  { tier: "Title Sponsor", amount: "100,000 LKR", color: "border-[var(--brand)] text-[var(--brand)]" },
  { tier: "Platinum Sponsor", amount: "75,000 LKR", color: "border-gray-200 text-gray-200" },
  { tier: "Gold Sponsor", amount: "50,000 LKR", color: "border-yellow-500 text-yellow-500" },
  { tier: "Silver Sponsor", amount: "30,000 LKR", color: "border-gray-400 text-gray-400" },
  { tier: "Bronze Sponsor", amount: "25,000 LKR", color: "border-orange-400 text-orange-400" }
];

const PARTNERSHIP_ROLES = [
  "Official Food and Beverage Partner",
  "Official Printing Partner",
  "Official Photography and Videography Partner",
  "Official Gift Partner",
  "Official Technical Partner",
  "Official Media Partner"
];

const CONTACTS = [
  { name: "Hashan Hirantha", role: "Chairperson", phone: "070 566 5091", image: hashanImage },
  { name: "Niluni Sandunika", role: "Secretary", phone: "076 776 0746", image: niluniImage },
  { name: "Vikum Deshan ", role: "Design Team Head", phone: "070 210 6391", image: vikumImage },
  { name: "Banula Bimsara", role: "Technical Team Head", phone: "070 210 6391", image: banulaImage },
  { name: "Poorna Sachinthana", role: "Finance Head", phone: "070 210 6391", image: poornaImage },
  { name: "Praveen Seneviratne", role: "Programming Team Head", phone: "070 210 6391", image: praveenImage },
  { name: "Thiran Ranathunga", role: "Marketing Team Head", phone: "070 210 6391", image: thiranImage },
  { name: "Rumeth Sathnidu", role: "HR & Logistics Team Head", phone: "070 210 6391", image: rumethImage }
];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div id="top" className="w-full min-w-0">
      {/* TopNavBar */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 glass-nav ps-[env(safe-area-inset-left,0px)] pe-[env(safe-area-inset-right,0px)]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-6 md:px-8 lg:px-12 md:py-6">
          <a href="#top" className="flex items-center gap-3">
            <img src={nexaLogo} alt="NEXA logo" className="h-8 w-8 object-contain sm:h-10 sm:w-10" />
            <div className="font-headline text-xl font-black tracking-tighter text-white uppercase sm:text-2xl">NEXA</div>
          </a>
          <div className="hidden gap-10 md:flex">
            <a
              className="font-headline text-xs font-bold uppercase tracking-tighter text-[var(--brand)] border-b-2 border-[var(--brand)] pb-1 transition-all duration-300"
              href="#about"
            >
              About
            </a>
            <a
              className="font-headline text-xs font-bold uppercase tracking-tighter text-[#e2e2e2] opacity-60 hover:opacity-100 hover:text-[var(--brand)] transition-all duration-300"
              href="#sessions"
            >
              Sessions
            </a>
            <a
              className="font-headline text-xs font-bold uppercase tracking-tighter text-[#e2e2e2] opacity-60 hover:opacity-100 hover:text-[var(--brand)] transition-all duration-300"
              href="#sponsors"
            >
              Sponsors
            </a>
            <a
              className="font-headline text-xs font-bold uppercase tracking-tighter text-[#e2e2e2] opacity-60 hover:opacity-100 hover:text-[var(--brand)] transition-all duration-300"
              href="#contact"
            >
              Contact
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/register"
              className="hidden bg-[var(--brand)] text-white font-headline text-xs font-bold uppercase tracking-widest px-6 py-2.5 hover:brightness-110 transition-all sm:inline-block"
            >
              Register Now
            </Link>

            <button
              type="button"
              className="md:hidden inline-flex h-10 w-10 items-center justify-center border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen ? (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="glass-panel absolute right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.75rem,env(safe-area-inset-top))] w-[min(92vw,360px)] p-4">
            <div className="flex items-center justify-between">
              <div className="font-headline text-sm font-bold uppercase tracking-widest text-white/80">Navigation</div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors"
                aria-label="Close"
                onClick={() => setMenuOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              {MOBILE_NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-2 font-headline text-xs font-bold uppercase tracking-widest text-white/80 hover:bg-white/10"
                >
                  {item.label}
                </a>
              ))}

              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="mt-2 bg-[var(--brand)] px-4 py-3 text-center font-headline text-xs font-bold uppercase tracking-widest text-white hover:brightness-110 transition-all"
              >
                Register Now
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <main>
        {/* Hero Section */}
        <section className="relative flex min-h-[92svh] flex-col items-center justify-center overflow-hidden bg-[#0e0e0e] px-5 pt-24 sm:px-6 md:px-8 lg:px-12 md:pt-28">
          <div className="pointer-events-none absolute inset-0 opacity-10">
            <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_center,_var(--brand-soft)_0%,_transparent_70%)]" />
            <div className="absolute inset-0 overflow-hidden">
              <div
                className="h-full w-full opacity-5 grayscale"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCTjlSv9NoAXEUdGkui9DYDNUUljXrBjOD69dbebshOmGeugE5omHaLSYf5m0nOaee7KdIVMdVugCl_5e8JSZOaU77px6cCpJRJ3EyTzzivbhVdvSdiYJzK41LBic_RKKIw8M54Pot11bVwwldv3CSESOLbLAU7ZDaOCy_DiEgOFBJvxSxdj-VFvD9ZIbwbIXI8LkaRcW8Y4VBDI-CiHGP7tfsWkgjzl3bhlHuMCrbyyhK_FbKwQbGXFYOJYCYy6BW8oNzKrr6vm7BD')"
                }}
              />
            </div>
          </div>

          <Reveal className="relative z-10 mx-auto max-w-5xl text-center" variant="fade-up">
            <h1 className="font-headline mb-6 text-[clamp(4rem,14vw,10rem)] font-black uppercase leading-[0.85] tracking-[calc(-0.06em)] text-white sm:mb-8">
              NEXA<span className="text-[var(--brand)]">.</span>
            </h1>
            <p className="font-body mx-auto mb-8 max-w-2xl text-base leading-relaxed tracking-normal text-white/60 sm:mb-12 sm:text-lg md:text-xl">
              A One Day Tech Talk Series<br/>Bridging the gap between academic learning and the rapidly evolving technology industry.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/register"
                className="bg-[var(--brand)] w-full max-w-[22rem] px-8 py-4 text-center font-headline text-sm font-bold uppercase tracking-widest text-white hover:brightness-110 transition-all sm:w-auto sm:px-10"
              >
                Register Now
              </Link>
              <a
                href="#about"
                className="border border-white/20 w-full max-w-[22rem] px-8 py-4 text-center font-headline text-sm font-bold uppercase tracking-widest text-white hover:bg-white/5 transition-colors sm:w-auto sm:px-10"
              >
                Learn More
              </a>
            </div>
          </Reveal>

          {/* Stats Bar */}
          <div className="absolute bottom-0 w-full border-t border-white/10 bg-black/40 py-6 backdrop-blur-md sm:py-8">
            <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-6 px-5 sm:px-6 md:grid-cols-4 md:gap-8 md:px-8 lg:px-12">
              <div className="flex flex-col">
                <span className="font-headline text-2xl font-bold tracking-tighter text-white">300+</span>
                <span className="font-label text-[0.65rem] uppercase tracking-[0.2em] text-white/40">Estimated Participants</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline text-2xl font-bold tracking-tighter text-white">4</span>
                <span className="font-label text-[0.65rem] uppercase tracking-[0.2em] text-white/40">Expert Sessions</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline text-sm sm:text-base md:text-xl font-bold tracking-tighter text-white">University of Sri Jayewardenepura</span>
                <span className="font-label text-[0.65rem] uppercase tracking-[0.2em] text-white/40">Venue</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline text-2xl font-bold tracking-tighter text-white">June 2026</span>
                <span className="font-label text-[0.65rem] uppercase tracking-[0.2em] text-white/40">Event Date</span>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="scroll-mt-32 border-y border-white/5 bg-[#0e0e0e] px-5 py-20 sm:px-6 sm:py-24 md:px-8 md:py-28 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-24">
            <Reveal className="scroll-mt-32" variant="fade-left">
              <span className="font-label mb-6 block text-[0.6875rem] font-bold uppercase tracking-[0.3em] text-[var(--brand)]">
                What is NEXA
              </span>
              <h2 className="font-headline mb-10 text-5xl font-bold leading-tight tracking-tighter text-white md:text-7xl">
                Bridging Academia & Industry
              </h2>
              <div className="font-body mb-12 max-w-xl text-lg leading-relaxed text-white/60 space-y-4">
                <p>
                  For the first time, the Association of Computing Students (ACS) of the University of Sri Jayewardenepura proudly presents NEXA — a one day tech talk series designed to bridge the gap between academic learning and the rapidly evolving technology industry. The event brings together undergraduate students, technology professionals, and industry experts to share knowledge, experiences, and insights about the latest trends and innovations.
                </p>
                <p>
                  Through engaging tech talks and interactive sessions, NEXA aims to provide students with exposure to real world industry practices, emerging technologies, and career opportunities while fostering a culture of learning, innovation, and collaboration among future technology leaders in Sri Lanka.
                </p>
              </div>
            </Reveal>
            <Reveal className="group relative" variant="fade-right" delayMs={80}>
              <div className="absolute -inset-1 opacity-0 blur-2xl transition-opacity group-hover:opacity-100 bg-[var(--brand)]/20" />
              <img
                alt="Technical Graphic"
                className="relative aspect-square w-full border border-white/10 object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVibeWUciBas9kPMp7nNIEO8ezWQoIIucdc_g5IPvrtRbmVk_g0z5v9MBjDVybOpIoIU8MAesFpELz1vFPDQL2wY7lppch6SeBw4FWnhXyJW9ykx1JQIDa9Mbn551a1aRI2YZldOraBeXbcTKCDKZn3VylJ3Zzpztm6Ss5QYrxSdx-_TI0PuAMnoaWdPypLq_7FbEiRY5-C_HY6wf3rZ4ugHEt0tVT4HHLWE_PLzcbMyFmnp5aSm8cialtxh-9oHElBkbvNRoQ9d-J"
              />
            </Reveal>
          </div>
        </section>

        {/* Mission & Target Audience */}
        <section className="bg-[#0e0e0e] px-5 py-20 sm:px-6 sm:py-24 md:px-8 md:py-28 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-1 border border-white/10 md:grid-cols-2">
            <Reveal
              className="group relative overflow-hidden border-l-4 border-[var(--brand)] bg-[#131313] p-10 md:p-16"
              variant="fade-up"
            >
              <div className="absolute right-0 top-0 p-8 text-white opacity-5 transition-opacity group-hover:opacity-10">
                <span className="material-symbols-outlined text-[8rem]">visibility</span>
              </div>
              <span className="font-label mb-8 block text-xs font-bold uppercase tracking-widest text-[var(--brand)]">
                Our Mission
              </span>
              <h3 className="font-headline mb-6 text-4xl font-bold tracking-tighter text-white">
                Connecting Students and Professionals
              </h3>
              <p className="font-body leading-relaxed text-white/60">
                To bridge the gap between academia and industry by delivering impactful tech talks that connect students with professionals, inspire innovation, and prepare them for real-world careers.
              </p>
            </Reveal>
            <Reveal
              className="group relative overflow-hidden border-l-4 border-white/20 bg-[#131313] p-10 md:p-16"
              variant="fade-up"
              delayMs={90}
            >
              <div className="absolute right-0 top-0 p-8 text-white opacity-5 transition-opacity group-hover:opacity-10">
                <span className="material-symbols-outlined text-[8rem]">bolt</span>
              </div>
              <span className="font-label mb-8 block text-xs font-bold uppercase tracking-widest text-white/40">
                Target Audience
              </span>
              <h3 className="font-headline mb-6 text-4xl font-bold tracking-tighter text-white">
                Future Technology Leaders
              </h3>
              <p className="font-body leading-relaxed text-white/60">
                Undergraduate students across Sri Lanka interested in the IT industry and emerging technologies. Primarily focused on computing and IT students, but welcomes all faculties with an interest in technology, innovation, and IT career opportunities.
              </p>
            </Reveal>
          </div>
        </section>

        <EventSessions
          includeAnchorId
          sectionClassName="scroll-mt-32 bg-[#0e0e0e] px-5 py-20 overflow-hidden sm:px-6 sm:py-24 md:px-8 md:py-28 lg:px-12 lg:py-32"
        />

        {/* SPONSORSHIP PACKAGES Section */}
        <section id="sponsors" className="scroll-mt-32 bg-[#0e0e0e] px-5 py-20 sm:px-6 sm:py-24 md:px-8 md:py-28 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <Reveal className="mb-20 text-center" variant="fade-up">
              <h2 className="font-headline mb-4 text-5xl font-bold uppercase tracking-tighter text-white md:text-6xl">
                Sponsorship Packages
              </h2>
              <p className="font-body mx-auto max-w-2xl leading-relaxed tracking-normal text-white/60">
                Partner with us to support the next generation of technology leaders. We offer various partnership opportunities.
              </p>
            </Reveal>
            <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5" variant="fade-up" delayMs={80}>
              {SPONSORSHIP_PACKAGES.map((item) => (
                <div key={item.tier} className={`group flex flex-col items-center justify-center border-t-4 bg-[#131313] p-8 transition-all hover:-translate-y-2 ${item.color}`}>
                  <h5 className="font-headline mb-4 text-center text-xl font-bold uppercase text-white">{item.tier}</h5>
                  <span className="font-label text-sm font-bold tracking-widest">{item.amount}</span>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* Partnership Packages */}
        <section className="bg-[#0e0e0e] px-5 py-20 sm:px-6 sm:py-24 md:px-8 md:py-28 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <Reveal className="mb-16 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end" variant="fade-up">
              <h2 className="font-headline text-5xl font-bold uppercase tracking-tighter text-white md:text-6xl">
                Partnership Packages
              </h2>
            </Reveal>

            <Reveal className="grid grid-cols-1 gap-1 border border-white/10 bg-white/10 sm:grid-cols-2 md:grid-cols-3" variant="fade-up" delayMs={80}>
              {PARTNERSHIP_ROLES.map((role) => (
                <div key={role} className="group flex flex-col items-center justify-center bg-[#0e0e0e] p-8 text-center border border-white/5 transition-all hover:border-[var(--brand)]">
                  <span className="material-symbols-outlined mb-4 text-4xl text-[var(--brand)] opacity-50 group-hover:opacity-100">
                    handshake
                  </span>
                  <h4 className="font-headline text-xl font-bold text-white">{role}</h4>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* About ACS */}
        <section className="border-t border-white/5 bg-[#0e0e0e] px-5 py-20 sm:px-6 sm:py-24 md:px-8 md:py-28 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <Reveal className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.35fr_1fr] lg:gap-20" variant="fade-up">
              <div>
                <h2 className="font-headline mb-10 text-4xl font-bold uppercase tracking-tighter text-white md:text-5xl">
                  About ACS
                </h2>
                <div className="font-body max-w-4xl space-y-4 text-lg leading-relaxed text-white/60">
                  <p>
                    The Association of Computing Students (ACS) at the University of Sri Jayewardenepura is a vibrant and dynamic community dedicated to fostering innovation, collaboration, and excellence in the field of computing. As a student driven initiative under the Faculty of Computing, ACS provides a platform for students to explore emerging technologies, connect with industry professionals, and develop skills essential for the rapidly evolving tech landscape.
                  </p>
                  <p>
                    The association organizes workshops, hosts networking opportunities, and drives collaborative projects to empower students and cultivate future technology leaders. Through these initiatives, ACS aims to inspire creativity, encourage practical learning, and strengthen the student community within the Faculty of Computing.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 items-center gap-6 sm:gap-8">
                <img
                  src={usjpLogo}
                  alt="University of Sri Jayewardenepura logo"
                  className="h-44 w-full object-contain sm:h-52 md:h-56"
                />
                <img
                  src={acsLogo}
                  alt="Association of Computing Students logo"
                  className="h-44 w-full object-contain sm:h-52 md:h-56"
                />
              </div>
            </Reveal>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="border-t border-white/5 bg-[#0b0b0b] px-5 py-20 sm:px-6 sm:py-24 md:px-8 md:py-28 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <Reveal className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between" variant="fade-up">
              <h2 className="font-headline text-5xl font-bold uppercase tracking-tighter text-white md:text-6xl">
                The Committee
              </h2>
              <p className="font-body max-w-lg text-sm leading-relaxed text-white/40">
                Meet the core organizing team behind NEXA. Replace each placeholder with your final member photos.
              </p>
            </Reveal>

            <Reveal className="mb-10 border border-white/10 bg-[#131313] p-6 md:p-8" variant="fade-up" delayMs={50}>
              <h4 className="font-headline text-lg font-bold uppercase text-white">General Contact</h4>
              <a href="mailto:nexa.acs.sjp@gmail.com" className="font-body mt-2 inline-block text-sm leading-relaxed text-[var(--brand)]">
                nexa.acs.sjp@gmail.com
              </a>
            </Reveal>

            <Reveal className="grid grid-cols-1 gap-4 pb-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6" variant="fade-up" delayMs={80}>
              {CONTACTS.map((contact) => (
                <article key={contact.name} className="group w-full overflow-hidden border border-white/10 bg-[#0f0f0f]">
                  <div className="h-[18rem] border-b border-white/10 bg-[#151515] sm:h-[20rem] lg:h-[22rem]">
                    <img
                      src={contact.image}
                      alt={contact.name}
                      className="h-full w-full object-cover object-top grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                    />
                  </div>
                  <div className="space-y-2 p-5 md:p-6">
                    <h4 className="font-headline text-xl font-bold tracking-tight text-white md:text-2xl">{contact.name}</h4>
                    <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand)]">
                      {contact.role}
                    </p>
                    <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="font-body inline-block pt-1 text-sm font-semibold text-white/70 hover:text-white">
                      {contact.phone}
                    </a>
                  </div>
                </article>
              ))}
            </Reveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex w-full flex-col items-center bg-[#0e0e0e] px-5 py-16 text-center border-t border-white/10 sm:px-6 md:px-8 lg:px-12 md:py-20">
        <div className="font-headline mb-8 text-4xl font-black uppercase tracking-tighter text-white/5">NEXA</div>
        <div className="mb-16 flex flex-wrap justify-center gap-8 md:gap-12">
          <a className="font-label text-[0.6875rem] uppercase tracking-widest text-white/40 transition-colors hover:text-[var(--brand)]" href="#">
            Privacy Policy
          </a>
          <a className="font-label text-[0.6875rem] uppercase tracking-widest text-white/40 transition-colors hover:text-[var(--brand)]" href="#">
            Terms of Service
          </a>
          <a className="font-label text-[0.6875rem] uppercase tracking-widest text-white/40 transition-colors hover:text-[var(--brand)]" href="#">
            Press Kit
          </a>
          <a className="font-label text-[0.6875rem] uppercase tracking-widest text-white/40 transition-colors hover:text-[var(--brand)]" href="#contact">
            Contact
          </a>
        </div>
        <div className="mb-12">
          <p className="font-label text-[0.6875rem] uppercase tracking-widest text-white/20">
            © 2026 NEXA. ALL RIGHTS RESERVED.
          </p>
        </div>

        {/* News ticker */}
        <div className="w-full overflow-hidden whitespace-nowrap border-y border-white/5 py-4 opacity-20">
          <div className="animate-marquee flex gap-20">
            <span className="font-label text-[0.6875rem] font-bold uppercase tracking-[0.4em] text-[var(--brand)]">
              NEXA
            </span>
            <span className="font-label text-[0.6875rem] uppercase tracking-[0.4em] text-white">TECH TALK SERIES</span>
            <span className="font-label text-[0.6875rem] font-bold uppercase tracking-[0.4em] text-[var(--brand)]">
              ACS SJP
            </span>
            <span className="font-label text-[0.6875rem] uppercase tracking-[0.4em] text-white">INNOVATION</span>
            <span className="font-label text-[0.6875rem] font-bold uppercase tracking-[0.4em] text-[var(--brand)]">
              FUTURE LEADERS
            </span>
            <span className="font-label text-[0.6875rem] uppercase tracking-[0.4em] text-white">
              NEXA 2026
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

