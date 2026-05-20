import { Link, Outlet, useLocation } from "react-router-dom";
import nexaLogo from "../assets/images/logo/NEXA Colour.png";
import CustomCursor from "../components/CustomCursor";

export default function PublicLayout() {
  const location = useLocation();

  // The landing page manages its own full-bleed nav/footer/cursor.
  if (location.pathname === "/") return <Outlet />;

  return (
    <div className="min-h-dvh bg-[#0e0e0e] text-white">
      <CustomCursor />

      {/* Light navbar — matches HomePage style */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8 py-4">
          <Link to="/" className="flex items-center gap-2.5" data-cursor="Home">
            <img src={nexaLogo} alt="NEXA" className="h-8 w-8 object-contain" />
            <span className="text-xl font-bold tracking-tight text-[#19D1E6]">NEXA</span>
          </Link>
          <nav className="flex items-center gap-8">
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
              className="px-6 py-2.5 bg-[#19D1E6] text-[#0e0e0e] font-semibold text-sm rounded-full hover:bg-[#19D1E6]/90 transition-all hover:scale-105 glow"
              data-cursor="Register">
              Register Now
            </Link>
          </nav>
        </div>
      </header>

      <Outlet />
    </div>
  );
}
