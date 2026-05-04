import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken } from "../services/auth";

// Admin dashboard chrome + simple route-guard.
export default function AdminLayout() {
  const token = getToken();
  const location = useLocation();

  if (!token) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;

  return (
    <div className="min-h-dvh">
      <header className="border-b border-white/10 bg-zinc-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/admin/events" className="font-semibold tracking-tight">
            Admin
          </Link>
          <nav className="flex items-center gap-4 text-sm text-zinc-200">
            <Link to="/admin/events" className="hover:text-white">
              Events
            </Link>
            <Link to="/admin/registrations" className="hover:text-white">
              Registrations
            </Link>
            <Link to="/admin/users" className="hover:text-white">
              Users
            </Link>
            <Link to="/admin/live-scores" className="hover:text-white">
              Live Scores
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
}

