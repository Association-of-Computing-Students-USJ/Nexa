import { Navigate, Route, Routes } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import AdminLayout from "./layouts/AdminLayout";

import HomePage from "./pages/public/HomePage";
import EventsPage from "./pages/public/EventsPage";
import EventDetailsPage from "./pages/public/EventDetailsPage";
import AboutPage from "./pages/public/AboutPage";
import FAQPage from "./pages/public/FAQPage";
import ContactPage from "./pages/public/ContactPage";
import RegisterPage from "./pages/public/RegisterPage";

import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminEventsPage from "./pages/admin/AdminEventsPage";
import AdminRegistrationsPage from "./pages/admin/AdminRegistrationsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminLiveScoresPage from "./pages/admin/AdminLiveScoresPage";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route path="/admin/login" element={<AdminLoginPage />} />

      <Route element={<AdminLayout />}>
        <Route path="/admin/events" element={<AdminEventsPage />} />
        <Route path="/admin/registrations" element={<AdminRegistrationsPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/live-scores" element={<AdminLiveScoresPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
