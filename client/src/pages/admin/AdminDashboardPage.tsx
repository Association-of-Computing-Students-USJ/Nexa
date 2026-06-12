import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { useAdminAccess } from "../../hooks/useAdminAccess";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface AdminPlayerType {
  id: string; // doc ID which is the player name
  registeredAt?: Timestamp | null;
  gameResults?: Array<{
    gameId: string;
    gameName: string;
    timeInMs: number;
    formattedTime: string;
  }>;
  totalTimeTaken?: number;
  playerStartTime?: number;
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
  const navigate = useNavigate();
  const { participants, loading, error: firestoreError } = useRegistrations();
  const { accesses } = useAdminAccess();
  const hasGameAccess = accesses.includes("game");

  const [activeTab, setActiveTab] = useState<"participants" | "players">("participants");
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("All");
  const [deleteTarget, setDeleteTarget] = useState<Participant | null>(null);
  const [detailTarget, setDetailTarget] = useState<Participant | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Players state
  const [players, setPlayers] = useState<AdminPlayerType[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [playersError, setPlayersError] = useState("");
  const [playersSearch, setPlayersSearch] = useState("");
  const [copiedPlayer, setCopiedPlayer] = useState<string | null>(null);

  // Subscribe to players collection in real-time
  useEffect(() => {
    const playersCol = collection(db, "players");
    const unsubscribe = onSnapshot(
      playersCol,
      (snapshot) => {
        const playersData: AdminPlayerType[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          playersData.push({
            id: doc.id,
            registeredAt: data.registeredAt || null,
            gameResults: data.gameResults || [],
            totalTimeTaken: typeof data.totalTimeTaken === "number" ? data.totalTimeTaken : 0,
            playerStartTime: data.playerStartTime || null,
          });
        });
        // Sort players by registration time
        playersData.sort((a, b) => {
          const aTime = safeToDate(a.registeredAt)?.getTime() || 0;
          const bTime = safeToDate(b.registeredAt)?.getTime() || 0;
          return bTime - aTime;
        });
        setPlayers(playersData);
        setPlayersLoading(false);
      },
      (err) => {
        console.error("Error listening to players:", err);
        setPlayersError("Failed to fetch players: " + err.message);
        setPlayersLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  // Filtered players
  const filteredPlayers = useMemo(() => {
    const q = playersSearch.toLowerCase().trim();
    if (!q) return players;
    return players.filter(t => t.id.toLowerCase().includes(q));
  }, [players, playersSearch]);

  // Derived stats for participants
  const todayCount = useMemo(() => participants.filter(p => isToday(p.registeredAt)).length, [participants]);
  const universities = useMemo(() => new Set(participants.map(p => p.university)).size, [participants]);
  const attendedCount = useMemo(() => participants.filter(p => p.attended).length, [participants]);
  const mealServedCount = useMemo(() => participants.filter(p => p.mealServed).length, [participants]);
  const years = useMemo(() => ["All", ...Array.from(new Set(participants.map(p => p.year))).sort()], [participants]);

  // Derived stats for players
  const totalPlayersCount = players.length;
  const completedPlayersCount = useMemo(() => players.filter(t => (t.gameResults || []).length >= 2).length, [players]);
  const inProgressPlayersCount = useMemo(() => players.filter(t => (t.gameResults || []).length > 0 && (t.gameResults || []).length < 2).length, [players]);
  const waitingPlayersCount = useMemo(() => players.filter(t => (t.gameResults || []).length === 0).length, [players]);

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


  async function resetAllPlayers() {
    if (!window.confirm("Are you sure you want to reset ALL players' game progress? This will erase all play times!")) return;
    try {
      const batch = writeBatch(db);
      players.forEach((p) => {
        const docRef = doc(db, "players", p.id);
        batch.update(docRef, {
          gameResults: [],
          totalTimeTaken: 0,
          playerStartTime: null,
        });
      });
      await batch.commit();
      alert("Reset all players' progress successfully!");
    } catch (err: any) {
      alert("Failed to reset all players: " + err.message);
    }
  }

  async function handleResetPlayer(playerId: string) {
    if (!window.confirm(`Are you sure you want to reset the progress for player "${playerId}"?`)) return;
    try {
      const docRef = doc(db, "players", playerId);
      await updateDoc(docRef, {
        gameResults: [],
        totalTimeTaken: 0,
        playerStartTime: null,
      });
    } catch (err: any) {
      alert("Error resetting progress: " + err.message);
    }
  }

  async function handleDeletePlayer(playerId: string) {
    if (!window.confirm(`Are you sure you want to permanently delete player "${playerId}"? This action cannot be undone.`)) return;
    try {
      const docRef = doc(db, "players", playerId);
      await deleteDoc(docRef);
    } catch (err: any) {
      alert("Error deleting player: " + err.message);
    }
  }

  const handleCopyLink = (text: string, playerId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPlayer(playerId);
    setTimeout(() => setCopiedPlayer(null), 2000);
  };

  const getPlayerLink = (playerName: string) => {
    const origin = window.location.origin;
    return `${origin}/game?player=${encodeURIComponent(playerName)}`;
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
            onClick={() => setActiveTab("players")}
            className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all relative top-[2px] ${
              activeTab === "players"
                ? "border-[#19D1E6] text-[#19D1E6]"
                : "border-transparent text-[#555] hover:text-white"
            }`}
          >
            Game Players
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
            {/* Players View */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Game Players</h1>
                <p className="text-[#888] text-sm mt-0.5">Arena player progress & time management</p>
              </div>
              <div className="flex items-center gap-2.5">
                {hasGameAccess && (
                  <>
                    <button
                      onClick={() => navigate("/admin/arena")}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#19D1E6] text-[#0e0e0e] font-semibold rounded-xl hover:bg-[#19D1E6]/90 transition-colors text-sm shrink-0"
                    >
                      <span className="material-symbols-outlined text-base">sports_esports</span>
                      Open Arena
                    </button>
                    <button
                      onClick={resetAllPlayers}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 font-semibold rounded-xl text-sm transition duration-200 shrink-0"
                    >
                      <span className="material-symbols-outlined text-base">restart_alt</span>
                      Reset All
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon="groups" label="Total Players" value={totalPlayersCount} accent />
              <StatCard icon="hourglass_empty" label="Waiting" value={waitingPlayersCount} />
              <StatCard icon="play_arrow" label="In Progress" value={inProgressPlayersCount} />
              <StatCard icon="emoji_events" label="Completed" value={completedPlayersCount} />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#444] text-base pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search players by name…"
                  value={playersSearch}
                  onChange={e => setPlayersSearch(e.target.value)}
                  className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded-xl pl-10 pr-4 py-3 text-sm placeholder-[#444] focus:outline-none focus:ring-2 focus:ring-[#19D1E6]/30 focus:border-[#19D1E6]/60 transition-colors"
                />
              </div>
            </div>

            {/* Table */}
            <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl overflow-hidden">
              <div className="px-4 sm:px-5 py-3 border-b border-[#2a2a2a] flex items-center justify-between">
                <span className="text-[#888] text-xs">
                  {filteredPlayers.length} {filteredPlayers.length === 1 ? "player" : "players"}
                  {playersSearch && ` · filtered from ${players.length}`}
                </span>
                {playersSearch && (
                  <button
                    onClick={() => setPlayersSearch("")}
                    className="text-[#19D1E6] text-xs hover:underline"
                  >
                    Clear filter
                  </button>
                )}
              </div>

              {playersLoading ? (
                <div className="flex items-center justify-center py-20 gap-3">
                  <svg className="animate-spin h-5 w-5 text-[#19D1E6]" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                  <span className="text-[#888] text-sm">Loading players…</span>
                </div>
              ) : filteredPlayers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <span className="material-symbols-outlined text-4xl text-[#2a2a2a]">groups</span>
                  <p className="text-[#555] text-sm">No players found</p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#2a2a2a]">
                          {["Player Name", "Registered", "Sudoku Time", "15 Puzzle Time", "Total Time", "Status", "Game Link", ""].map(h => (
                            <th key={h} className="text-left text-[#555] text-xs font-semibold uppercase tracking-wider px-5 py-3">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1a1a1a]">
                        {filteredPlayers.map(p => {
                          const sudokuRes = p.gameResults?.find(r => r.gameId === "sudoku");
                          const puzzleRes = p.gameResults?.find(r => r.gameId === "15puzzle");
                          const stageCount = p.gameResults?.length || 0;
                          const gameUrl = getPlayerLink(p.id);

                          return (
                            <tr key={p.id} className="hover:bg-[#1a1a1a] transition-colors group">
                              <td className="px-5 py-3.5">
                                <p className="font-semibold text-white truncate max-w-[180px]">{p.id}</p>
                              </td>
                              <td className="px-5 py-3.5 text-[#888] text-xs whitespace-nowrap">
                                {fmtDate(p.registeredAt)}
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
                                {formatMs(p.totalTimeTaken)}
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
                                <button
                                  onClick={() => handleCopyLink(gameUrl, p.id)}
                                  className="px-3 py-1.5 bg-gray-900 border border-[#2a2a2a] hover:border-[#19D1E6]/40 text-[#888] hover:text-white rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-xs">link</span>
                                  {copiedPlayer === p.id ? "Copied!" : "Copy Link"}
                                </button>
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {hasGameAccess && (
                                    <>
                                      <button
                                        onClick={() => handleResetPlayer(p.id)}
                                        className="p-1.5 rounded-lg text-[#555] hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                                        title="Reset Progress"
                                      >
                                        <span className="material-symbols-outlined text-base">restart_alt</span>
                                      </button>
                                      <button
                                        onClick={() => handleDeletePlayer(p.id)}
                                        className="p-1.5 rounded-lg text-[#555] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                        title="Delete Player"
                                      >
                                        <span className="material-symbols-outlined text-base">delete</span>
                                      </button>
                                    </>
                                  )}
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
                    {filteredPlayers.map(p => {
                      const sudokuRes = p.gameResults?.find(r => r.gameId === "sudoku");
                      const puzzleRes = p.gameResults?.find(r => r.gameId === "15puzzle");
                      const stageCount = p.gameResults?.length || 0;
                      const gameUrl = getPlayerLink(p.id);

                      return (
                        <div key={p.id} className="p-4 flex flex-col gap-3 hover:bg-[#1a1a1a] transition-colors">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="font-semibold text-white text-base">{p.id}</p>
                              <p className="text-[#555] text-[10px] font-mono mt-0.5">Reg: {fmtDate(p.registeredAt)}</p>
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
                              <p className="text-[#19D1E6] mt-0.5 font-bold">{formatMs(p.totalTimeTaken)}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-1">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleCopyLink(gameUrl, p.id)}
                                className="px-3 py-1.5 bg-gray-900 border border-[#2a2a2a] hover:border-[#19D1E6]/40 text-[#888] hover:text-white rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors"
                              >
                                <span className="material-symbols-outlined text-xs">link</span>
                                {copiedPlayer === p.id ? "Copied!" : "Copy Link"}
                              </button>
                            </div>

                            {hasGameAccess && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleResetPlayer(p.id)}
                                  className="p-2 bg-gray-900 border border-[#2a2a2a] text-[#888] hover:text-amber-400 rounded-lg hover:bg-amber-500/10 transition-colors"
                                  title="Reset"
                                >
                                  <span className="material-symbols-outlined text-base leading-none">restart_alt</span>
                                </button>
                                <button
                                  onClick={() => handleDeletePlayer(p.id)}
                                  className="p-2 bg-gray-900 border border-[#2a2a2a] text-[#888] hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                                  title="Delete"
                                >
                                  <span className="material-symbols-outlined text-base leading-none">delete</span>
                                </button>
                              </div>
                            )}
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
