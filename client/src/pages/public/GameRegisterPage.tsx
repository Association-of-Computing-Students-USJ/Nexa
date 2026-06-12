import React, { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, Link } from "react-router-dom";
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { getArenaStateRef } from "../../lib/gameApi";
import { ArenaState } from "../../types/game";

const CustomCursor = lazy(() => import("../../components/CustomCursor"));

export default function GameRegisterPage() {
  const navigate = useNavigate();

  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<{
    playerName: string;
    gameUrl: string;
  } | null>(null);

  const [copiedType, setCopiedType] = useState<"link" | null>(null);

  const [arenaState, setArenaStateLocal] = useState<ArenaState | null>(null);

  useEffect(() => {
    const stateRef = getArenaStateRef();
    const unsub = onSnapshot(stateRef, (snap) => {
      if (snap.exists()) {
        setArenaStateLocal(snap.data() as ArenaState);
      } else {
        // Default: arena is idle
        setArenaStateLocal({ arenaStatus: "idle", arenaOpenedAt: null, arenaWindowMs: 1800000 });
      }
    });
    return unsub;
  }, []);

  // Normalise player name: trim, remove double spaces, keep alphanumeric/spaces/hyphens
  const cleanPlayerName = (name: string): string => {
    return name
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[^a-zA-Z0-9 -]/g, "");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const normalisedName = cleanPlayerName(playerName);

    if (normalisedName.length < 3) {
      setError("Player name must be at least 3 characters long.");
      setLoading(false);
      return;
    }

    try {
      const docRef = doc(db, "players", normalisedName);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setError(`The name "${normalisedName}" is already registered. Please choose another name.`);
        setLoading(false);
        return;
      }

      // Create the player document in Firestore
      await setDoc(docRef, {
        registeredAt: serverTimestamp(),
        gameResults: [],
        totalTimeTaken: 0,
      });

      // Generate local URLs
      const origin = window.location.origin;
      const gameUrl = `${origin}/game?player=${encodeURIComponent(normalisedName)}`;

      setSuccessData({
        playerName: normalisedName,
        gameUrl,
      });
    } catch (err: any) {
      console.error("Registration error:", err);
      setError("An error occurred during registration. Please verify your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType("link");
    setTimeout(() => setCopiedType(null), 2000);
  };

  const isArenaClosed = arenaState?.arenaStatus === "closed" || (arenaState?.arenaStatus === "open" && arenaState.arenaOpenedAt && Date.now() > arenaState.arenaOpenedAt + arenaState.arenaWindowMs);

  return (
    <div className="min-h-screen bg-[#0c0e12] text-gray-200 p-4 flex flex-col items-center justify-center relative overflow-hidden">
      <Suspense fallback={null}>
        <CustomCursor />
      </Suspense>
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#19D1E6]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#19D1E6]/3 rounded-full blur-3xl pointer-events-none" />
      <div className="noise-overlay" />

      <div className="max-w-md w-full z-10">
        {/* Title */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-2xl font-bold tracking-tight text-[#19D1E6] hover:opacity-95 transition">NEXA</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Arena Registration
          </h1>
          <p className="text-xs text-gray-400 mt-2">
            Register to unlock the Sudoku & 15-Puzzle Arena.
          </p>
        </div>

        {/* Form panel */}
        <div className="bg-[#13171f] border border-gray-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
          {isArenaClosed ? (
            <div className="text-center py-6">
              <div className="inline-flex p-3 bg-red-950/30 border border-red-500/30 text-red-500 rounded-full mb-4">
                <span className="material-symbols-outlined text-4xl">block</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Registration Closed</h2>
              <p className="text-gray-400 text-sm mb-6">
                The arena has ended. Registration is closed.
              </p>
              <button
                onClick={() => navigate("/")}
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl text-sm transition duration-200"
              >
                Return to Homepage
              </button>
            </div>
          ) : !successData ? (
            <form onSubmit={handleRegister} className="space-y-6">
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-950/40 border border-red-500/35 text-red-400 rounded-xl text-xs leading-relaxed">
                  <span className="material-symbols-outlined text-red-400 text-sm shrink-0">error</span>
                  <p>{error}</p>
                </div>
              )}

              <div className="mb-6 relative">
                <label htmlFor="player-name-input" className="block text-xs uppercase tracking-wider text-gray-400 font-mono font-semibold mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-base pointer-events-none">
                    person
                  </span>
                  <input
                    type="text"
                    id="player-name-input"
                    autoComplete="off"
                    placeholder="E.g. Vidura Deshan"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    disabled={loading}
                    className="w-full bg-[#161616] border border-[#2a2a2a] text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#19D1E6]/30 focus:border-[#19D1E6]/60 transition-colors"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">
                  Name can include letters, numbers, hyphens, and spaces.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !playerName.trim()}
                className="w-full relative group overflow-hidden bg-[#19D1E6] text-[#0e0e0e] font-bold rounded-xl px-4 py-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(25,209,230,0.3)] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-[#0e0e0e]" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                    </svg>
                    Validating Name...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">how_to_reg</span>
                    Register
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center py-2">
                <div className="inline-flex p-3 bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 rounded-full mb-3">
                  <span className="material-symbols-outlined text-3xl">task_alt</span>
                </div>
                <h3 className="text-lg font-bold text-white">Registered Successfully!</h3>
                <p className="text-gray-300">
                  Player: <span className="text-[#19D1E6] font-semibold">{successData.playerName}</span>
                </p>
              </div>

              {/* Game Link Box */}
              <div className="p-4 bg-gray-900/60 border border-[#19D1E6]/20 rounded-2xl relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-[#19D1E6] font-mono font-bold">
                    🔑 Your Game Link
                  </span>
                  <button
                    onClick={() => copyToClipboard(successData.gameUrl)}
                    className="text-gray-400 hover:text-white transition flex items-center gap-1 text-[11px]"
                  >
                    <span className="material-symbols-outlined text-xs">
                      {copiedType === "link" ? "check" : "content_copy"}
                    </span>
                    {copiedType === "link" ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-2">
                  Use this link to play the game. Keep it safe!
                </p>
                <div className="bg-[#0c0e12] px-3 py-2 rounded-lg text-xs font-mono text-gray-300 select-all truncate">
                  {successData.gameUrl}
                </div>
              </div>

              {/* Launch Arena Button */}
              <button
                onClick={() => navigate(`/game?player=${encodeURIComponent(successData.playerName)}`)}
                className="w-full relative group overflow-hidden bg-[#19D1E6] text-[#0e0e0e] font-bold rounded-xl px-4 py-4 mt-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(25,209,230,0.3)] flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">rocket_launch</span>
                Launch Game Arena
              </button>
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link to="/" className="text-xs text-gray-500 hover:text-[#19D1E6] transition hover:underline">
            ← Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
