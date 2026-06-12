import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
const CustomCursor = lazy(() => import("../../components/CustomCursor"));
import {
  collection,
  onSnapshot,
  doc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { getArenaStateRef, setArenaState as setArenaStateApi } from "../../lib/gameApi";
import { ensureFirebaseAuth } from "../../lib/firebaseAuth";
import { ADMIN_SESSION_KEY } from "./AdminLoginPage";
import { ArenaState } from "../../types/game";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ArenaPlayer {
  id: string;
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

function formatMs(ms?: number): string {
  if (!ms || typeof ms !== "number") return "—";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}.${centiseconds < 10 ? "0" : ""}${centiseconds}`;
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminArenaPage() {
  const navigate = useNavigate();

  // Auth guard
  const isAuth = sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
  useEffect(() => {
    if (!isAuth) {
      navigate("/admin/login", { replace: true });
      return;
    }
    ensureFirebaseAuth().catch((err) =>
      console.error("[Arena] Firebase auth failed:", err)
    );
  }, [isAuth, navigate]);

  // ─── State ────────────────────────────────────────────────────────────────

  const [players, setPlayers] = useState<ArenaPlayer[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);

  // Arena states: "idle" | "countdown" | "running" | "finished"
  const [arenaState, setArenaState] = useState<"idle" | "countdown" | "running" | "finished">("idle");
  const [arenaConfig, setArenaConfig] = useState<ArenaState | null>(null);
  
  const [countdownDigit, setCountdownDigit] = useState<number | string>(3);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Firestore subscriptions ──────────────────────────────────────────────

  // Listen to Arena Config
  useEffect(() => {
    const unsub = onSnapshot(getArenaStateRef(), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as ArenaState;
        setArenaConfig(data);
        if (data.arenaStatus === "open") {
          setArenaState("running");
        } else if (data.arenaStatus === "closed") {
          setArenaState("finished");
        } else {
          setArenaState("idle");
        }
      }
    });
    return unsub;
  }, []);

  // Listen to players
  useEffect(() => {
    const playersCol = collection(db, "players");
    const unsubscribe = onSnapshot(
      playersCol,
      (snapshot) => {
        const data: ArenaPlayer[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          data.push({
            id: docSnap.id,
            registeredAt: d.registeredAt || null,
            gameResults: d.gameResults || [],
            totalTimeTaken: typeof d.totalTimeTaken === "number" ? d.totalTimeTaken : 0,
            playerStartTime: d.playerStartTime || null,
          });
        });

        setPlayers(data);
        setPlayersLoading(false);
      },
      (err) => {
        console.error("Error listening to players:", err);
        setPlayersLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  // ─── Timer & Auto-close logic ────────────────────────────────────────────

  useEffect(() => {
    if (arenaState === "running" && arenaConfig?.arenaOpenedAt) {
      const windowMs = arenaConfig.arenaWindowMs || 1800000;
      
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - arenaConfig.arenaOpenedAt!;
        const remaining = Math.max(0, windowMs - elapsed);
        setRemainingTime(remaining);

        if (remaining <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          setArenaStateApi({ arenaStatus: "closed" }).catch(err => console.error("Failed to close arena:", err));
        }
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [arenaState, arenaConfig]);

  // ─── Fullscreen API ───────────────────────────────────────────────────────

  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFSChange);
    return () => document.removeEventListener("fullscreenchange", handleFSChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // ─── Open Arena ───────────────────────────────────────────────────────────

  const handleOpenArena = useCallback(() => {
    if (arenaState !== "idle") return;

    setArenaState("countdown");
    setCountdownDigit(3);

    let count = 3;
    const tick = () => {
      count--;
      if (count > 0) {
        setCountdownDigit(count);
        countdownRef.current = setTimeout(tick, 1000);
      } else if (count === 0) {
        setCountdownDigit("GO!");
        countdownRef.current = setTimeout(async () => {
          try {
            await setArenaStateApi({
              arenaStatus: "open",
              arenaOpenedAt: Date.now(),
              arenaWindowMs: 1800000 // 30 mins
            });
          } catch (err) {
            console.error("Failed to open arena:", err);
          }
        }, 1000);
      }
    };

    countdownRef.current = setTimeout(tick, 1000);
  }, [arenaState]);

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearTimeout(countdownRef.current);
    };
  }, []);

  // ─── Reset all players ───────────────────────────────────────────────────

  const handleResetAll = useCallback(async () => {
    if (
      !window.confirm(
        "Are you sure you want to reset ALL players' progress? This will erase all play times and reset the arena!"
      )
    )
      return;

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

      await setArenaStateApi({
        arenaStatus: "idle",
        arenaOpenedAt: null,
      });

      setArenaState("idle");
      setCountdownDigit(3);
    } catch (err: any) {
      alert("Failed to reset: " + err.message);
    }
  }, [players]);

  // ─── Sorted leaderboard (top 10) ─────────────────────────────────────────

  const leaderboard = useMemo(() => {
    const sorted = [...players].sort((a, b) => {
      const aStages = a.gameResults?.length || 0;
      const bStages = b.gameResults?.length || 0;

      // More stages completed = higher rank
      if (bStages !== aStages) return bStages - aStages;

      // Same stages: lower total time = higher rank
      const aTime = a.totalTimeTaken || Infinity;
      const bTime = b.totalTimeTaken || Infinity;
      return aTime - bTime;
    });
    return sorted.slice(0, 10);
  }, [players]);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (!isAuth) return null;

  const totalPlayers = players.length;
  const completedPlayers = players.filter(
    (p) => (p.gameResults?.length || 0) >= 2
  ).length;
  const inProgressPlayers = players.filter(
    (p) =>
      (p.gameResults?.length || 0) > 0 && (p.gameResults?.length || 0) < 2
  ).length;

  return (
    <div
      id="arena-presentation"
      className="fixed inset-0 bg-black text-white overflow-hidden flex flex-col"
      style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
    >
      <Suspense fallback={null}>
        <CustomCursor />
      </Suspense>

      {/* ── Background effects ─────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[120px] transition-colors duration-1000 ${arenaState === "finished" ? "bg-amber-500/10" : "bg-[#19D1E6]/5"}`} />
        <div className={`absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] transition-colors duration-1000 ${arenaState === "finished" ? "bg-amber-600/5" : "bg-[#19D1E6]/3"}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] transition-colors duration-1000 ${arenaState === "finished" ? "bg-amber-400/5" : "bg-purple-600/3"}`} />
      </div>

      {/* ── Confetti effect for finished state ───────────────────── */}
      {arenaState === "finished" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {Array.from({ length: 50 }).map((_, i) => (
            <div 
              key={i} 
              className="absolute w-2 h-2 md:w-3 md:h-3 rounded-sm animate-confettiDrop opacity-0"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                backgroundColor: ['#19D1E6', '#FFD700', '#FF6B6B', '#4CAF50', '#9C27B0'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>
      )}

      {/* ── Top bar (floating controls) ────────────────────────── */}
      <div className="relative z-20 flex items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate("/admin/dashboard")}
          className="flex items-center gap-2 px-3 py-2 text-xs text-[#888] hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Dashboard
        </button>

        <div className="flex items-center gap-3">
          {/* Mini stats */}
          <div className="hidden sm:flex items-center gap-4 text-xs text-[#888] mr-2">
            <span>
              <span className="text-white font-semibold">{totalPlayers}</span> Players
            </span>
            <span>
              <span className="text-emerald-400 font-semibold">{completedPlayers}</span> Done
            </span>
            <span>
              <span className="text-[#19D1E6] font-semibold">{inProgressPlayers}</span> Playing
            </span>
          </div>

          {(arenaState === "running" || arenaState === "finished") && (
            <button
              onClick={handleResetAll}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-all duration-200"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              Reset All
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-[#888] hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200"
          >
            <span className="material-symbols-outlined text-sm">
              {isFullscreen ? "fullscreen_exit" : "fullscreen"}
            </span>
            {isFullscreen ? "Exit" : "Fullscreen"}
          </button>
        </div>
      </div>

      {/* ── Hero Timer Section ─────────────────────────────────── */}
      <div className={`relative z-10 flex flex-col items-center justify-center py-4 ${arenaState === "idle" || arenaState === "countdown" ? "flex-1" : "shrink-0"}`}>
        {/* IDLE state */}
        {arenaState === "idle" && (
          <div className="flex flex-col items-center gap-6 animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#19D1E6] text-4xl animate-pulse">
                sports_esports
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-[#19D1E6] to-white bg-clip-text text-transparent">
                NEXA TECH ARENA
              </h1>
            </div>

            <p className="text-[#666] text-sm tracking-widest uppercase font-mono">
              {totalPlayers > 0
                ? `${totalPlayers} player${totalPlayers !== 1 ? "s" : ""} registered · Awaiting launch`
                : "No players registered yet"}
            </p>

            <button
              onClick={handleOpenArena}
              className="group relative mt-2 px-10 py-5 bg-gradient-to-r from-[#19D1E6] to-[#0ea5c7] text-black font-black text-lg rounded-2xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(25,209,230,0.4)] hover:scale-105 active:scale-95"
            >
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl">
                  rocket_launch
                </span>
                OPEN ARENA
              </span>
              <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            {players.length > 0 && (
              <button
                onClick={handleResetAll}
                className="text-xs text-[#555] hover:text-red-400 transition-colors mt-1"
              >
                Reset All Players
              </button>
            )}
          </div>
        )}

        {/* COUNTDOWN state */}
        {arenaState === "countdown" && (
          <div className="flex flex-col items-center gap-4 animate-fadeIn">
            <p className="text-xs uppercase tracking-[0.3em] text-[#19D1E6]/70 font-semibold font-mono">
              Opening arena in
            </p>
            <div
              key={String(countdownDigit)}
              className="text-[10rem] sm:text-[14rem] font-black text-[#19D1E6] leading-none animate-countdownPop"
              style={{
                textShadow:
                  "0 0 60px rgba(25, 209, 230, 0.6), 0 0 120px rgba(25, 209, 230, 0.3)",
              }}
            >
              {countdownDigit}
            </div>
          </div>
        )}

        {/* RUNNING state — remaining timer */}
        {arenaState === "running" && (
          <div className="flex flex-col items-center gap-2 animate-fadeIn">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-400/70 font-semibold font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Arena Closes In
            </p>
            <div
              className={`text-6xl sm:text-8xl font-black font-mono tracking-wider transition-colors duration-500 ${remainingTime < 60000 ? "text-red-500" : "text-white"}`}
              style={{
                textShadow: remainingTime < 60000 
                  ? "0 0 30px rgba(239, 68, 68, 0.3), 0 0 60px rgba(239, 68, 68, 0.1)"
                  : "0 0 30px rgba(25, 209, 230, 0.3), 0 0 60px rgba(25, 209, 230, 0.1)",
              }}
            >
              {formatRemaining(remainingTime)}
            </div>
          </div>
        )}

        {/* FINISHED state */}
        {arenaState === "finished" && (
          <div className="flex flex-col items-center gap-2 animate-celebrate mb-2">
            <div className="inline-flex p-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full mb-2">
              <span className="material-symbols-outlined text-4xl">emoji_events</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFD700] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(255,215,0,0.5)]">
              ARENA COMPLETE
            </h1>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-200/70 font-semibold font-mono mt-2">
              Final Results
            </p>
          </div>
        )}
      </div>

      {/* ── Leaderboard Section ────────────────────────────────── */}
      {(arenaState === "running" || arenaState === "finished") && (
      <div className="relative z-10 flex-1 flex flex-col min-h-0 px-6 pb-6 animate-fadeIn">
        {/* Leaderboard header */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined text-lg ${arenaState === "finished" ? "text-amber-400" : "text-[#19D1E6]"}`}>
              leaderboard
            </span>
            <h2 className="text-base font-bold text-white tracking-wide uppercase">
              {arenaState === "finished" ? "Final Leaderboard" : "Live Leaderboard"}
            </h2>
            <span className="text-xs text-[#555] font-mono ml-2">
              Top 10
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#555]">
            {arenaState === "running" && <span className="w-1.5 h-1.5 rounded-full bg-[#19D1E6] animate-pulse" />}
            {arenaState === "finished" ? "Final" : "Real-time"}
          </div>
        </div>

        {/* Table container */}
        <div className={`flex-1 min-h-0 bg-white/[0.02] border rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-500 ${arenaState === "finished" ? "border-amber-500/20 shadow-[0_0_30px_rgba(255,165,0,0.1)]" : "border-white/[0.06]"}`}>
          {playersLoading ? (
            <div className="flex items-center justify-center h-full gap-3">
              <svg
                className="animate-spin h-5 w-5 text-[#19D1E6]"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
                />
              </svg>
              <span className="text-[#888] text-sm">Loading players…</span>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <span className="material-symbols-outlined text-4xl text-[#222]">
                groups
              </span>
              <p className="text-[#555] text-sm">No players registered yet</p>
            </div>
          ) : (
            <table className="w-full h-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-[#555] text-xs font-semibold uppercase tracking-wider px-6 py-3 w-16">
                    #
                  </th>
                  <th className="text-left text-[#555] text-xs font-semibold uppercase tracking-wider px-4 py-3">
                    Player
                  </th>
                  <th className="text-center text-[#555] text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                    Stage
                  </th>
                  <th className="text-center text-[#555] text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                    🧩 Sudoku
                  </th>
                  <th className="text-center text-[#555] text-xs font-semibold uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                    🔢 15-Puzzle
                  </th>
                  <th className="text-right text-[#555] text-xs font-semibold uppercase tracking-wider px-6 py-3">
                    Total Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((p, idx) => {
                  const rank = idx + 1;
                  const stageCount = p.gameResults?.length || 0;
                  const sudokuRes = p.gameResults?.find(
                    (r) => r.gameId === "sudoku"
                  );
                  const puzzleRes = p.gameResults?.find(
                    (r) => r.gameId === "15puzzle"
                  );
                  const isCompleted = stageCount >= 2;
                  const isPlaying = stageCount === 1;

                  // Rank badges
                  const rankDisplay =
                    rank === 1
                      ? "🥇"
                      : rank === 2
                        ? "🥈"
                        : rank === 3
                          ? "🥉"
                          : String(rank);

                  // Row highlight logic for finished state
                  let rowClasses = `border-b border-white/[0.03] transition-all duration-500 `;
                  if (arenaState === "finished") {
                    if (rank === 1) rowClasses += "bg-amber-500/[0.08] animate-goldGlow ";
                    else if (rank === 2) rowClasses += "bg-gray-300/[0.05] ";
                    else if (rank === 3) rowClasses += "bg-orange-800/[0.05] ";
                    else rowClasses += "hover:bg-white/[0.03] ";
                  } else {
                    if (isCompleted) rowClasses += "bg-emerald-500/[0.04] ";
                    else if (isPlaying) rowClasses += "bg-[#19D1E6]/[0.02] ";
                    rowClasses += "hover:bg-white/[0.03] ";
                  }

                  return (
                    <tr
                      key={p.id}
                      className={rowClasses}
                      style={{
                        height: `${Math.max(100 / Math.max(leaderboard.length, 1), 8)}%`,
                      }}
                    >
                      {/* Rank */}
                      <td className="px-6 py-3">
                        <span
                          className={`text-2xl font-black ${
                            rank <= 3
                              ? ""
                              : "text-[#555] text-lg"
                          }`}
                        >
                          {rankDisplay}
                        </span>
                      </td>

                      {/* Player Name */}
                      <td className="px-4 py-3">
                        <span
                          className={`text-lg font-bold truncate block max-w-[200px] lg:max-w-[300px] ${
                            arenaState === "finished" && rank === 1 ? "text-amber-400" :
                            isCompleted ? "text-emerald-300" : "text-white"
                          }`}
                        >
                          {p.id}
                        </span>
                      </td>

                      {/* Stage */}
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded-full">
                            ✓ Completed
                          </span>
                        ) : isPlaying ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#19D1E6]/10 text-[#19D1E6] border border-[#19D1E6]/25 rounded-full">
                            Stage 2
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white/5 text-[#666] rounded-full">
                            Stage 1
                          </span>
                        )}
                      </td>

                      {/* Sudoku Time */}
                      <td className="px-4 py-3 text-center font-mono text-sm hidden md:table-cell">
                        {sudokuRes ? (
                          <span className="text-emerald-400 font-semibold">
                            {sudokuRes.formattedTime}
                          </span>
                        ) : (
                          <span className="text-[#333]">—</span>
                        )}
                      </td>

                      {/* 15-Puzzle Time */}
                      <td className="px-4 py-3 text-center font-mono text-sm hidden md:table-cell">
                        {puzzleRes ? (
                          <span className="text-emerald-400 font-semibold">
                            {puzzleRes.formattedTime}
                          </span>
                        ) : (
                          <span className="text-[#333]">—</span>
                        )}
                      </td>

                      {/* Total Time */}
                      <td className="px-6 py-3 text-right">
                        <span
                          className={`font-mono text-lg font-bold ${
                            arenaState === "finished" && rank === 1 ? "text-amber-400" :
                            isCompleted ? "text-[#19D1E6]" : "text-white/80"
                          }`}
                          style={
                            isCompleted || (arenaState === "finished" && rank <= 3)
                              ? {
                                  textShadow: arenaState === "finished" && rank === 1 
                                    ? "0 0 15px rgba(255, 215, 0, 0.4)" 
                                    : "0 0 10px rgba(25, 209, 230, 0.3)",
                                }
                              : {}
                          }
                        >
                          {formatMs(p.totalTimeTaken)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      )}

      {/* ── Inline keyframe styles ─────────────────────────────── */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }

        @keyframes countdownPop {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-countdownPop {
          animation: countdownPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes celebrate {
          0% { transform: scale(0.9); opacity: 0; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-celebrate {
          animation: celebrate 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes confettiDrop {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          10% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confettiDrop {
          animation-name: confettiDrop;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        @keyframes goldGlow {
          0%, 100% { box-shadow: inset 0 0 20px rgba(255, 215, 0, 0.05); }
          50% { box-shadow: inset 0 0 40px rgba(255, 215, 0, 0.15); }
        }
        .animate-goldGlow {
          animation: goldGlow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
