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
import { ensureFirebaseAuth } from "../../lib/firebaseAuth";
import { ADMIN_SESSION_KEY } from "./AdminLoginPage";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ArenaTeam {
  id: string;
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

function formatMs(ms?: number): string {
  if (!ms || typeof ms !== "number") return "—";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}.${centiseconds < 10 ? "0" : ""}${centiseconds}`;
}

function formatElapsed(ms: number): string {
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

  const [teams, setTeams] = useState<ArenaTeam[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);

  // Arena states: "idle" | "countdown" | "running"
  const [arenaState, setArenaState] = useState<"idle" | "countdown" | "running">("idle");
  const [countdownDigit, setCountdownDigit] = useState<number | string>(3);
  const [gameStartTimestamp, setGameStartTimestamp] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Firestore subscription ───────────────────────────────────────────────

  useEffect(() => {
    const teamsCol = collection(db, "teams");
    const unsubscribe = onSnapshot(
      teamsCol,
      (snapshot) => {
        const teamsData: ArenaTeam[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          teamsData.push({
            id: docSnap.id,
            registeredAt: data.registeredAt || null,
            gameResults: data.gameResults || [],
            totalTimeTaken:
              typeof data.totalTimeTaken === "number" ? data.totalTimeTaken : 0,
            gameStartTime: data.gameStartTime || null,
          });
        });

        setTeams(teamsData);
        setTeamsLoading(false);

        // Detect if game is already running (e.g., page refreshed after start)
        const anyStarted = teamsData.some(
          (t) => t.gameStartTime && typeof t.gameStartTime === "number" && t.gameStartTime <= Date.now()
        );
        if (anyStarted && arenaState === "idle") {
          const firstStart = teamsData
            .filter((t) => typeof t.gameStartTime === "number")
            .map((t) => t.gameStartTime as number)
            .sort((a, b) => a - b)[0];
          if (firstStart) {
            setGameStartTimestamp(firstStart);
            setArenaState("running");
          }
        }
      },
      (err) => {
        console.error("Error listening to teams:", err);
        setTeamsLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  // ─── Elapsed timer ────────────────────────────────────────────────────────

  useEffect(() => {
    if (arenaState === "running" && gameStartTimestamp) {
      elapsedRef.current = setInterval(() => {
        setElapsedTime(Date.now() - gameStartTimestamp);
      }, 1000);
    }
    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, [arenaState, gameStartTimestamp]);

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

  // ─── Start game: 3-2-1 countdown then write to Firestore ─────────────────

  const handleStartGame = useCallback(() => {
    if (arenaState !== "idle" || teams.length === 0) return;

    setArenaState("countdown");
    setCountdownDigit(3);

    // 3 → 2 → 1 → GO! → start
    let count = 3;
    const tick = () => {
      count--;
      if (count > 0) {
        setCountdownDigit(count);
        countdownRef.current = setTimeout(tick, 1000);
      } else if (count === 0) {
        setCountdownDigit("GO!");
        countdownRef.current = setTimeout(async () => {
          // Write gameStartTime to all teams
          const startTime = Date.now();
          try {
            const batch = writeBatch(db);
            teams.forEach((t) => {
              const docRef = doc(db, "teams", t.id);
              batch.update(docRef, { gameStartTime: startTime });
            });
            await batch.commit();
          } catch (err: any) {
            console.error("Failed to set global start time:", err);
          }
          setGameStartTimestamp(startTime);
          setArenaState("running");
        }, 1000);
      }
    };

    countdownRef.current = setTimeout(tick, 1000);
  }, [arenaState, teams]);

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearTimeout(countdownRef.current);
    };
  }, []);

  // ─── Reset all teams ──────────────────────────────────────────────────────

  const handleResetAll = useCallback(async () => {
    if (
      !window.confirm(
        "Are you sure you want to reset ALL teams' progress? This will erase all play times and start times!"
      )
    )
      return;

    try {
      const batch = writeBatch(db);
      teams.forEach((t) => {
        const docRef = doc(db, "teams", t.id);
        batch.update(docRef, {
          gameResults: [],
          totalTimeTaken: 0,
          gameStartTime: null,
        });
      });
      await batch.commit();
      setArenaState("idle");
      setGameStartTimestamp(null);
      setElapsedTime(0);
      setCountdownDigit(3);
    } catch (err: any) {
      alert("Failed to reset: " + err.message);
    }
  }, [teams]);

  // ─── Sorted leaderboard (top 10) ─────────────────────────────────────────

  const leaderboard = useMemo(() => {
    const sorted = [...teams].sort((a, b) => {
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
  }, [teams]);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (!isAuth) return null;

  const totalTeams = teams.length;
  const completedTeams = teams.filter(
    (t) => (t.gameResults?.length || 0) >= 2
  ).length;
  const inProgressTeams = teams.filter(
    (t) =>
      (t.gameResults?.length || 0) > 0 && (t.gameResults?.length || 0) < 2
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
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#19D1E6]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#19D1E6]/3 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/3 rounded-full blur-[100px]" />
      </div>

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
              <span className="text-white font-semibold">{totalTeams}</span> Teams
            </span>
            <span>
              <span className="text-emerald-400 font-semibold">{completedTeams}</span> Done
            </span>
            <span>
              <span className="text-[#19D1E6] font-semibold">{inProgressTeams}</span> Playing
            </span>
          </div>

          {arenaState === "running" && (
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
      <div className="relative z-10 flex flex-col items-center justify-center shrink-0 py-4">
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
              {totalTeams > 0
                ? `${totalTeams} team${totalTeams !== 1 ? "s" : ""} registered · Awaiting launch`
                : "No teams registered yet"}
            </p>

            <button
              onClick={handleStartGame}
              disabled={teams.length === 0}
              className="group relative mt-2 px-10 py-5 bg-gradient-to-r from-[#19D1E6] to-[#0ea5c7] text-black font-black text-lg rounded-2xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(25,209,230,0.4)] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl">
                  play_arrow
                </span>
                START GAME
              </span>
              <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            {teams.length > 0 && (
              <button
                onClick={handleResetAll}
                className="text-xs text-[#555] hover:text-red-400 transition-colors mt-1"
              >
                Reset All Teams
              </button>
            )}
          </div>
        )}

        {/* COUNTDOWN state */}
        {arenaState === "countdown" && (
          <div className="flex flex-col items-center gap-4 animate-fadeIn">
            <p className="text-xs uppercase tracking-[0.3em] text-[#19D1E6]/70 font-semibold font-mono">
              Game starting in
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

        {/* RUNNING state — elapsed timer */}
        {arenaState === "running" && (
          <div className="flex flex-col items-center gap-2 animate-fadeIn">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-400/70 font-semibold font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Arena Live
            </p>
            <div
              className="text-6xl sm:text-8xl font-black text-white font-mono tracking-wider"
              style={{
                textShadow:
                  "0 0 30px rgba(25, 209, 230, 0.3), 0 0 60px rgba(25, 209, 230, 0.1)",
              }}
            >
              {formatElapsed(elapsedTime)}
            </div>
          </div>
        )}
      </div>

      {/* ── Leaderboard Section ────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col min-h-0 px-6 pb-6">
        {/* Leaderboard header */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#19D1E6] text-lg">
              leaderboard
            </span>
            <h2 className="text-base font-bold text-white tracking-wide uppercase">
              Live Leaderboard
            </h2>
            <span className="text-xs text-[#555] font-mono ml-2">
              Top 10
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#555]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#19D1E6] animate-pulse" />
            Real-time
          </div>
        </div>

        {/* Table container */}
        <div className="flex-1 min-h-0 bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur-sm">
          {teamsLoading ? (
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
              <span className="text-[#888] text-sm">Loading teams…</span>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <span className="material-symbols-outlined text-4xl text-[#222]">
                groups
              </span>
              <p className="text-[#555] text-sm">No teams registered yet</p>
            </div>
          ) : (
            <table className="w-full h-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-[#555] text-xs font-semibold uppercase tracking-wider px-6 py-3 w-16">
                    #
                  </th>
                  <th className="text-left text-[#555] text-xs font-semibold uppercase tracking-wider px-4 py-3">
                    Team
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
                {leaderboard.map((team, idx) => {
                  const rank = idx + 1;
                  const stageCount = team.gameResults?.length || 0;
                  const sudokuRes = team.gameResults?.find(
                    (r) => r.gameId === "sudoku"
                  );
                  const puzzleRes = team.gameResults?.find(
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

                  return (
                    <tr
                      key={team.id}
                      className={`border-b border-white/[0.03] transition-all duration-500 ${
                        isCompleted
                          ? "bg-emerald-500/[0.04]"
                          : isPlaying
                            ? "bg-[#19D1E6]/[0.02]"
                            : ""
                      } hover:bg-white/[0.03]`}
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

                      {/* Team Name */}
                      <td className="px-4 py-3">
                        <span
                          className={`text-lg font-bold truncate block max-w-[200px] lg:max-w-[300px] ${
                            isCompleted
                              ? "text-emerald-300"
                              : "text-white"
                          }`}
                        >
                          {team.id}
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
                            isCompleted
                              ? "text-[#19D1E6]"
                              : "text-white/80"
                          }`}
                          style={
                            isCompleted
                              ? {
                                  textShadow:
                                    "0 0 10px rgba(25, 209, 230, 0.3)",
                                }
                              : {}
                          }
                        >
                          {formatMs(team.totalTimeTaken)}
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

      {/* ── Inline keyframe styles ─────────────────────────────── */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes countdownPop {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-countdownPop {
          animation: countdownPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
}
