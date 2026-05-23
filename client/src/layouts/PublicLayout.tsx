import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import nexaLogo from "../assets/images/logo/NEXA Colour.png";
import CustomCursor from "../components/CustomCursor";

export default function PublicLayout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // The landing page manages its own full-bleed nav/footer/cursor.
  if (location.pathname === "/") return <Outlet />;

  return (
    <div className="min-h-dvh bg-[#0e0e0e] text-white">
      <CustomCursor />

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0" data-cursor="Home">
            <img src={nexaLogo} alt="NEXA" className="h-8 w-8 object-contain" />
            <span className="text-xl font-bold tracking-tight text-[#19D1E6]">NEXA</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <Link to="/"
              className="text-sm font-medium text-gray-600 hover:text-[#19D1E6] transition-colors"
              data-cursor="View">
              Home
            </Link>
            <Link to="/#sessions"
              className="text-sm font-medium text-gray-600 hover:text-[#19D1E6] transition-colors"
              data-cursor="View">
              Sessions
            </Link>
            <Link to="/register"
              className="px-5 py-2.5 bg-[#19D1E6] text-[#0e0e0e] font-semibold text-sm rounded-full hover:bg-[#19D1E6]/90 transition-all hover:scale-105 glow"
              data-cursor="Register">
              Register Now
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden p-3 text-gray-700 hover:text-[#19D1E6] transition-colors"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen(v => !v)}
          >
            <span className="material-symbols-outlined text-2xl">
              {menuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile menu overlay — z-60 so it sits above the z-50 sticky header */}
      {menuOpen && (
        <div className="fixed inset-0 z-60 bg-white flex flex-col items-center justify-center gap-8 md:hidden">
          <Link to="/" onClick={() => setMenuOpen(false)}
            className="text-3xl font-semibold text-gray-900 hover:text-[#19D1E6] transition-colors">
            Home
          </Link>
          <Link to="/#sessions" onClick={() => setMenuOpen(false)}
            className="text-3xl font-semibold text-gray-900 hover:text-[#19D1E6] transition-colors">
            Sessions
          </Link>
          <Link to="/register" onClick={() => setMenuOpen(false)}
            className="px-8 py-3 bg-[#19D1E6] text-[#0e0e0e] font-semibold rounded-full text-lg glow">
            Register Now
          </Link>
        </div>
      )}

      <Outlet />
    </div>
  );
}
