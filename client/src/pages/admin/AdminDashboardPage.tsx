import { useState, useEffect, useMemo } from "react";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Participant {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  university: string;
  year: string;
  registeredAt: Timestamp | null;
  attended: boolean;
  attendedAt: Timestamp | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(ts: Timestamp | null): string {
  if (!ts) return "—";
  const d = ts.toDate();
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function isToday(ts: Timestamp | null): boolean {
  if (!ts) return false;
  const d = ts.toDate();
  const now = new Date();
  return d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
}

function exportCSV(rows: Participant[]) {
  const header = ["Name", "Email", "Phone", "WhatsApp", "University", "Year", "Registered At", "Attended", "Attended At"];
  const lines = [
    header.join(","),
    ...rows.map(r =>
      [r.name, r.email, r.phone, r.whatsapp, r.university, r.year, fmtDate(r.registeredAt), r.attended ? "Yes" : "No", fmtDate(r.attendedAt)]
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
          <button onClick={onCancel} className="flex-1 py-2.5 border border-[#2a2a2a] text-[#888] rounded-xl hover:border-[#444] hover:text-white transition-colors text-sm font-medium">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors text-sm font-semibold">
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function DetailDrawer({ p, onClose }: { p: Participant; onClose: () => void }) {
  const fields = [
    { icon: "person", label: "Full Name", value: p.name },
    { icon: "mail", label: "Email", value: p.email },
    { icon: "phone", label: "Phone", value: p.phone },
    { icon: "chat", label: "WhatsApp", value: p.whatsapp },
    { icon: "school", label: "University", value: p.university },
    { icon: "calendar_today", label: "Academic Year", value: p.year },
    { icon: "schedule", label: "Registered At", value: fmtDate(p.registeredAt) },
    { icon: "badge", label: "Ticket ID", value: p.id.slice(0, 12).toUpperCase() },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-sm h-full bg-[#161616] border-l border-[#2a2a2a] shadow-2xl overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-[#2a2a2a] flex items-center justify-between">
          <h3 className="font-bold text-white text-base">Participant Details</h3>
          <button onClick={onClose} className="p-1.5 text-[#555] hover:text-white transition-colors">
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

          {/* Fields */}
          <div className="space-y-3">
            {fields.map(f => (
              <div key={f.label} className="flex items-start gap-3 p-3 rounded-xl bg-[#0e0e0e] border border-[#1a1a1a]">
                <span className="material-symbols-outlined text-[#19D1E6] text-base mt-0.5 shrink-0">{f.icon}</span>
                <div className="min-w-0">
                  <p className="text-[#555] text-[10px] uppercase tracking-wider">{f.label}</p>
                  <p className="text-white text-sm font-medium break-all mt-0.5">{f.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("All");
  const [deleteTarget, setDeleteTarget] = useState<Participant | null>(null);
  const [detailTarget, setDetailTarget] = useState<Participant | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Real-time listener
  useEffect(() => {
    const q = query(collection(db, "registrations"), orderBy("registeredAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      setParticipants(
        snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<Participant, "id">),
        }))
      );
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  // Derived stats
  const todayCount = useMemo(() => participants.filter(p => isToday(p.registeredAt)).length, [participants]);
  const universities = useMemo(() => new Set(participants.map(p => p.university)).size, [participants]);
  const attendedCount = useMemo(() => participants.filter(p => p.attended).length, [participants]);
  const years = useMemo(() => ["All", ...Array.from(new Set(participants.map(p => p.year))).sort()], [participants]);

  // Filtered rows
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
        <DetailDrawer p={detailTarget} onClose={() => setDetailTarget(null)} />
      )}

      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon="group" label="Total Registered" value={participants.length} accent />
          <StatCard icon="how_to_reg" label="Attended" value={attendedCount} />
          <StatCard icon="today" label="Registered Today" value={todayCount} />
          <StatCard icon="school" label="Universities" value={universities} />
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
              className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder-[#444] focus:outline-none focus:ring-2 focus:ring-[#19D1E6]/30 focus:border-[#19D1E6]/60 transition-colors"
            />
          </div>
          <div className="relative">
            <select
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              className="bg-[#161616] border border-[#2a2a2a] text-white rounded-xl px-4 py-2.5 text-sm appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-[#19D1E6]/30 focus:border-[#19D1E6]/60 transition-colors"
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
                      {["Name", "Email", "Phone", "University", "Year", "Registered", "Status", ""].map(h => (
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
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">Attended</span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-[#2a2a2a] text-[#555] rounded-full">Pending</span>
                        )}
                        <span className="text-[#555] text-[11px] truncate">{p.university}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setDetailTarget(p)} className="p-1.5 rounded-lg text-[#555] hover:text-[#19D1E6] transition-colors">
                        <span className="material-symbols-outlined text-base">open_in_new</span>
                      </button>
                      <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-lg text-[#555] hover:text-red-400 transition-colors">
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
