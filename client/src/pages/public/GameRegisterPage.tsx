import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function GameRegisterPage() {
  const navigate = useNavigate();

  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<{
    teamName: string;
    leaderUrl: string;
    memberUrl: string;
  } | null>(null);

  const [copiedType, setCopiedType] = useState<"leader" | "member" | null>(null);

  // Normalise team name: trim, remove double spaces, keep alphanumeric/spaces/hyphens
  const cleanTeamName = (name: string): string => {
    return name
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[^a-zA-Z0-9\s-_]/g, "");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const normalisedName = cleanTeamName(teamName);

    if (normalisedName.length < 3) {
      setError("Team name must be at least 3 characters.");
      setLoading(false);
      return;
    }

    try {
      const docRef = doc(db, "teams", normalisedName);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setError(`A team named "${normalisedName}" is already registered. Please choose another name.`);
        setLoading(false);
        return;
      }

      // Create the team document in Firestore
      await setDoc(docRef, {
        registeredAt: serverTimestamp(),
        gameResults: [],
        totalTimeTaken: 0,
      });

      // Generate local URLs
      const origin = window.location.origin;
      const leaderUrl = `${origin}/game?team=${encodeURIComponent(normalisedName)}&editable=true`;
      const memberUrl = `${origin}/game?team=${encodeURIComponent(normalisedName)}`;

      setSuccessData({
        teamName: normalisedName,
        leaderUrl,
        memberUrl,
      });
    } catch (err: any) {
      console.error("Team registration error:", err);
      setError("An error occurred during registration. Please verify your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: "leader" | "member") => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0c0e12] text-gray-200 p-4 flex flex-col items-center justify-center relative overflow-hidden">
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
            Arena Team Registration
          </h1>
          <p className="text-xs text-gray-400 mt-2">
            Register your team to unlock the Sudoku & 15-Puzzle Arena.
          </p>
        </div>

        {/* Form panel */}
        <div className="bg-[#13171f] border border-gray-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
          {!successData ? (
            <form onSubmit={handleRegister} className="space-y-6">
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-950/40 border border-red-500/35 text-red-400 rounded-xl text-xs leading-relaxed">
                  <span className="material-symbols-outlined text-red-400 text-sm shrink-0">error</span>
                  <p>{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="team-name-input" className="block text-xs uppercase tracking-wider text-gray-400 font-mono font-semibold mb-2">
                  Choose Team Name
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-base pointer-events-none">
                    groups
                  </span>
                  <input
                    id="team-name-input"
                    type="text"
                    required
                    placeholder="Enter team name (e.g. Code Knights)"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    disabled={loading}
                    maxLength={30}
                    className="w-full bg-[#0c0e12] border border-gray-800 text-white rounded-xl pl-10 pr-4 py-3.5 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#19D1E6]/30 focus:border-[#19D1E6]/60 transition-colors disabled:opacity-50"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">
                  Name can include letters, numbers, hyphens, and spaces.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !teamName.trim()}
                className="w-full py-4 bg-[#19D1E6] hover:bg-[#19D1E6]/90 disabled:bg-gray-800 disabled:text-gray-500 text-[#0e0e0e] font-bold rounded-xl text-sm transition-all duration-300 active:scale-98 disabled:opacity-50 shadow-lg hover:shadow-[#19D1E6]/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-[#0e0e0e]" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                    </svg>
                    Validating Team Name...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">how_to_reg</span>
                    Register Team
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
                <h3 className="text-lg font-bold text-white">Team Registered!</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Team: <span className="text-[#19D1E6] font-semibold">{successData.teamName}</span>
                </p>
              </div>

              {/* Leader Link Box */}
              <div className="p-4 bg-gray-900/60 border border-[#19D1E6]/20 rounded-2xl relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-[#19D1E6] font-mono font-bold">
                    🔑 Leader Play Link (Editable)
                  </span>
                  <button
                    onClick={() => copyToClipboard(successData.leaderUrl, "leader")}
                    className="text-gray-400 hover:text-white transition flex items-center gap-1 text-[11px]"
                  >
                    <span className="material-symbols-outlined text-xs">
                      {copiedType === "leader" ? "check" : "content_copy"}
                    </span>
                    {copiedType === "leader" ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-2">
                  Use this link on the primary device. This link has access to submit solved stages to advance the team.
                </p>
                <div className="bg-[#0c0e12] px-3 py-2 rounded-lg text-xs font-mono text-gray-300 select-all truncate">
                  {successData.leaderUrl}
                </div>
              </div>

              {/* Members Link Box */}
              <div className="p-4 bg-gray-900/40 border border-gray-800 rounded-2xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-mono font-bold">
                    👥 Teammates Link (View Only)
                  </span>
                  <button
                    onClick={() => copyToClipboard(successData.memberUrl, "member")}
                    className="text-gray-400 hover:text-white transition flex items-center gap-1 text-[11px]"
                  >
                    <span className="material-symbols-outlined text-xs">
                      {copiedType === "member" ? "check" : "content_copy"}
                    </span>
                    {copiedType === "member" ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-2">
                  Share this with your teammates so they can watch live progress, solve puzzles, and align on their screens.
                </p>
                <div className="bg-[#0c0e12] px-3 py-2 rounded-lg text-xs font-mono text-gray-400 select-all truncate">
                  {successData.memberUrl}
                </div>
              </div>

              {/* Launch Arena Button */}
              <button
                onClick={() => navigate(`/game?team=${encodeURIComponent(successData.teamName)}&editable=true`)}
                className="w-full py-4 bg-[#19D1E6] hover:bg-[#19D1E6]/90 text-[#0e0e0e] font-bold rounded-xl text-sm transition-all duration-300 active:scale-98 shadow-lg hover:shadow-[#19D1E6]/20 flex items-center justify-center gap-2"
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
