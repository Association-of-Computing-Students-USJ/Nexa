import { useState, useMemo, useEffect } from "react";
import {
  deleteDoc,
  doc,
  Timestamp,
  collection,
  onSnapshot,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { undoEntry, undoMeal } from "../../lib/checkIn";
import { useRegistrations } from "../../context/RegistrationsContext";
import type { Participant } from "../../types/participant";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface AdminTeamType {
  id: string; // doc ID which is the team name
  registeredAt?: Timestamp | null;
  gameResults?: Array<{
    gameId: string;
    gameName: string;
    timeInMs: number;
    formattedTime: string;
  }>;
  totalTimeTaken?: number;
  gameStartTime?: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeToDate(ts: any): Date | null {
  if (!ts) return null;
  if (typeof ts.toDate === "function") {
    return ts.toDate();
  }
  if (ts instanceof Date) {
    return ts;
  }
  if (typeof ts === "number") {
    return new Date(ts);
  }
  if (typeof ts === "string") {
    return new Date(ts);
  }
  if (ts.seconds !== undefined) {
    return new Date(ts.seconds * 1000 + (ts.nanoseconds || 0) / 1000000);
  }
  return null;
}

function fmtDate(ts: any): string {
  const d = safeToDate(ts);
  if (!d) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatMs(ms?: number): string {
  if (!ms || typeof ms !== "number") return "—";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}.${centiseconds < 10 ? "0" : ""}${centiseconds}`;
}

function isToday(ts: any): boolean {
  const d = safeToDate(ts);
  if (!d) return false;
  const now = new Date();
  return d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
}

function exportCSV(rows: Participant[]) {
  const header = ["Name", "Email", "Phone", "WhatsApp", "University", "Year", "Registered At", "Entry Attended", "Attended At", "Meal Served", "Meal Served At"];
  const lines = [
    header.join(","),
    ...rows.map(r =>
      [r.name, r.email, r.phone, r.whatsapp, r.university, r.year, fmtDate(r.registeredAt), r.attended ? "Yes" : "No", fmtDate(r.attendedAt), r.mealServed ? "Yes" : "No", fmtDate(r.mealServedAt)]
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nexa-2026-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, accent = false }: {
  icon: string; label: string; value: string | number; accent?: boolean;
}) {
  return (
    <div className={`p-5 rounded-2xl border flex items-center gap-4 ${
      accent
        ? "bg-[#19D1E6]/8 border-[#19D1E6]/25"
        : "bg-[#161616] border-[#2a2a2a]"
    }`}>
      <div className={`p-3 rounded-xl shrink-0 ${
        accent ? "bg-[#19D1E6]/15 text-[#19D1E6]" : "bg-[#222] text-[#19D1E6]"
      }`}>
        <span className="material-symbols-outlined text-xl">{icon}</span>
      </div>
      <div>
        <p className="text-[#888] text-xs uppercase tracking-wider font-medium">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({ name, onConfirm, onCancel }: {
  name: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400">
            <span className="material-symbols-outlined">delete</span>
          </div>
          <h3 className="font-bold text-white text-lg">Remove Participant</h3>
        </div>
        <p className="text-[#888] text-sm mb-6 leading-relaxed">
          Are you sure you want to remove <span className="text-white font-semibold">{name}</span>?
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 border border-[#2a2a2a] text-[#888] rounded-xl hover:border-[#444] hover:text-white transition-colors text-sm font-medium">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors text-sm font-semibold">
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function DetailDrawer({ p, onClose }: { p: Participant; onClose: () => void }) {
  const [undoing, setUndoing] = useState<"entry" | "meal" | null>(null);
  const [undoError, setUndoError] = useState("");

  const infoFields = [
    { icon: "person",         label: "Full Name",     value: p.name },
    { icon: "mail",           label: "Email",         value: p.email },
    { icon: "phone",          label: "Phone",         value: p.phone },
    { icon: "chat",           label: "WhatsApp",      value: p.whatsapp },
    { icon: "school",         label: "University",    value: p.university },
    { icon: "calendar_today", label: "Academic Year", value: p.year },
    { icon: "schedule",       label: "Registered At", value: fmtDate(p.registeredAt) },
    { icon: "badge",          label: "Ticket ID",     value: p.id.slice(0, 12).toUpperCase() },
  ];

  async function handleUndoEntry() {
    if (!p.attended || undoing) return;
    setUndoing("entry");
    setUndoError("");
    try {
      await undoEntry(p.id);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      setUndoError(
        code === "permission-denied"
          ? "Could not undo check-in — Firebase Auth may not be set up."
          : "Could not undo check-in. Please try again."
      );
    } finally {
      setUndoing(null);
    }
  }

  async function handleUndoMeal() {
    if (!p.mealServed || undoing) return;
    setUndoing("meal");
    setUndoError("");
    try {
      await undoMeal(p.id);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      setUndoError(
        code === "permission-denied"
          ? "Could not undo meal status — Firebase Auth may not be set up."
          : "Could not undo meal status. Please try again."
      );
    } finally {
      setUndoing(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-sm h-full bg-[#161616] border-l border-[#2a2a2a] shadow-2xl overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-[#2a2a2a] flex items-center justify-between">
          <h3 className="font-bold text-white text-base">Participant Details</h3>
          <button onClick={onClose} className="p-2.5 text-[#555] hover:text-white transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 flex-1">
          {/* Avatar */}
          <div className="flex items-center gap-3 p-4 bg-[#0e0e0e] rounded-2xl border border-[#2a2a2a]">
            <div className="w-12 h-12 rounded-full bg-[#19D1E6]/10 border border-[#19D1E6]/20 flex items-center justify-center shrink-0">
              <span className="text-[#19D1E6] font-bold text-lg">{p.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white truncate">{p.name}</p>
              <p className="text-[#888] text-xs truncate">{p.university}</p>
            </div>
            {isToday(p.registeredAt) && (
              <span className="ml-auto shrink-0 px-2 py-0.5 text-[10px] font-bold bg-[#19D1E6]/15 text-[#19D1E6] rounded-full uppercase tracking-wider">New</span>
            )}
          </div>

          {undoError && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/25 rounded-xl">
              <span className="material-symbols-outlined text-red-400 text-base shrink-0">error</span>
              <p className="text-red-400 text-xs leading-relaxed flex-1">{undoError}</p>
              <button onClick={() => setUndoError("")} className="text-red-400/60 hover:text-red-400 shrink-0">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}

          {/* Info fields */}
          <div className="space-y-3">
            {infoFields.map(f => (
              <div key={f.label} className="flex items-start gap-3 p-3 rounded-xl bg-[#0e0e0e] border border-[#1a1a1a]">
                <span className="material-symbols-outlined text-[#19D1E6] text-base mt-0.5 shrink-0">{f.icon}</span>
                <div className="min-w-0">
                  <p className="text-[#555] text-[10px] uppercase tracking-wider">{f.label}</p>
                  <p className="text-white text-sm font-medium break-all mt-0.5">{f.value}</p>
                </div>
              </div>
            ))}

            {/* Entry check-in — with undo */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0e0e0e] border border-[#1a1a1a]">
              <span className="material-symbols-outlined text-[#19D1E6] text-base mt-0.5 shrink-0">how_to_reg</span>
              <div className="flex-1 min-w-0">
                <p className="text-[#555] text-[10px] uppercase tracking-wider">Entry Check-In</p>
                <p className={`text-sm font-medium mt-0.5 ${p.attended ? "text-emerald-400" : "text-[#888]"}`}>
                  {p.attended ? `✓ ${fmtDate(p.attendedAt)}` : "Not checked in"}
                </p>
              </div>
              {p.attended && (
                <button
                  onClick={handleUndoEntry}
                  disabled={undoing !== null}
                  className="shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-400 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  title="Undo check-in"
                >
                  {undoing === "entry" ? (
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                    </svg>
                  ) : (
                    <span className="material-symbols-outlined text-sm">undo</span>
                  )}
                  Undo
                </button>
              )}
            </div>

            {/* Meal status — with undo */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0e0e0e] border border-[#1a1a1a]">
              <span className="material-symbols-outlined text-[#19D1E6] text-base mt-0.5 shrink-0">restaurant</span>
              <div className="flex-1 min-w-0">
                <p className="text-[#555] text-[10px] uppercase tracking-wider">Meal Status</p>
                <p className={`text-sm font-medium mt-0.5 ${p.mealServed ? "text-orange-400" : "text-[#888]"}`}>
                  {p.mealServed ? `✓ ${fmtDate(p.mealServedAt)}` : "Not served"}
                </p>
              </div>
              {p.mealServed && (
                <button
                  onClick={handleUndoMeal}
                  disabled={undoing !== null}
                  className="shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-400 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  title="Undo meal served"
                >
                  {undoing === "meal" ? (
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                    </svg>
                  ) : (
                    <span className="material-symbols-outlined text-sm">undo</span>
                  )}
                  Undo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { participants, loading, error: firestoreError } = useRegistrations();
  const [activeTab, setActiveTab] = useState<"participants" | "teams">("participants");
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("All");
  const [deleteTarget, setDeleteTarget] = useState<Participant | null>(null);
  const [detailTarget, setDetailTarget] = useState<Participant | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Teams state
  const [teams, setTeams] = useState<AdminTeamType[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState("");
  const [teamsSearch, setTeamsSearch] = useState("");
  const [copiedTeam, setCopiedTeam] = useState<{ id: string; type: "leader" | "member" } | null>(null);

  // Subscribe to teams collection in real-time
  useEffect(() => {
    const teamsCol = collection(db, "teams");
    const unsubscribe = onSnapshot(
      teamsCol,
      (snapshot) => {
        const teamsData: AdminTeamType[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          teamsData.push({
            id: doc.id,
            registeredAt: data.registeredAt || null,
            gameResults: data.gameResults || [],
            totalTimeTaken: typeof data.totalTimeTaken === "number" ? data.totalTimeTaken : 0,
            gameStartTime: data.gameStartTime || null,
          });
        });
        // Sort teams by registration time
        teamsData.sort((a, b) => {
          const aTime = safeToDate(a.registeredAt)?.getTime() || 0;
          const bTime = safeToDate(b.registeredAt)?.getTime() || 0;
          return bTime - aTime;
        });
        setTeams(teamsData);
        setTeamsLoading(false);
      },
      (err) => {
        console.error("Error listening to teams:", err);
        setTeamsError("Failed to fetch teams: " + err.message);
        setTeamsLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  // Filtered teams
  const filteredTeams = useMemo(() => {
    const q = teamsSearch.toLowerCase().trim();
    if (!q) return teams;
    return teams.filter(t => t.id.toLowerCase().includes(q));
  }, [teams, teamsSearch]);

  // Derived stats for participants
  const todayCount = useMemo(() => participants.filter(p => isToday(p.registeredAt)).length, [participants]);
  const universities = useMemo(() => new Set(participants.map(p => p.university)).size, [participants]);
  const attendedCount = useMemo(() => participants.filter(p => p.attended).length, [participants]);
  const mealServedCount = useMemo(() => participants.filter(p => p.mealServed).length, [participants]);
  const years = useMemo(() => ["All", ...Array.from(new Set(participants.map(p => p.year))).sort()], [participants]);

  // Derived stats for teams
  const totalTeamsCount = teams.length;
  const completedTeamsCount = useMemo(() => teams.filter(t => (t.gameResults || []).length >= 2).length, [teams]);
  const inProgressTeamsCount = useMemo(() => teams.filter(t => (t.gameResults || []).length > 0 && (t.gameResults || []).length < 2).length, [teams]);
  const waitingTeamsCount = useMemo(() => teams.filter(t => (t.gameResults || []).length === 0).length, [teams]);

  // Filtered participants rows
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return participants.filter(p => {
      const matchSearch = !q || p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) || p.university.toLowerCase().includes(q);
      const matchYear = yearFilter === "All" || p.year === yearFilter;
      return matchSearch && matchYear;
    });
  }, [participants, search, yearFilter]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteDoc(doc(db, "registrations", deleteTarget.id));
    setDeleteTarget(null);
    setDeleting(false);
  }

  // Global game control functions
  async function triggerGlobalStart(offsetSeconds: number) {
    try {
      const startTime = Date.now() + (offsetSeconds * 1000);
      const batch = writeBatch(db);
      teams.forEach((t) => {
        const docRef = doc(db, "teams", t.id);
        batch.update(docRef, { gameStartTime: startTime });
      });
      await batch.commit();
      alert(`Synchronized start time set to ${offsetSeconds === 0 ? "immediately" : `in ${offsetSeconds} seconds`} for all teams!`);
    } catch (err: any) {
      alert("Failed to set global start time: " + err.message);
    }
  }

  async function clearAllStartTimes() {
    try {
      const batch = writeBatch(db);
      teams.forEach((t) => {
        const docRef = doc(db, "teams", t.id);
        batch.update(docRef, { gameStartTime: null });
      });
      await batch.commit();
      alert("Cleared start times for all teams.");
    } catch (err: any) {
      alert("Failed to clear start times: " + err.message);
    }
  }

  async function resetAllTeams() {
    if (!window.confirm("Are you sure you want to reset ALL teams' game progress? This will erase all play times!")) return;
    try {
      const batch = writeBatch(db);
      teams.forEach((t) => {
        const docRef = doc(db, "teams", t.id);
        batch.update(docRef, {
          gameResults: [],
          totalTimeTaken: 0,
        });
      });
      await batch.commit();
      alert("Reset all teams' progress successfully!");
    } catch (err: any) {
      alert("Failed to reset all teams: " + err.message);
    }
  }

  async function handleResetTeam(teamId: string) {
    if (!window.confirm(`Are you sure you want to reset the progress for team "${teamId}"?`)) return;
    try {
      const docRef = doc(db, "teams", teamId);
      await updateDoc(docRef, {
        gameResults: [],
        totalTimeTaken: 0,
      });
    } catch (err: any) {
      alert("Error resetting progress: " + err.message);
    }
  }

  async function handleDeleteTeam(teamId: string) {
    if (!window.confirm(`Are you sure you want to permanently delete team "${teamId}"? This action cannot be undone.`)) return;
    try {
      const docRef = doc(db, "teams", teamId);
      await deleteDoc(docRef);
    } catch (err: any) {
      alert("Error deleting team: " + err.message);
    }
  }

  const handleCopyLink = (text: string, teamId: string, type: "leader" | "member") => {
    navigator.clipboard.writeText(text);
    setCopiedTeam({ id: teamId, type });
    setTimeout(() => setCopiedTeam(null), 2000);
  };

  const getTeamLinks = (teamName: string) => {
    const origin = window.location.origin;
    const leaderUrl = `${origin}/game?team=${encodeURIComponent(teamName)}&editable=true`;
    const memberUrl = `${origin}/game?team=${encodeURIComponent(teamName)}`;
    return { leaderUrl, memberUrl };
  };

  return (
    <>
      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {detailTarget && (
        <DetailDrawer
          p={participants.find((x) => x.id === detailTarget.id) ?? detailTarget}
          onClose={() => setDetailTarget(null)}
        />
      )}

      <div className="space-y-6">

        {/* Auth/Firestore error banner */}
        {firestoreError && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <span className="material-symbols-outlined text-red-400 text-base mt-0.5 shrink-0">error</span>
            <p className="text-red-400 text-sm font-mono break-all">{firestoreError}</p>
          </div>
        )}

        {/* Tab selection */}
        <div className="flex border-b border-[#2a2a2a] gap-6 mb-2">
          <button
            onClick={() => setActiveTab("participants")}
            className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all relative top-[2px] ${
              activeTab === "participants"
                ? "border-[#19D1E6] text-[#19D1E6]"
                : "border-transparent text-[#555] hover:text-white"
            }`}
          >
            Participants
          </button>
          <button
            onClick={() => setActiveTab("teams")}
            className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all relative top-[2px] ${
              activeTab === "teams"
                ? "border-[#19D1E6] text-[#19D1E6]"
                : "border-transparent text-[#555] hover:text-white"
            }`}
          >
            Game Teams
          </button>
        </div>

        {activeTab === "participants" ? (
          <>
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Participants</h1>
                <p className="text-[#888] text-sm mt-0.5">All NEXA 2026 registrations</p>
              </div>
              <button
                onClick={() => exportCSV(filtered)}
                disabled={filtered.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#19D1E6] text-[#0e0e0e] font-semibold rounded-xl hover:bg-[#19D1E6]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm shrink-0"
              >
                <span className="material-symbols-outlined text-base">download</span>
                Export CSV
              </button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatCard icon="group"      label="Total Registered"  value={participants.length} accent />
              <StatCard icon="how_to_reg" label="Entry Attended"    value={attendedCount} />
              <StatCard icon="restaurant" label="Meals Served"      value={mealServedCount} />
              <StatCard icon="today"      label="Registered Today"  value={todayCount} />
              <StatCard icon="school"     label="Universities"      value={universities} />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#444] text-base pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search by name, email or university…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded-xl pl-10 pr-4 py-3 text-sm placeholder-[#444] focus:outline-none focus:ring-2 focus:ring-[#19D1E6]/30 focus:border-[#19D1E6]/60 transition-colors"
                />
              </div>
              <div className="relative w-full sm:w-auto">
                <select
                  value={yearFilter}
                  onChange={e => setYearFilter(e.target.value)}
                  className="w-full sm:w-auto bg-[#161616] border border-[#2a2a2a] text-white rounded-xl px-4 py-3 text-sm appearance-none pr-10 focus:outline-none focus:ring-2 focus:ring-[#19D1E6]/30 focus:border-[#19D1E6]/60 transition-colors"
                >
                  {years.map(y => <option key={y} value={y}>{y === "All" ? "All Years" : y}</option>)}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[#444] text-base pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl overflow-hidden">
              {/* Results count */}
              <div className="px-4 sm:px-5 py-3 border-b border-[#2a2a2a] flex items-center justify-between">
                <span className="text-[#888] text-xs">
                  {filtered.length} {filtered.length === 1 ? "result" : "results"}
                  {(search || yearFilter !== "All") && ` · filtered from ${participants.length}`}
                </span>
                {(search || yearFilter !== "All") && (
                  <button
                    onClick={() => { setSearch(""); setYearFilter("All"); }}
                    className="text-[#19D1E6] text-xs hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20 gap-3">
                  <svg className="animate-spin h-5 w-5 text-[#19D1E6]" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                  <span className="text-[#888] text-sm">Loading registrations…</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <span className="material-symbols-outlined text-4xl text-[#2a2a2a]">person_search</span>
                  <p className="text-[#555] text-sm">No registrations found</p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#2a2a2a]">
                          {["Name", "Email", "Phone", "University", "Year", "Registered", "Entry", "Meal", ""].map(h => (
                            <th key={h} className="text-left text-[#555] text-xs font-semibold uppercase tracking-wider px-5 py-3">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1a1a1a]">
                        {filtered.map(p => (
                          <tr key={p.id} className="hover:bg-[#1a1a1a] transition-colors group">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-[#19D1E6]/10 border border-[#19D1E6]/20 flex items-center justify-center shrink-0">
                                  <span className="text-[#19D1E6] font-bold text-xs">{p.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <div>
                                  <p className="font-medium text-white truncate max-w-[140px]">{p.name}</p>
                                  {isToday(p.registeredAt) && (
                                    <span className="text-[10px] font-bold text-[#19D1E6] uppercase tracking-wider">New</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-[#888] truncate max-w-[160px]">{p.email}</td>
                            <td className="px-5 py-3.5 text-[#888] whitespace-nowrap">{p.phone}</td>
                            <td className="px-5 py-3.5 text-[#888] truncate max-w-[160px]">{p.university}</td>
                            <td className="px-5 py-3.5">
                              <span className="px-2.5 py-1 text-xs font-medium bg-[#19D1E6]/8 text-[#19D1E6] border border-[#19D1E6]/20 rounded-full whitespace-nowrap">
                                {p.year}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-[#555] text-xs whitespace-nowrap">{fmtDate(p.registeredAt)}</td>
                            <td className="px-5 py-3.5">
                              {p.attended ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full whitespace-nowrap">
                                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                  Attended
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-[#2a2a2a] text-[#555] rounded-full whitespace-nowrap">
                                  <span className="w-1.5 h-1.5 bg-[#555] rounded-full" />
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              {p.mealServed ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full whitespace-nowrap">
                                  <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                                  Served
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-[#2a2a2a] text-[#555] rounded-full whitespace-nowrap">
                                  <span className="w-1.5 h-1.5 bg-[#555] rounded-full" />
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setDetailTarget(p)}
                                  className="p-1.5 rounded-lg text-[#555] hover:text-[#19D1E6] hover:bg-[#19D1E6]/10 transition-colors"
                                  title="View details"
                                >
                                  <span className="material-symbols-outlined text-base">open_in_new</span>
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(p)}
                                  className="p-1.5 rounded-lg text-[#555] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                  title="Remove"
                                >
                                  <span className="material-symbols-outlined text-base">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile card list */}
                  <div className="md:hidden divide-y divide-[#1a1a1a]">
                    {filtered.map(p => (
                      <div key={p.id} className="p-4 flex items-start gap-3 hover:bg-[#1a1a1a] transition-colors">
                        <div className="w-9 h-9 rounded-full bg-[#19D1E6]/10 border border-[#19D1E6]/20 flex items-center justify-center shrink-0">
                          <span className="text-[#19D1E6] font-bold text-sm">{p.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold text-white text-sm truncate">{p.name}</p>
                            {isToday(p.registeredAt) && (
                              <span className="shrink-0 text-[10px] font-bold text-[#19D1E6] uppercase tracking-wider">New</span>
                            )}
                          </div>
                          <p className="text-[#888] text-xs truncate">{p.email}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-[#19D1E6]/8 text-[#19D1E6] border border-[#19D1E6]/20 rounded-full">{p.year}</span>
                            {p.attended ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">Entry ✓</span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-medium bg-[#2a2a2a] text-[#555] rounded-full">No Entry</span>
                            )}
                            {p.mealServed ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full">Meal ✓</span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-medium bg-[#2a2a2a] text-[#555] rounded-full">No Meal</span>
                            )}
                            <span className="text-[#555] text-[11px] truncate">{p.university}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => setDetailTarget(p)} className="p-2.5 rounded-lg text-[#555] hover:text-[#19D1E6] transition-colors">
                            <span className="material-symbols-outlined text-base">open_in_new</span>
                          </button>
                          <button onClick={() => setDeleteTarget(p)} className="p-2.5 rounded-lg text-[#555] hover:text-red-400 transition-colors">
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Teams View */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Game Teams</h1>
                <p className="text-[#888] text-sm mt-0.5">Arena team progress & time management</p>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon="groups" label="Total Teams" value={totalTeamsCount} accent />
              <StatCard icon="hourglass_empty" label="Waiting" value={waitingTeamsCount} />
              <StatCard icon="play_arrow" label="In Progress" value={inProgressTeamsCount} />
              <StatCard icon="emoji_events" label="Completed" value={completedTeamsCount} />
            </div>

            {/* Global Arena Control */}
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#19D1E6]/3 rounded-full blur-2xl pointer-events-none" />
              <h3 className="font-bold text-white text-base mb-1.5 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#19D1E6]">sync_lock</span>
                Global Arena Control
              </h3>
              <p className="text-[#888] text-xs mb-4 leading-relaxed max-w-2xl">
                Synchronize the start times for all registered teams. If a start time is set, a countdown will automatically display for all teams. Once the countdown completes, the play mode unlocks.
              </p>
              <div className="flex flex-wrap gap-2.5 items-center">
                <button
                  onClick={() => triggerGlobalStart(10)}
                  className="px-4 py-2.5 bg-[#19D1E6]/10 hover:bg-[#19D1E6]/20 text-[#19D1E6] border border-[#19D1E6]/30 font-semibold rounded-xl text-xs transition duration-200"
                >
                  Start in 10 Seconds
                </button>
                <button
                  onClick={() => triggerGlobalStart(60)}
                  className="px-4 py-2.5 bg-[#19D1E6]/10 hover:bg-[#19D1E6]/20 text-[#19D1E6] border border-[#19D1E6]/30 font-semibold rounded-xl text-xs transition duration-200"
                >
                  Start in 1 Minute
                </button>
                <button
                  onClick={() => triggerGlobalStart(300)}
                  className="px-4 py-2.5 bg-[#19D1E6]/10 hover:bg-[#19D1E6]/20 text-[#19D1E6] border border-[#19D1E6]/30 font-semibold rounded-xl text-xs transition duration-200"
                >
                  Start in 5 Minutes
                </button>
                <button
                  onClick={() => triggerGlobalStart(0)}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs transition duration-200"
                >
                  Start Immediately
                </button>
                <button
                  onClick={clearAllStartTimes}
                  className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold rounded-xl text-xs transition duration-200"
                >
                  Clear Countdowns
                </button>
                <button
                  onClick={resetAllTeams}
                  className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 font-semibold rounded-xl text-xs transition duration-200 sm:ml-auto"
                >
                  Reset All Teams
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#444] text-base pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search teams by name…"
                  value={teamsSearch}
                  onChange={e => setTeamsSearch(e.target.value)}
                  className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded-xl pl-10 pr-4 py-3 text-sm placeholder-[#444] focus:outline-none focus:ring-2 focus:ring-[#19D1E6]/30 focus:border-[#19D1E6]/60 transition-colors"
                />
              </div>
            </div>

            {/* Table */}
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl overflow-hidden">
              <div className="px-4 sm:px-5 py-3 border-b border-[#2a2a2a] flex items-center justify-between">
                <span className="text-[#888] text-xs">
                  {filteredTeams.length} {filteredTeams.length === 1 ? "team" : "teams"}
                  {teamsSearch && ` · filtered from ${teams.length}`}
                </span>
                {teamsSearch && (
                  <button
                    onClick={() => setTeamsSearch("")}
                    className="text-[#19D1E6] text-xs hover:underline"
                  >
                    Clear filter
                  </button>
                )}
              </div>

              {teamsLoading ? (
                <div className="flex items-center justify-center py-20 gap-3">
                  <svg className="animate-spin h-5 w-5 text-[#19D1E6]" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                  <span className="text-[#888] text-sm">Loading teams…</span>
                </div>
              ) : filteredTeams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <span className="material-symbols-outlined text-4xl text-[#2a2a2a]">groups</span>
                  <p className="text-[#555] text-sm">No teams found</p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#2a2a2a]">
                          {["Team Name", "Registered", "Sudoku Time", "15 Puzzle Time", "Total Time", "Status", "Links", ""].map(h => (
                            <th key={h} className="text-left text-[#555] text-xs font-semibold uppercase tracking-wider px-5 py-3">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1a1a1a]">
                        {filteredTeams.map(t => {
                          const sudokuRes = t.gameResults?.find(r => r.gameId === "sudoku");
                          const puzzleRes = t.gameResults?.find(r => r.gameId === "15puzzle");
                          const stageCount = t.gameResults?.length || 0;
                          const { leaderUrl, memberUrl } = getTeamLinks(t.id);

                          return (
                            <tr key={t.id} className="hover:bg-[#1a1a1a] transition-colors group">
                              <td className="px-5 py-3.5">
                                <p className="font-semibold text-white truncate max-w-[180px]">{t.id}</p>
                              </td>
                              <td className="px-5 py-3.5 text-[#888] text-xs whitespace-nowrap">
                                {fmtDate(t.registeredAt)}
                              </td>
                              <td className="px-5 py-3.5 font-mono text-sm text-[#888]">
                                {sudokuRes ? (
                                  <span className="text-emerald-400">{sudokuRes.formattedTime}</span>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="px-5 py-3.5 font-mono text-sm text-[#888]">
                                {puzzleRes ? (
                                  <span className="text-emerald-400">{puzzleRes.formattedTime}</span>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="px-5 py-3.5 font-mono text-sm text-white font-bold">
                                {formatMs(t.totalTimeTaken)}
                              </td>
                              <td className="px-5 py-3.5">
                                {stageCount >= 2 ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full whitespace-nowrap">
                                    ✓ Completed
                                  </span>
                                ) : stageCount === 1 ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-[#19D1E6]/10 text-[#19D1E6] border border-[#19D1E6]/20 rounded-full whitespace-nowrap">
                                    Stage 2 (15 Puzzle)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-[#2a2a2a] text-[#888] rounded-full whitespace-nowrap">
                                    Stage 1 (Sudoku)
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleCopyLink(leaderUrl, t.id, "leader")}
                                    className="px-2 py-1 bg-gray-900 border border-[#2a2a2a] hover:border-[#19D1E6]/40 text-[#888] hover:text-white rounded-lg text-[10px] font-mono flex items-center gap-1 transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-[10px]">vpn_key</span>
                                    {copiedTeam?.id === t.id && copiedTeam?.type === "leader" ? "Copied" : "Leader"}
                                  </button>
                                  <button
                                    onClick={() => handleCopyLink(memberUrl, t.id, "member")}
                                    className="px-2 py-1 bg-gray-900 border border-[#2a2a2a] hover:border-[#19D1E6]/40 text-[#888] hover:text-white rounded-lg text-[10px] font-mono flex items-center gap-1 transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-[10px]">visibility</span>
                                    {copiedTeam?.id === t.id && copiedTeam?.type === "member" ? "Copied" : "Member"}
                                  </button>
                                </div>
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleResetTeam(t.id)}
                                    className="p-1.5 rounded-lg text-[#555] hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                                    title="Reset Progress"
                                  >
                                    <span className="material-symbols-outlined text-base">restart_alt</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTeam(t.id)}
                                    className="p-1.5 rounded-lg text-[#555] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    title="Delete Team"
                                  >
                                    <span className="material-symbols-outlined text-base">delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile card list */}
                  <div className="lg:hidden divide-y divide-[#1a1a1a]">
                    {filteredTeams.map(t => {
                      const sudokuRes = t.gameResults?.find(r => r.gameId === "sudoku");
                      const puzzleRes = t.gameResults?.find(r => r.gameId === "15puzzle");
                      const stageCount = t.gameResults?.length || 0;
                      const { leaderUrl, memberUrl } = getTeamLinks(t.id);

                      return (
                        <div key={t.id} className="p-4 flex flex-col gap-3 hover:bg-[#1a1a1a] transition-colors">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="font-semibold text-white text-base">{t.id}</p>
                              <p className="text-[#555] text-[10px] font-mono mt-0.5">Reg: {fmtDate(t.registeredAt)}</p>
                            </div>
                            {stageCount >= 2 ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">Completed</span>
                            ) : stageCount === 1 ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-[#19D1E6]/10 text-[#19D1E6] border border-[#19D1E6]/20 rounded-full">Stage 2</span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-[#2a2a2a] text-[#888] rounded-full">Stage 1</span>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2 bg-[#0e0e0e] border border-[#1e1e1e] p-2.5 rounded-xl text-center font-mono text-xs">
                            <div>
                              <p className="text-[#555] text-[9px] uppercase">Sudoku</p>
                              <p className="text-white mt-0.5">{sudokuRes ? sudokuRes.formattedTime : "—"}</p>
                            </div>
                            <div>
                              <p className="text-[#555] text-[9px] uppercase">15 Puzzle</p>
                              <p className="text-white mt-0.5">{puzzleRes ? puzzleRes.formattedTime : "—"}</p>
                            </div>
                            <div>
                              <p className="text-[#555] text-[9px] uppercase font-bold">Total</p>
                              <p className="text-[#19D1E6] mt-0.5 font-bold">{formatMs(t.totalTimeTaken)}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-1">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleCopyLink(leaderUrl, t.id, "leader")}
                                className="px-2.5 py-1.5 bg-gray-900 border border-[#2a2a2a] hover:border-[#19D1E6]/40 text-[#888] hover:text-white rounded-lg text-[10px] font-mono flex items-center gap-1 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[11px]">vpn_key</span>
                                {copiedTeam?.id === t.id && copiedTeam?.type === "leader" ? "Copied" : "Leader"}
                              </button>
                              <button
                                onClick={() => handleCopyLink(memberUrl, t.id, "member")}
                                className="px-2.5 py-1.5 bg-gray-900 border border-[#2a2a2a] hover:border-[#19D1E6]/40 text-[#888] hover:text-white rounded-lg text-[10px] font-mono flex items-center gap-1 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[11px]">visibility</span>
                                {copiedTeam?.id === t.id && copiedTeam?.type === "member" ? "Copied" : "Member"}
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleResetTeam(t.id)}
                                className="p-2 bg-gray-900 border border-[#2a2a2a] text-[#888] hover:text-amber-400 rounded-lg hover:bg-amber-500/10 transition-colors"
                                title="Reset"
                              >
                                <span className="material-symbols-outlined text-base leading-none">restart_alt</span>
                              </button>
                              <button
                                onClick={() => handleDeleteTeam(t.id)}
                                className="p-2 bg-gray-900 border border-[#2a2a2a] text-[#888] hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                                title="Delete"
                              >
                                <span className="material-symbols-outlined text-base leading-none">delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
