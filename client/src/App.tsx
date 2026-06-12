import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import AdminLayout from "./layouts/AdminLayout";
import HomePageSkeleton from "./components/HomePageSkeleton";
import PageSkeleton from "./components/PageSkeleton";
import AdminLoginPage from "./pages/admin/AdminLoginPage";

const HomePage = lazy(() => import("./pages/public/HomePage"));
const RegisterPage = lazy(() => import("./pages/public/RegisterPage"));
const TicketPage = lazy(() => import("./pages/public/TicketPage"));
const FeedbackPage = lazy(() => import("./pages/public/FeedbackPage"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminScannerPage = lazy(() => import("./pages/admin/AdminScannerPage"));
const AdminFeedbackPage = lazy(() => import("./pages/admin/AdminFeedbackPage"));
const AdminArenaPage = lazy(() => import("./pages/admin/AdminArenaPage"));
const GamePage = lazy(() => import("./pages/public/GamePage"));
const GameRegisterPage = lazy(() => import("./pages/public/GameRegisterPage"));

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
          path="/register"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <RegisterPage />
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
        <Route
          path="/feedback"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <FeedbackPage />
            </Suspense>
          }
        />
      </Route>
      <Route
        path="/game"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <GamePage />
          </Suspense>
        }
      />
      <Route
        path="/game/register"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <GameRegisterPage />
          </Suspense>
        }
      />

      {/* ── Admin routes ──────────────────────────────────── */}
      <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin/arena"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <AdminArenaPage />
          </Suspense>
        }
      />
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
        <Route
          path="/admin/feedback"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <AdminFeedbackPage />
            </Suspense>
          }
        />
      </Route>

      {/* ── Fallback ──────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
