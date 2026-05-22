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
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

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
}

type ScanStatus = "success" | "already_attended" | "not_found" | "invalid";

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
  return ts.toDate().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) +
    " · " + ts.toDate().toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

async function processQR(qrText: string): Promise<ScanResult> {
  const id = parseQRId(qrText.trim());
  if (!id) return { status: "invalid", qrText };

  const ref = doc(db, "registrations", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return { status: "not_found", qrText };

  const data = snap.data() as Omit<Participant, "id">;
  const participant = { id: snap.id, ...data };

  if (data.attended) return { status: "already_attended", participant };

  await updateDoc(ref, { attended: true, attendedAt: serverTimestamp() });
  return { status: "success", participant };
}

async function markManually(id: string): Promise<void> {
  await updateDoc(doc(db, "registrations", id), {
    attended: true,
    attendedAt: serverTimestamp(),
  });
}

// ─── Result Card ──────────────────────────────────────────────────────────────

function ResultCard({ result, onDismiss }: { result: ScanResult; onDismiss: () => void }) {
  const cfg = {
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
  }[result.status];

  return (
    <div className={`rounded-2xl border p-5 ${cfg.bg} animate-fade-in`}>
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
            </div>
          )}
          {(result.status === "not_found" || result.status === "invalid") && (
            <p className="text-[#888] text-xs mt-1 font-mono break-all">{result.qrText}</p>
          )}
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="w-full py-2 text-xs font-semibold text-[#888] hover:text-white border border-[#2a2a2a] rounded-xl hover:border-[#444] transition-colors"
      >
        Scan Next
      </button>
    </div>
  );
}

// ─── QR Scanner Tab ───────────────────────────────────────────────────────────

function QRScannerTab() {
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const pausedRef = useRef(false);

  const stopCamera = useCallback(async () => {
    try {
      if (scannerRef.current?.isScanning) await scannerRef.current.stop();
      scannerRef.current = null;
    } catch { /* ignore */ }
    setScanning(false);
    setCameraActive(false);
    pausedRef.current = false;
  }, []);

  // Start scanner once div is rendered
  useEffect(() => {
    if (!cameraActive) return;
    let mounted = true;

    const start = async () => {
      try {
        const scanner = new Html5Qrcode("qr-video-container");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 15, qrbox: { width: 240, height: 240 } },
          async (decodedText) => {
            if (pausedRef.current || !mounted) return;
            pausedRef.current = true;
            setProcessing(true);

            const res = await processQR(decodedText);
            if (!mounted) return;
            setResult(res);
            setProcessing(false);
          },
          undefined
        );
        if (mounted) setScanning(true);
      } catch (err: unknown) {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        setCameraError(msg.includes("permission") ? "Camera permission denied." : "Could not start camera.");
        setCameraActive(false);
      }
    };

    // Small delay to ensure the div is in the DOM
    const t = setTimeout(start, 80);
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [cameraActive]);

  // Cleanup on unmount
  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  const handleDismiss = () => {
    setResult(null);
    pausedRef.current = false;
  };

  return (
    <div className="space-y-4">
      {/* Camera toggle */}
      {!cameraActive ? (
        <div className="flex flex-col items-center gap-4 py-12 bg-[#161616] border border-[#2a2a2a] rounded-2xl">
          <div className="p-5 rounded-2xl bg-[#19D1E6]/10 text-[#19D1E6]">
            <span className="material-symbols-outlined text-5xl">qr_code_scanner</span>
          </div>
          <div className="text-center">
            <p className="text-white font-semibold mb-1">QR Code Scanner</p>
            <p className="text-[#888] text-sm max-w-xs">
              Point the camera at a participant's QR ticket to check them in instantly.
            </p>
          </div>
          {cameraError && (
            <p className="text-red-400 text-sm text-center px-4">{cameraError}</p>
          )}
          <button
            onClick={() => { setCameraError(""); setCameraActive(true); }}
            className="px-6 py-3 bg-[#19D1E6] text-[#0e0e0e] font-bold rounded-xl hover:bg-[#19D1E6]/90 transition-colors flex items-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-base">videocam</span>
            Start Camera
          </button>
        </div>
      ) : (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl overflow-hidden">
          {/* Camera viewfinder */}
          <div className="relative">
            {/* html5-qrcode renders into this div */}
            <div id="qr-video-container" className="w-full" />

            {/* Processing overlay */}
            {processing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm gap-3">
                <svg className="animate-spin h-8 w-8 text-[#19D1E6]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                </svg>
                <p className="text-white text-sm font-medium">Verifying…</p>
              </div>
            )}

            {/* Status badge */}
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

            {/* Stop button */}
            <button
              onClick={stopCamera}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-white hover:text-red-400 transition-colors"
              title="Stop camera"
            >
              <span className="material-symbols-outlined text-base">videocam_off</span>
            </button>
          </div>
        </div>
      )}

      {/* Result card */}
      {result && <ResultCard result={result} onDismiss={handleDismiss} />}
    </div>
  );
}

