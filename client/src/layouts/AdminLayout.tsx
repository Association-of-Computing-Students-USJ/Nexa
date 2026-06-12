import { useEffect, useState } from "react";
import { Link, Navigate, Outlet, useNavigate, useLocation } from "react-router-dom";
import nexaLogo from "../assets/images/logo/NEXA Colour.png";
import CustomCursor from "../components/CustomCursor";
import { ensureFirebaseAuth, firebaseAuthErrorMessage, signOutAdmin } from "../lib/firebaseAuth";
import { ADMIN_SESSION_KEY } from "../pages/admin/AdminLoginPage";
import { RegistrationsProvider, useRegistrations } from "../context/RegistrationsContext";

const NAV_ITEMS = [
  { icon: "group",            label: "Participants", path: "/admin/dashboard" },
  { icon: "qr_code_scanner",  label: "QR Scanner",  path: "/admin/scanner"   },
  { icon: "sports_esports",   label: "Arena",        path: "/admin/arena"     },
];

function AdminLiveBadge() {
  const { live, loading } = useRegistrations();
  if (loading) return null;
  return (
    <div
      className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border ${
        live
          ? "bg-emerald-500/8 border-emerald-500/25"
          : "bg-amber-500/8 border-amber-500/25"
      }`}
      title={live ? "Live sync active — changes appear instantly" : "Reconnecting…"}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${live ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}
      />
      <span className={`text-xs font-semibold ${live ? "text-emerald-400" : "text-amber-400"}`}>
        {live ? "Live" : "Offline"}
      </span>
    </div>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAuth = sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Restore Firebase Auth session for Firestore reads/writes (sole backend)
  useEffect(() => {
    if (!isAuth) return;
    ensureFirebaseAuth().catch((err) =>
      console.error("[Admin] Firebase auth failed:", err)
    );
  }, [isAuth]);

  if (!isAuth) return <Navigate to="/admin/login" replace />;

  function handleLogout() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    void signOutAdmin().finally(() => {
      navigate("/admin/login", { replace: true });
    });
  }

  return (
    <RegistrationsProvider>
    <div className="min-h-dvh bg-[#0a0a0a] flex">
      <CustomCursor />

      {/* ── Sidebar (desktop) ─────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 bg-[#111] border-r border-[#1e1e1e] min-h-dvh">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[#1e1e1e]">
          <img src={nexaLogo} alt="NEXA" className="h-8 w-8 object-contain shrink-0" />
          <div>
            <p className="font-bold text-white text-sm leading-tight">NEXA Admin</p>
            <p className="text-[#555] text-xs">Management Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#19D1E6]/10 text-[#19D1E6] border border-[#19D1E6]/20"
                    : "text-[#888] hover:text-white hover:bg-[#1a1a1a]"
                }`}
              >
                <span className="material-symbols-outlined text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-5 border-t border-[#1e1e1e] pt-4 space-y-1">
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-[#888] hover:text-white hover:bg-[#1a1a1a] transition-colors"
          >
            <span className="material-symbols-outlined text-base">open_in_new</span>
            View Site
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-[#888] hover:text-red-400 hover:bg-red-500/5 transition-colors"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile sidebar overlay ─────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-[#111] border-r border-[#1e1e1e] transform transition-transform duration-300 md:hidden ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex items-center justify-between px-5 py-5 border-b border-[#1e1e1e]">
          <div className="flex items-center gap-3">
            <img src={nexaLogo} alt="NEXA" className="h-8 w-8 object-contain" />
            <div>
              <p className="font-bold text-white text-sm">NEXA Admin</p>
              <p className="text-[#555] text-xs">Management Portal</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2.5 text-[#555] hover:text-white transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                active ? "bg-[#19D1E6]/10 text-[#19D1E6] border border-[#19D1E6]/20" : "text-[#888] hover:text-white hover:bg-[#1a1a1a]"
              }`}>
                <span className="material-symbols-outlined text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 pb-5 border-t border-[#1e1e1e] pt-4 space-y-1">
          <Link to="/" target="_blank" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-[#888] hover:text-white hover:bg-[#1a1a1a] transition-colors">
            <span className="material-symbols-outlined text-base">open_in_new</span>
            View Site
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-[#888] hover:text-red-400 hover:bg-red-500/5 transition-colors">
            <span className="material-symbols-outlined text-base">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#111]/90 backdrop-blur-xl border-b border-[#1e1e1e] px-4 sm:px-6 py-3.5 flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2.5 text-[#555] hover:text-white transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>

          {/* Page title */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[#19D1E6] text-base">
              {NAV_ITEMS.find(n => n.path === location.pathname)?.icon ?? "dashboard"}
            </span>
            <h2 className="text-sm font-semibold text-white truncate">
              {NAV_ITEMS.find(n => n.path === location.pathname)?.label ?? "Admin"}
            </h2>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <AdminLiveBadge />
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#19D1E6]/8 border border-[#19D1E6]/20">
              <span className="w-1.5 h-1.5 bg-[#19D1E6] rounded-full animate-pulse" />
              <span className="text-[#19D1E6] text-xs font-semibold">Admin</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 text-[#555] hover:text-red-400 transition-colors"
              title="Sign out"
            >
              <span className="material-symbols-outlined text-base">logout</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
    </RegistrationsProvider>
  );
}
