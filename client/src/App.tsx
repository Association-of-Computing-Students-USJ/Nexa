import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import AdminLayout from "./layouts/AdminLayout";
import HomePageSkeleton from "./components/HomePageSkeleton";
import PageSkeleton from "./components/PageSkeleton";
import AdminLoginPage from "./pages/admin/AdminLoginPage";

const HomePage = lazy(() => import("./pages/public/HomePage"));
const TicketPage = lazy(() => import("./pages/public/TicketPage"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminScannerPage = lazy(() => import("./pages/admin/AdminScannerPage"));

export default function App() {
  return (
    <Routes>
      {/* ── Public routes ─────────────────────────────────── */}
      <Route element={<PublicLayout />}>
        <Route
          path="/"
          element={
            <Suspense fallback={<HomePageSkeleton />}>
              <HomePage />
            </Suspense>
          }
        />
        <Route
          path="/ticket"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <TicketPage />
            </Suspense>
          }
        />
      </Route>

      {/* ── Admin routes ──────────────────────────────────── */}
      <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route element={<AdminLayout />}>
        <Route
          path="/admin/dashboard"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <AdminDashboardPage />
            </Suspense>
          }
        />
        <Route
          path="/admin/scanner"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <AdminScannerPage />
            </Suspense>
          }
        />
      </Route>

      {/* ── Fallback ──────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