// ─── Manual Search Tab ────────────────────────────────────────────────────────

function ManualTab() {
  const [query2, setQuery2] = useState("");
  const [results, setResults] = useState<Participant[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query2.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const q = query(collection(db, "registrations"), orderBy("name"));
      const snap = await getDocs(q);
      const term = query2.toLowerCase();
      const found = snap.docs
        .filter(d => {
          const data = d.data();
          return (
            data.name?.toLowerCase().includes(term) ||
            data.email?.toLowerCase().includes(term) ||
            data.phone?.includes(term) ||
            data.university?.toLowerCase().includes(term)
          );
        })
        .map(d => ({ id: d.id, ...d.data() } as Participant));
      setResults(found);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  const handleMark = async (p: Participant) => {
    if (p.attended) return;
    setMarkingId(p.id);
    await markManually(p.id);
    setResults(prev => prev.map(r => r.id === p.id ? { ...r, attended: true, attendedAt: Timestamp.now() } : r));
    setMarkingId(null);
  };

  return (
    <div className="space-y-4">
      <p className="text-[#888] text-sm leading-relaxed">
        Use this if a participant forgot their QR code or didn't receive the email.
        Search by name, email, phone number, or university.
      </p>

      {/* Search input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#444] text-base pointer-events-none">search</span>
          <input
            type="text"
            placeholder="Name, email, phone or university…"
            value={query2}
            onChange={e => setQuery2(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder-[#444] focus:outline-none focus:ring-2 focus:ring-[#19D1E6]/30 focus:border-[#19D1E6]/60 transition-colors"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={!query2.trim() || loading}
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

      {/* Results */}
      {searched && (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#1e1e1e]">
            <span className="text-[#888] text-xs">{results.length} result{results.length !== 1 ? "s" : ""} found</span>
          </div>

          {results.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2">
              <span className="material-symbols-outlined text-3xl text-[#2a2a2a]">person_search</span>
              <p className="text-[#555] text-sm">No matching participants</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1a1a1a]">
              {results.map(p => (
                <div key={p.id} className="flex items-start gap-3 p-4">
                  <div className="w-9 h-9 rounded-full bg-[#19D1E6]/10 border border-[#19D1E6]/20 flex items-center justify-center shrink-0">
                    <span className="text-[#19D1E6] font-bold text-sm">{p.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white text-sm">{p.name}</p>
                      {p.attended ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full uppercase tracking-wider">
                          Attended
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-[#2a2a2a] text-[#555] rounded-full uppercase tracking-wider">
                          Not checked in
                        </span>
                      )}
                    </div>
                    <p className="text-[#888] text-xs mt-0.5">{p.email}</p>
                    <p className="text-[#555] text-xs">{p.university} · {p.year}</p>
                    {p.attended && p.attendedAt && (
                      <p className="text-emerald-400/70 text-[11px] mt-0.5">Checked in {fmtTime(p.attendedAt)}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleMark(p)}
                    disabled={p.attended || markingId === p.id}
                    className={`shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      p.attended
                        ? "bg-emerald-500/10 text-emerald-400 cursor-default border border-emerald-500/20"
                        : "bg-[#19D1E6] text-[#0e0e0e] hover:bg-[#19D1E6]/90"
                    }`}
                  >
                    {markingId === p.id ? (
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                      </svg>
                    ) : (
                      <span className="material-symbols-outlined text-sm">{p.attended ? "check" : "how_to_reg"}</span>
                    )}
                    {p.attended ? "Attended" : "Check In"}
                  </button>
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

type TabId = "scanner" | "manual";

export default function AdminScannerPage() {
  const [tab, setTab] = useState<TabId>("scanner");

  const TABS: { id: TabId; icon: string; label: string }[] = [
    { id: "scanner", icon: "qr_code_scanner", label: "QR Scanner" },
    { id: "manual",  icon: "manage_search",   label: "Manual Search" },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Attendance Scanner</h1>
        <p className="text-[#888] text-sm mt-0.5">Scan QR tickets or manually verify participants</p>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-[#161616] border border-[#2a2a2a] rounded-xl p-1 gap-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === t.id
                ? "bg-[#19D1E6] text-[#0e0e0e]"
                : "text-[#888] hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-base">{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "scanner" ? <QRScannerTab /> : <ManualTab />}
    </div>
  );
}
