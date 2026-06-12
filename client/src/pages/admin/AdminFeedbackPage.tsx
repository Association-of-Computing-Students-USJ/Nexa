import { useMemo, useState } from "react";
import { deleteDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { FeedbackProvider, useFeedback } from "../../context/FeedbackContext";
import type { FeedbackEntry } from "../../types/feedback";

function fmtDate(ts: Timestamp | null): string {
  if (!ts) return "—";
  const d = ts.toDate();
  return (
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

function DeleteModal({
  name,
  onConfirm,
  onCancel,
  deleting,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400">
            <span className="material-symbols-outlined">delete</span>
          </div>
          <h3 className="font-bold text-white text-lg">Remove Feedback</h3>
        </div>
        <p className="text-[#888] text-sm mb-6 leading-relaxed">
          Are you sure you want to remove feedback from{" "}
          <span className="text-white font-semibold">{name}</span>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-3 border border-[#2a2a2a] text-[#888] rounded-xl hover:border-[#444] hover:text-white transition-colors text-sm font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
              </svg>
            ) : (
              "Remove"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminFeedbackContent() {
  const { entries, loading, error: firestoreError } = useFeedback();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<FeedbackEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const universities = useMemo(() => new Set(entries.map((e) => e.university)).size, [entries]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return entries;
    return entries.filter(
      (e) => e.name.toLowerCase().includes(q) || e.university.toLowerCase().includes(q)
    );
  }, [entries, search]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "feedback", deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      <div className="space-y-6">
        {firestoreError && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <span className="material-symbols-outlined text-red-400 text-base mt-0.5 shrink-0">error</span>
            <p className="text-red-400 text-sm font-mono break-all">{firestoreError}</p>
          </div>
        )}

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Feedback</h1>
          <p className="text-[#888] text-sm mt-0.5">All submitted event feedback</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border bg-[#19D1E6]/8 border-[#19D1E6]/25 flex items-center gap-4">
            <div className="p-3 rounded-xl shrink-0 bg-[#19D1E6]/15 text-[#19D1E6]">
              <span className="material-symbols-outlined text-xl">rate_review</span>
            </div>
            <div>
              <p className="text-[#888] text-xs uppercase tracking-wider font-medium">Total Submissions</p>
              <p className="text-2xl font-bold text-white mt-0.5">{entries.length}</p>
            </div>
          </div>
          <div className="p-5 rounded-2xl border bg-[#161616] border-[#2a2a2a] flex items-center gap-4">
            <div className="p-3 rounded-xl shrink-0 bg-[#222] text-[#19D1E6]">
              <span className="material-symbols-outlined text-xl">school</span>
            </div>
            <div>
              <p className="text-[#888] text-xs uppercase tracking-wider font-medium">Universities</p>
              <p className="text-2xl font-bold text-white mt-0.5">{universities}</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#444] text-base pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Search by name or university…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded-xl pl-10 pr-4 py-3 text-sm placeholder-[#444] focus:outline-none focus:ring-2 focus:ring-[#19D1E6]/30 focus:border-[#19D1E6]/60 transition-colors"
          />
        </div>

        <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-5 py-3 border-b border-[#2a2a2a] flex items-center justify-between">
            <span className="text-[#888] text-xs">
              {filtered.length} {filtered.length === 1 ? "result" : "results"}
              {search && ` · filtered from ${entries.length}`}
            </span>
            {search && (
              <button onClick={() => setSearch("")} className="text-[#19D1E6] text-xs hover:underline">
                Clear search
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3">
              <svg className="animate-spin h-5 w-5 text-[#19D1E6]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
              </svg>
              <span className="text-[#888] text-sm">Loading feedback…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <span className="material-symbols-outlined text-4xl text-[#2a2a2a]">forum</span>
              <p className="text-[#555] text-sm">No feedback found</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a2a2a]">
                      {["Name", "University", "Feedback", "Submitted", ""].map((h) => (
                        <th
                          key={h}
                          className="text-left text-[#555] text-xs font-semibold uppercase tracking-wider px-5 py-3"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {filtered.map((entry) => (
                      <tr key={entry.id} className="hover:bg-[#1a1a1a] transition-colors group">
                        <td className="px-5 py-3.5 font-medium text-white whitespace-nowrap">{entry.name}</td>
                        <td className="px-5 py-3.5 text-[#888] max-w-[180px]">{entry.university}</td>
                        <td className="px-5 py-3.5 text-[#aaa] max-w-md">
                          <p className="line-clamp-3 whitespace-pre-wrap">{entry.feedback}</p>
                        </td>
                        <td className="px-5 py-3.5 text-[#555] text-xs whitespace-nowrap">
                          {fmtDate(entry.submittedAt)}
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => setDeleteTarget(entry)}
                            className="p-1.5 rounded-lg text-[#555] hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-[#1a1a1a]">
                {filtered.map((entry) => (
                  <div key={entry.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm">{entry.name}</p>
                        <p className="text-[#888] text-xs mt-0.5">{entry.university}</p>
                      </div>
                      <button
                        onClick={() => setDeleteTarget(entry)}
                        className="p-2 rounded-lg text-[#555] hover:text-red-400 transition-colors shrink-0"
                        title="Remove"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                    <p className="text-[#aaa] text-sm leading-relaxed whitespace-pre-wrap">{entry.feedback}</p>
                    <p className="text-[#555] text-[11px]">{fmtDate(entry.submittedAt)}</p>
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

export default function AdminFeedbackPage() {
  return (
    <FeedbackProvider>
      <AdminFeedbackContent />
    </FeedbackProvider>
  );
}
