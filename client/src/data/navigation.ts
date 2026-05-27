export type NavLink = {
  href: string;
  label: string;
  section: string;
};

/** Homepage anchor navigation — single source of truth for nav + scroll spy. */
export const HOME_NAV_LINKS: NavLink[] = [
  { href: "#about", label: "About", section: "about" },
  { href: "#sessions", label: "Sessions", section: "sessions" },
  { href: "#speakers", label: "Speakers", section: "speakers" },
  { href: "#sponsors", label: "Sponsors", section: "sponsors" },
  { href: "#contact", label: "Committee", section: "contact" },
];

export const HOME_SECTION_IDS = HOME_NAV_LINKS.map((l) => l.section);

export const FOOTER_SUMMIT_LINKS: { label: string; href: string }[] = [
  ...HOME_NAV_LINKS.map(({ label, href }) => ({ label, href })),
  { label: "Register", href: "/register" },
];

/** Hash links shown on register/ticket layout header. */
export const PUBLIC_HASH_LINKS = HOME_NAV_LINKS.filter((l) => l.href.startsWith("#"));
