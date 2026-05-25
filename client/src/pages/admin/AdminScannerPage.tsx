import { useState, useRef, useEffect, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { ensureFirebaseAuth } from "../../lib/firebaseAuth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Participant {
  id: string;
  name: string;
  email: string;
  phone: string;
  university: string;
  year: string;
  attended: boolean;
  attendedAt: Timestamp | null;
  mealServed: boolean;
  mealServedAt: Timestamp | null;
}

type ScanStatus =
  | "success"
  | "already_attended"
  | "meal_success"
  | "already_meal"
  | "not_found"
  | "invalid";

interface ScanResult {
  status: ScanStatus;
  participant?: Participant;
  qrText?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseQRId(text: string): string | null {
  const m = text.match(/^NEXA-2026-(.+)$/);
  return m ? m[1] : null;
}

function fmtTime(ts: Timestamp | null): string {
  if (!ts) return "—";
  return (
    ts.toDate().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) +
    " · " +
    ts.toDate().toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
  );
}

// Entry check-in (auth must already be established before calling)
async function processQR(qrText: string): Promise<ScanResult> {
  const id = parseQRId(qrText.trim());
  if (!id) return { status: "invalid", qrText };

  const ref = doc(db, "registrations", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return { status: "not_found", qrText };

  const data = snap.data() as Omit<Participant, "id">;
  const participant: Participant = { id: snap.id, ...data };

  if (data.attended) return { status: "already_attended", participant };

  await updateDoc(ref, { attended: true, attendedAt: serverTimestamp() });
  return { status: "success", participant };
}

// Meal check-in (auth must already be established before calling)
async function processMealQR(qrText: string): Promise<ScanResult> {
  const id = parseQRId(qrText.trim());
  if (!id) return { status: "invalid", qrText };

  const ref = doc(db, "registrations", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return { status: "not_found", qrText };

  const data = snap.data() as Omit<Participant, "id">;
  const participant: Participant = { id: snap.id, ...data };

  if (data.mealServed) return { status: "already_meal", participant };

  await updateDoc(ref, { mealServed: true, mealServedAt: serverTimestamp() });
  return { status: "meal_success", participant };
}

async function markEntryManually(id: string): Promise<void> {
  await ensureFirebaseAuth();
  await updateDoc(doc(db, "registrations", id), {
    attended: true,
    attendedAt: serverTimestamp(),
  });
}

async function markMealManually(id: string): Promise<void> {
  await ensureFirebaseAuth();
  await updateDoc(doc(db, "registrations", id), {
    mealServed: true,
    mealServedAt: serverTimestamp(),
  });
}

// ─── Result Card ──────────────────────────────────────────────────────────────

const RESULT_CFG: Record<ScanStatus, { bg: string; icon: string; iconColor: string; title: string; titleColor: string }> = {
  success: {
    bg: "bg-emerald-500/10 border-emerald-500/30",
    icon: "check_circle",
    iconColor: "text-emerald-400",
    title: "Check-In Successful!",
    titleColor: "text-emerald-400",
  },
  already_attended: {
    bg: "bg-amber-500/10 border-amber-500/30",
    icon: "warning",
    iconColor: "text-amber-400",
    title: "Already Checked In",
    titleColor: "text-amber-400",
  },
  meal_success: {
    bg: "bg-emerald-500/10 border-emerald-500/30",
    icon: "restaurant",
    iconColor: "text-emerald-400",
    title: "Meal Served!",
    titleColor: "text-emerald-400",
  },
  already_meal: {
    bg: "bg-amber-500/10 border-amber-500/30",
    icon: "warning",
    iconColor: "text-amber-400",
    title: "Meal Already Served",
    titleColor: "text-amber-400",
  },
  not_found: {
    bg: "bg-red-500/10 border-red-500/30",
    icon: "help",
    iconColor: "text-red-400",
    title: "Registration Not Found",
    titleColor: "text-red-400",
  },
  invalid: {
    bg: "bg-red-500/10 border-red-500/30",
    icon: "qr_code_2_add",
    iconColor: "text-red-400",
    title: "Invalid QR Code",
    titleColor: "text-red-400",
  },
};

function ResultCard({ result, onDismiss }: { result: ScanResult; onDismiss: () => void }) {
  const cfg = RESULT_CFG[result.status];

  return (
    <div className={`rounded-2xl border p-5 ${cfg.bg}`}>
      <div className="flex items-start gap-3 mb-3">
        <span className={`material-symbols-outlined text-2xl shrink-0 ${cfg.iconColor}`}>{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-base ${cfg.titleColor}`}>{cfg.title}</p>
          {result.participant && (
            <div className="mt-2 space-y-1">
              <p className="text-white font-semibold text-sm">{result.participant.name}</p>
              <p className="text-[#888] text-xs">{result.participant.university} · {result.participant.year}</p>
              <p className="text-[#888] text-xs">{result.participant.email}</p>
              {result.status === "already_attended" && result.participant.attendedAt && (
                <p className="text-amber-400/80 text-xs mt-1">
                  Checked in at {fmtTime(result.participant.attendedAt)}
                </p>
              )}
              {result.status === "already_meal" && result.participant.mealServedAt && (
                <p className="text-amber-400/80 text-xs mt-1">
                  Meal served at {fmtTime(result.participant.mealServedAt)}
                </p>
              )}
            </div>
          )}
          {(result.status === "not_found" || result.status === "invalid") && (
            <p className="text-[#888] text-xs mt-1 font-mono break-all">{result.qrText}</p>
          )}
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="w-full py-3 text-sm font-semibold text-[#888] hover:text-white border border-[#2a2a2a] rounded-xl hover:border-[#444] transition-colors"
      >
        Scan Next
      </button>
    </div>
  );
}

// ─── Generic QR Scanner Tab ───────────────────────────────────────────────────

function ScannerTab({ mode }: { mode: "entry" | "meal" }) {
  const [authReady, setAuthReady]   = useState(false);
  const [authError, setAuthError]   = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning]     = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult]         = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [fullFrame, setFullFrame] = useState(true);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const pausedRef  = useRef(false);

  const containerId = mode === "entry" ? "qr-entry-container" : "qr-meal-container";

  // ── Authenticate once on mount before allowing camera start ──────────────
  useEffect(() => {
    let active = true;
    ensureFirebaseAuth()
      .then(() => { if (active) setAuthReady(true); })
      .catch((err) => {
        if (!active) return;
        const code = (err as { code?: string })?.code ?? String(err);
        setAuthError(`Firebase Auth failed (${code}). Check your .env credentials.`);
      });
    return () => { active = false; };
  }, []);

  // Debug log helper + camera enumeration
  const addLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString();
    const line = `[${ts}] ${msg}`;
    setDebugLogs((prev) => [line, ...prev].slice(0, 200));
    console.debug(line);
  };

  useEffect(() => {
    let mounted = true;
    (Html5Qrcode as any).getCameras()
      .then((cams: Array<{ id: string; label?: string }>) => {
        if (!mounted) return;
        const mapped = cams.map((c) => ({ id: c.id, label: c.label || c.id }));
        setCameras(mapped);
        if (mapped.length) setSelectedCamera((prev) => prev ?? mapped[0].id);
        addLog(`Found ${mapped.length} camera(s)`);
      })
      .catch((err: unknown) => {
        addLog(`Could not enumerate cameras: ${String(err)}`);
      });
    return () => { mounted = false; };
  }, []);

  const stopCamera = useCallback(async () => {
    try {
      addLog("Stopping scanner");
      if (scannerRef.current?.isScanning) await scannerRef.current.stop();
      scannerRef.current = null;
    } catch { /* ignore */ }
    setScanning(false);
    setCameraActive(false);
    pausedRef.current = false;
  }, []);

  useEffect(() => {
    if (!cameraActive) return;
    let mounted = true;

    const start = async () => {
      try {
        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;

        const boxSize = Math.min(260, Math.round(window.innerWidth * 0.65));

        const config: any = { fps: 10, verbose: true, disableFlip: false };
        if (!fullFrame) config.qrbox = { width: boxSize, height: boxSize };

        addLog(`Starting scanner (camera=${selectedCamera ?? 'auto'} fullFrame=${fullFrame})`);

        await scanner.start(
          selectedCamera ?? { facingMode: "environment" },
          config,
          async (decodedText: string) => {
            addLog(`Decoded text: ${decodedText}`);
            if (pausedRef.current || !mounted) return;
            pausedRef.current = true;
            setProcessing(true);

            try {
              const res = mode === "entry"
                ? await processQR(decodedText)
                : await processMealQR(decodedText);
              if (!mounted) return;
              setResult(res);
            } catch (err) {
              addLog(`QR processing error: ${String(err)}`);
              if (!mounted) return;
              setResult({ status: "not_found", qrText: decodedText });
            } finally {
              if (mounted) setProcessing(false);
            }
          },
          (errorMessage: string) => {
            addLog(`Decode error: ${errorMessage}`);
          }
        );
        if (mounted) setScanning(true);
      } catch (err: unknown) {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        addLog(`Camera start failed: ${msg}`);
        setCameraError(msg.includes("permission") ? "Camera permission denied." : "Could not start camera.");
        setCameraActive(false);
      }
    };

    const t = setTimeout(start, 80);
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [cameraActive, containerId, mode]);

  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  const handleDismiss = () => {
    setResult(null);
    pausedRef.current = false;
  };

  const label = mode === "entry" ? "entry check-in" : "meal service";

  return (
    <div className="space-y-4">
      {!cameraActive ? (
        <div className="flex flex-col items-center gap-4 py-12 bg-[#161616] border border-[#2a2a2a] rounded-2xl">
          <div className={`p-5 rounded-2xl ${mode === "entry" ? "bg-[#19D1E6]/10 text-[#19D1E6]" : "bg-orange-500/10 text-orange-400"}`}>
            <span className="material-symbols-outlined text-5xl">
              {mode === "entry" ? "qr_code_scanner" : "restaurant"}
            </span>
          </div>
          <div className="text-center">
            <p className="text-white font-semibold mb-1">
              {mode === "entry" ? "Entry QR Scanner" : "Meal QR Scanner"}
            </p>
            <p className="text-[#888] text-sm max-w-xs">
              Point the camera at a participant's QR ticket to record {label}.
            </p>
          </div>

          {/* Auth status */}
          {!authReady && !authError && (
            <div className="flex items-center gap-2 text-[#888] text-sm">
              <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
              </svg>
              Connecting to Firebase…
            </div>
          )}
          {authError && (
            <p className="text-red-400 text-xs text-center px-4">{authError}</p>
          )}

          {cameraError && (
            <p className="text-red-400 text-sm text-center px-4">{cameraError}</p>
          )}
          <button
            onClick={() => { setCameraError(""); setCameraActive(true); }}
            disabled={!authReady}
            className={`px-6 py-3 font-bold rounded-xl transition-colors flex items-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed ${
              mode === "entry"
                ? "bg-[#19D1E6] text-[#0e0e0e] hover:bg-[#19D1E6]/90"
                : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
          >
            <span className="material-symbols-outlined text-base">videocam</span>
            Start Camera
          </button>
          <div className="mt-3 w-full">
            <div className="flex items-center gap-3 justify-center">
              <label className="text-xs text-[#888] flex items-center gap-2">
                <input type="checkbox" className="form-checkbox" checked={showDebug} onChange={(e) => setShowDebug(e.target.checked)} />
                <span>Show Debug</span>
              </label>

              <label className="text-xs text-[#888] flex items-center gap-2">
                <input type="checkbox" className="form-checkbox" checked={fullFrame} onChange={(e) => setFullFrame(e.target.checked)} />
                <span>Full-frame</span>
              </label>

              {cameras.length > 0 && (
                <select value={selectedCamera ?? ""} onChange={(e) => setSelectedCamera(e.target.value || null)} className="bg-[#0f0f0f] text-xs text-[#ccc] px-2 py-1 rounded">
                  <option value="">Auto</option>
                  {cameras.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl overflow-hidden">
          <div className="relative">
            <div id={containerId} className="w-full h-60" />

            {processing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm gap-3">
                <svg className="animate-spin h-8 w-8 text-[#19D1E6]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                </svg>
                <p className="text-white text-sm font-medium">Verifying…</p>
              </div>
            )}

            <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
              {scanning ? (
                <>
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-white text-xs font-medium">Scanning…</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-amber-400 rounded-full" />
                  <span className="text-white text-xs font-medium">Starting…</span>
                </>
              )}
            </div>

            <button
              onClick={stopCamera}
              className="absolute top-3 right-3 p-3 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-white hover:text-red-400 transition-colors"
              title="Stop camera"
            >
              <span className="material-symbols-outlined text-base">videocam_off</span>
            </button>
          </div>
        </div>
      )}

      {result && <ResultCard result={result} onDismiss={handleDismiss} />}

      {showDebug && (
        <div className="bg-[#0b0b0b] border border-[#222] rounded-xl p-3 text-xs text-[#ddd] max-h-40 overflow-auto font-mono">
          {debugLogs.length === 0 ? (
            <div className="text-[#777]">No debug logs yet.</div>
          ) : (
            debugLogs.map((l, i) => <div key={i} className="py-0.5">{l}</div>)
          )}
        </div>
      )}
    </div>
  );
}

// ─── Manual Search Tab ────────────────────────────────────────────────────────

function ManualTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Participant[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAction, setMarkingAction] = useState<"entry" | "meal" | null>(null);
  const [writeError, setWriteError] = useState("");

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      await ensureFirebaseAuth();
      const q = query(collection(db, "registrations"), orderBy("name"));
      const snap = await getDocs(q);
      const term = searchTerm.toLowerCase();
      const found = snap.docs
        .filter((d) => {
          const data = d.data();
          return (
            data.name?.toLowerCase().includes(term) ||
            data.email?.toLowerCase().includes(term) ||
            data.phone?.includes(term) ||
            data.university?.toLowerCase().includes(term) ||
            d.id.toLowerCase().startsWith(term)
          );
        })
        .map((d) => ({ id: d.id, ...d.data() } as Participant));
      setResults(found);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  const handleMarkEntry = async (p: Participant) => {
    if (p.attended) return;
    setMarkingId(p.id);
    setMarkingAction("entry");
    setWriteError("");
    try {
      await markEntryManually(p.id);
      setResults((prev) =>
        prev.map((r) =>
          r.id === p.id ? { ...r, attended: true, attendedAt: Timestamp.now() } : r
        )
      );
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      const msg  = (err as { message?: string })?.message ?? "Unknown error";
      setWriteError(`Entry check-in failed (${code || msg}). ${code === "permission-denied" ? "Firebase Auth may not be set up — check VITE_ADMIN_FIREBASE_EMAIL / PASS in .env." : ""}`);
      console.error("Entry check-in failed:", err);
    } finally {
      setMarkingId(null);
      setMarkingAction(null);
    }
  };

  const handleMarkMeal = async (p: Participant) => {
    if (p.mealServed) return;
    setMarkingId(p.id);
    setMarkingAction("meal");
    setWriteError("");
    try {
      await markMealManually(p.id);
      setResults((prev) =>
        prev.map((r) =>
          r.id === p.id ? { ...r, mealServed: true, mealServedAt: Timestamp.now() } : r
        )
      );
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      const msg  = (err as { message?: string })?.message ?? "Unknown error";
      setWriteError(`Meal check-in failed (${code || msg}). ${code === "permission-denied" ? "Firebase Auth may not be set up — check VITE_ADMIN_FIREBASE_EMAIL / PASS in .env." : ""}`);
      console.error("Meal check-in failed:", err);
    } finally {
      setMarkingId(null);
      setMarkingAction(null);
    }
  };

  const isMarkingThis = (id: string) => markingId === id;

  return (
    <div className="space-y-4">
      <p className="text-[#888] text-sm leading-relaxed">
        Search by name, email, phone, university, or ticket ID.
        Mark entry check-in and meal service independently.
      </p>

      {writeError && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/25 rounded-xl">
          <span className="material-symbols-outlined text-red-400 text-base mt-0.5 shrink-0">error</span>
          <p className="text-red-400 text-xs leading-relaxed">{writeError}</p>
          <button onClick={() => setWriteError("")} className="ml-auto text-red-400/60 hover:text-red-400 shrink-0">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#444] text-base pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Name, email, phone, university…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder-[#444] focus:outline-none focus:ring-2 focus:ring-[#19D1E6]/30 focus:border-[#19D1E6]/60 transition-colors"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={!searchTerm.trim() || loading}
          className="px-4 py-2.5 bg-[#19D1E6] text-[#0e0e0e] font-semibold rounded-xl hover:bg-[#19D1E6]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm shrink-0 flex items-center gap-1.5"
        >
          {loading ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
            </svg>
          ) : (
            <span className="material-symbols-outlined text-base">search</span>
          )}
          Search
        </button>
      </div>

      {searched && (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#1e1e1e]">
            <span className="text-[#888] text-xs">
              {results.length} result{results.length !== 1 ? "s" : ""} found
            </span>
          </div>

          {results.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2">
              <span className="material-symbols-outlined text-3xl text-[#2a2a2a]">person_search</span>
              <p className="text-[#555] text-sm">No matching participants</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1a1a1a]">
              {results.map((p) => (
                <div key={p.id} className="p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#19D1E6]/10 border border-[#19D1E6]/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[#19D1E6] font-bold text-sm">{p.name.charAt(0).toUpperCase()}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{p.name}</p>
                    <p className="text-[#888] text-xs mt-0.5 truncate">{p.email}</p>
                    <p className="text-[#555] text-xs">{p.university} · {p.year}</p>

                    {/* Status badges */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {p.attended ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                          Checked In
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-[#2a2a2a] text-[#555] rounded-full uppercase tracking-wider">
                          Not Checked In
                        </span>
                      )}
                      {p.mealServed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                          Meal Served
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-[#2a2a2a] text-[#555] rounded-full uppercase tracking-wider">
                          No Meal
                        </span>
                      )}
                    </div>

                    {p.attended && p.attendedAt && (
                      <p className="text-emerald-400/70 text-[11px] mt-1">
                        Entry: {fmtTime(p.attendedAt)}
                      </p>
                    )}
                    {p.mealServed && p.mealServedAt && (
                      <p className="text-orange-400/70 text-[11px]">
                        Meal: {fmtTime(p.mealServedAt)}
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleMarkEntry(p)}
                      disabled={p.attended || (isMarkingThis(p.id) && markingAction === "entry")}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                        p.attended
                          ? "bg-emerald-500/10 text-emerald-400 cursor-default border border-emerald-500/20"
                          : "bg-[#19D1E6] text-[#0e0e0e] hover:bg-[#19D1E6]/90 disabled:opacity-50"
                      }`}
                    >
                      {isMarkingThis(p.id) && markingAction === "entry" ? (
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                        </svg>
                      ) : (
                        <span className="material-symbols-outlined text-sm">{p.attended ? "check" : "how_to_reg"}</span>
                      )}
                      {p.attended ? "Entry ✓" : "Entry"}
                    </button>

                    <button
                      onClick={() => handleMarkMeal(p)}
                      disabled={p.mealServed || (isMarkingThis(p.id) && markingAction === "meal")}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                        p.mealServed
                          ? "bg-orange-500/10 text-orange-400 cursor-default border border-orange-500/20"
                          : "bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                      }`}
                    >
                      {isMarkingThis(p.id) && markingAction === "meal" ? (
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                        </svg>
                      ) : (
                        <span className="material-symbols-outlined text-sm">{p.mealServed ? "check" : "restaurant"}</span>
                      )}
                      {p.mealServed ? "Meal ✓" : "Meal"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type TabId = "entry" | "meal" | "manual";

export default function AdminScannerPage() {
  const [tab, setTab] = useState<TabId>("entry");

  const TABS: { id: TabId; icon: string; label: string }[] = [
    { id: "entry",  icon: "qr_code_scanner", label: "Entry Scan" },
    { id: "meal",   icon: "restaurant",       label: "Meal Scan"  },
    { id: "manual", icon: "manage_search",    label: "Manual"     },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Attendance Scanner</h1>
        <p className="text-[#888] text-sm mt-0.5">
          Scan QR tickets for entry check-in or meal service, or search manually
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-[#161616] border border-[#2a2a2a] rounded-xl p-1 gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
              tab === t.id
                ? t.id === "meal"
                  ? "bg-orange-500 text-white"
                  : "bg-[#19D1E6] text-[#0e0e0e]"
                : "text-[#888] hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-base">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "entry"  && <ScannerTab mode="entry" />}
      {tab === "meal"   && <ScannerTab mode="meal"  />}
      {tab === "manual" && <ManualTab />}
    </div>
  );
}
