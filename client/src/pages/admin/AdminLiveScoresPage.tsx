import { useEffect, useMemo, useState } from "react";
import { getSocket } from "../../socket/client";

type Match = {
  id: string;
  title: string;
  eventId: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  status: "UPCOMING" | "LIVE" | "FINISHED";
};

// Admin template: demonstrates emitting realtime score updates.
export default function AdminLiveScoresPage() {
  const socket = useMemo(() => getSocket(), []);
  const [matchId, setMatchId] = useState("");
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [last, setLast] = useState<Match | null>(null);

  useEffect(() => {
    function onUpdated(payload: { match: Match }) {
      setLast(payload.match);
    }
    socket.on("match:scoreUpdated", onUpdated);
    return () => {
      socket.off("match:scoreUpdated", onUpdated);
    };
  }, [socket]);

  function send() {
    socket.emit("match:updateScore", { matchId, scoreA, scoreB, status: "LIVE" });
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Live Game Scores</h1>
        <p className="mt-2 text-zinc-300">Emit realtime updates to viewers (template).</p>
      </div>

      <div className="grid gap-4 rounded-xl border border-white/10 bg-white/5 p-6 sm:grid-cols-2">
        <div>
          <label className="text-sm text-zinc-200">Match ID</label>
          <input
            value={matchId}
            onChange={(e) => setMatchId(e.target.value)}
            className="mt-1 w-full rounded-md bg-zinc-950/60 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-white/20"
            placeholder="cuid..."
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-zinc-200">Score A</label>
            <input
              type="number"
              value={scoreA}
              onChange={(e) => setScoreA(Number(e.target.value))}
              className="mt-1 w-full rounded-md bg-zinc-950/60 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-white/20"
            />
          </div>
          <div>
            <label className="text-sm text-zinc-200">Score B</label>
            <input
              type="number"
              value={scoreB}
              onChange={(e) => setScoreB(Number(e.target.value))}
              className="mt-1 w-full rounded-md bg-zinc-950/60 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-white/20"
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={send}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-100"
          >
            Update score
          </button>
        </div>
      </div>

      {last ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm text-zinc-300">Last broadcast</div>
          <div className="mt-2 font-medium">
            {last.teamA} {last.scoreA} - {last.scoreB} {last.teamB}
          </div>
          <div className="mt-1 text-xs text-zinc-400">{last.status}</div>
        </div>
      ) : null}
    </section>
  );
}

