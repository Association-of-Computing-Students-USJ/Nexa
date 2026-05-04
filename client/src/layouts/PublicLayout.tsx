import { Link, Outlet, useLocation } from "react-router-dom";

// Public website chrome (nav/footer) shared across public pages.
export default function PublicLayout() {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  // Landing page ships its own full-bleed nav/footer UI.
  if (isLanding) return <Outlet />;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-semibold tracking-tight">
            Nexa ACS
          </Link>
          <nav className="flex items-center gap-4 text-sm text-zinc-200">
            <Link to="/events" className="hover:text-white">
              Events
            </Link>
            <Link to="/faq" className="hover:text-white">
              FAQ
            </Link>
            <Link to="/contact" className="hover:text-white">
              Contact
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-white px-3 py-1.5 text-zinc-950 hover:bg-zinc-100"
            >
              Register
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-zinc-400">
        © {new Date().getFullYear()} Nexa ACS
      </footer>
    </div>
  );
}

