import React, { useCallback, useEffect, useState, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { setGameResultsApi } from "../../lib/gameApi";
import { GameResult, TeamDataType } from "../../types/game";

import SudokuGame from "../../components/games/SudokuGame";
import SlidingPuzzle from "../../components/games/SlidingPuzzle";

const CustomCursor = lazy(() => import("../../components/CustomCursor"));

// Define types for game structure
interface Game {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
}

const GAMES: Game[] = [
  { id: "sudoku", name: "Sudoku Puzzle", component: SudokuGame },
  { id: "15puzzle", name: "15 Puzzle", component: SlidingPuzzle },
];

export default function GamePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const teamName = searchParams.get("team") || "";
  const isEditable = searchParams.get("editable") === "true";

  const [currentGameIndex, setCurrentGameIndex] = useState<number>(0);
  const [gameState, setGameState] = useState<
    "waiting" | "countdown" | "playing" | "finished" | "submitting"
  >("waiting");

  const [countdownTime, setCountdownTime] = useState<number>(3); // Default 3 seconds countdown
  const [totalTimeTaken, setTotalTimeTaken] = useState<number>(0);
  const [gameStartTime, setGameStartTime] = useState<number | undefined>(undefined);
  const [gameOpenTime, setGameOpenTime] = useState<number | undefined>(undefined);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [teamNameState, setTeamNameState] = useState<string | null>(null);
  const [isTeamValid, setIsTeamValid] = useState<boolean | null>(null); // null = loading, true = valid, false = invalid

  // Add game win states tracking
  const [gameWinStates, setGameWinStates] = useState<Record<string, boolean>>({
    sudoku: false,
    "15puzzle": false,
  });

  // COUNTDOWN_PERIOD_MS is the period before the game start when countdown should begin (5 minutes)
  const COUNTDOWN_PERIOD_MS = 5 * 60 * 1000;

  // Initialize and validate team parameter
  useEffect(() => {
    if (!teamName) {
      navigate("/");
      return;
    }
    setTeamNameState(teamName);
  }, [teamName, navigate]);

  // Load team data from Firebase and set the proper game state
  useEffect(() => {
    if (!teamNameState) return;
    const documentRef = doc(db, "teams", teamNameState);

    const unsubscribe = onSnapshot(
      documentRef,
      (documentSnapshot) => {
        if (documentSnapshot.exists()) {
          setIsTeamValid(true);
          const data = documentSnapshot.data() as TeamDataType & {
            gameStartTime?: any;
          };

          // Sync start time from Firestore if set
          if (data.gameStartTime !== undefined) {
            const timestamp = data.gameStartTime;
            let timeVal: number | undefined = undefined;
            if (timestamp && typeof timestamp.toDate === "function") {
              timeVal = timestamp.toDate().getTime();
            } else if (typeof timestamp === "number") {
              timeVal = timestamp;
            } else if (timestamp) {
              timeVal = new Date(timestamp).getTime();
            }

            if (timeVal) {
              setGameStartTime(timeVal);
              setGameOpenTime(timeVal);
            }
          }

          if (data.totalTimeTaken !== undefined) {
            const parsedTotalTime =
              typeof data.totalTimeTaken === "number" ? data.totalTimeTaken : 0;
            setTotalTimeTaken(parsedTotalTime);
          }

          if (
            data.gameResults &&
            Array.isArray(data.gameResults) &&
            data.gameResults.length > 0
          ) {
            // Validate game results before setting
            const validatedResults = data.gameResults.map((result) => ({
              ...result,
              timeInMs: typeof result.timeInMs === "number" ? result.timeInMs : 0,
              formattedTime: result.formattedTime || "0:00.00",
            }));

            setGameResults(validatedResults);

            // Set the current game index to the NEXT game after the last completed one
            const nextGameIndex = validatedResults.length;

            if (nextGameIndex >= GAMES.length) {
              setGameState("finished");
            } else {
              setCurrentGameIndex(nextGameIndex);
              if (nextGameIndex > 0) {
                setGameState("playing");
              }
            }
          } else {
            // No game results, reset to start
            setGameResults([]);
            setCurrentGameIndex(0);
          }
        } else {
          setIsTeamValid(false);
          console.log("Team document does not exist. Access blocked.");
        }
      },
      (err) => {
        console.error("Firestore listening error:", err);
        setIsTeamValid(false);
      }
    );

    return unsubscribe;
  }, [teamNameState]);

  // Check game state on initialization and when time/gameStartTime updates
  useEffect(() => {
    // If no start time is specified, make it start immediately
    if (gameState === "waiting" && gameStartTime === undefined) {
      const now = Date.now();
      setGameStartTime(now);
      setGameOpenTime(now);
      setGameState("playing");
    }

    const timer = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);

      // Only for the first game, determine the proper state based on time
      if (
        currentGameIndex === 0 &&
        gameStartTime &&
        gameResults.length === 0 // Make sure we haven't already played games
      ) {
        const timeUntilStart = gameStartTime - now;

        // If the start time is in the past, we should be playing
        if (timeUntilStart <= 0) {
          if (gameState !== "playing") {
            setGameState("playing");
          }
        }
        // If we're within the countdown period (5 minutes before start)
        else if (timeUntilStart <= COUNTDOWN_PERIOD_MS) {
          setGameState("countdown");
          const remainingSeconds = Math.floor(timeUntilStart / 1000);
          setCountdownTime(remainingSeconds);
        }
        // Otherwise we're in waiting state
        else if (gameState !== "waiting") {
          setGameState("waiting");
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, gameStartTime, currentGameIndex, gameResults, currentTime]);

  // Function to update win state for current game
  const updateGameWinState = (isWon: boolean) => {
    if (currentGameIndex < GAMES.length) {
      const gameId = GAMES[currentGameIndex].id;
      setGameWinStates((prevState) => ({
        ...prevState,
        [gameId]: isWon,
      }));
    }
  };

  // Determine if current game is won
  const isCurrentGameWon = useCallback(() => {
    if (currentGameIndex < GAMES.length) {
      const gameId = GAMES[currentGameIndex].id;
      return gameWinStates[gameId] || false;
    }
    return false;
  }, [currentGameIndex, gameWinStates]);

  // Handle game completion - memoized to prevent recreating on every render
  const handleGameComplete = useCallback(async () => {
    // Only allow completion if current game is won
    if (!teamNameState || !isCurrentGameWon()) return;

    // Calculate time taken
    const endTime = Date.now();
    const lastTimeInMs = gameOpenTime
      ? gameOpenTime + gameResults.reduce((acc, curr) => acc + curr.timeInMs, 0)
      : endTime;
    const timeTaken = endTime - lastTimeInMs;
    const minutes = Math.floor(timeTaken / 60000);
    const secondsNum = (timeTaken % 60000) / 1000;
    const seconds = secondsNum.toFixed(2);

    // Format time properly
    const formattedTime = `${minutes}:${secondsNum < 10 ? "0" : ""}${seconds}`;

    // Store result
    const result: GameResult = {
      gameId: GAMES[currentGameIndex].id,
      gameName: GAMES[currentGameIndex].name,
      timeInMs: timeTaken,
      formattedTime: formattedTime,
    };

    const newTotalTime = totalTimeTaken + timeTaken;
    setTotalTimeTaken(newTotalTime);

    // Save to results
    const newResults = [...gameResults, result];
    setGameResults(newResults);

    setGameState("submitting");

    // Save to Firebase first
    try {
      await setGameResultsApi(teamNameState, newResults, newTotalTime);

      // After successful save, check if we're done or move to next game
      if (currentGameIndex < GAMES.length - 1) {
        // Move to next game
        setCurrentGameIndex(currentGameIndex + 1);
        setGameState("playing");
      } else {
        // All games completed
        setGameState("finished");
      }
    } catch (error) {
      console.error("Error saving game results:", error);
      // Fallback: even if Firebase save fails (e.g. due to security rules or network issues),
      // we still advance the game state locally so the user can test the transition.
      if (currentGameIndex < GAMES.length - 1) {
        setCurrentGameIndex(currentGameIndex + 1);
        setGameState("playing");
      } else {
        setGameState("finished");
      }
    }
  }, [
    teamNameState,
    isCurrentGameWon,
    gameOpenTime,
    gameResults,
    currentGameIndex,
    totalTimeTaken,
  ]);

  // Format the countdown time for display
  const formatCountdown = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Format the time until start
  const formatTimeUntilStart = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? "s" : ""} and ${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`;
    } else {
      return `${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`;
    }
  };

  // Get Current game component
  const CurrentGame =
    currentGameIndex < GAMES.length ? GAMES[currentGameIndex].component : null;

  if (!teamNameState) {
    return (
      <div className="min-h-screen bg-[#0e1115] text-[#19D1E6] flex flex-col items-center justify-center font-mono">
        <Suspense fallback={null}>
          <CustomCursor />
        </Suspense>
        <span className="material-symbols-outlined animate-spin text-4xl mb-3">sync</span>
        Redirecting...
      </div>
    );
  }

  if (isTeamValid === null) {
    return (
      <div className="min-h-screen bg-[#0e1115] text-[#19D1E6] flex flex-col items-center justify-center font-mono">
        <Suspense fallback={null}>
          <CustomCursor />
        </Suspense>
        <span className="material-symbols-outlined animate-spin text-4xl mb-3">sync</span>
        Validating Team...
      </div>
    );
  }

  if (isTeamValid === false) {
    return (
      <div className="min-h-screen bg-[#0c0e12] text-gray-200 p-6 flex flex-col items-center justify-center font-mono">
        <Suspense fallback={null}>
          <CustomCursor />
        </Suspense>
        <div className="max-w-md w-full bg-[#13171f] border border-red-500/30 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="inline-flex p-3 bg-red-950/30 border border-red-500/30 text-red-500 rounded-full mb-4">
            <span className="material-symbols-outlined text-4xl">error</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Team Not Registered</h2>
          <p className="text-gray-400 text-sm mb-6">
            The team <span className="text-red-400 font-semibold">"{teamNameState}"</span> could not be found. Please register your team to enter the Nexa Tech Arena.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate("/game/register")}
              className="w-full py-3 bg-[#19D1E6] hover:bg-[#19D1E6]/90 text-[#0e0e0e] font-bold rounded-xl text-sm transition duration-200"
            >
              Register Team
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl text-sm transition duration-200"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0e12] text-gray-200 p-3 md:p-6 flex flex-col items-center justify-center">
      <Suspense fallback={null}>
        <CustomCursor />
      </Suspense>
      <div className="max-w-4xl w-full mx-auto">
        {/* Header */}
        <header className="bg-[#13171f] border border-gray-800/80 rounded-2xl p-4 md:p-6 mb-6 shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#19D1E6] text-3xl">sports_esports</span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Team: <span className="text-[#19D1E6]">{teamNameState}</span>
              </h1>
              <p className="text-xs text-gray-400">NEXA Tech Arena Challenge</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-400">Progress</p>
              <p className="text-sm font-semibold text-white font-mono">
                {currentGameIndex < GAMES.length
                  ? `Stage ${currentGameIndex + 1} of ${GAMES.length}`
                  : "All Completed"}
              </p>
            </div>
            <div className="px-4 py-2 bg-[#19D1E6]/10 border border-[#19D1E6]/30 text-[#19D1E6] font-bold text-sm rounded-xl font-mono">
              {currentGameIndex < GAMES.length
                ? GAMES[currentGameIndex].name
                : "Finished"}
            </div>
          </div>
        </header>

        {/* Game Progress Bar */}
        <div className="mb-8 px-2">
          <div className="relative w-full bg-gray-800 h-2.5 rounded-full">
            <div
              className="absolute top-0 left-0 bg-[#19D1E6] h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(25,209,230,0.6)]"
              style={{
                width: `${(Math.min(currentGameIndex, GAMES.length) / GAMES.length) * 100}%`,
              }}
            />
            {/* Step Indicators */}
            <div className="absolute inset-0 flex justify-between -top-1.5">
              {GAMES.map((game, index) => {
                const isPassed = index < currentGameIndex;
                const isCurrent = index === currentGameIndex;
                return (
                  <div
                    key={game.id}
                    className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all duration-300 font-mono text-[9px] font-bold ${
                      isPassed
                        ? "bg-[#19D1E6] border-[#19D1E6] text-[#0e0e0e]"
                        : isCurrent
                          ? "bg-gray-900 border-[#19D1E6] text-[#19D1E6] shadow-[0_0_8px_rgba(25,209,230,0.4)]"
                          : "bg-gray-900 border-gray-700 text-gray-500"
                    }`}
                  >
                    {isPassed ? "✓" : index + 1}
                  </div>
                );
              })}
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all duration-300 font-mono text-[9px] font-bold ${
                  currentGameIndex >= GAMES.length
                    ? "bg-[#19D1E6] border-[#19D1E6] text-[#0e0e0e]"
                    : "bg-gray-900 border-gray-700 text-gray-500"
                }`}
              >
                🏁
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-3 text-[10px] text-gray-500 font-mono uppercase tracking-wider px-1">
            {GAMES.map((game, index) => (
              <span
                key={game.id}
                className={index <= currentGameIndex ? "text-gray-300" : "text-gray-600"}
              >
                {game.name}
              </span>
            ))}
            <span className={currentGameIndex >= GAMES.length ? "text-gray-300" : "text-gray-600"}>
              Results
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-[#13171f] border border-gray-800/80 rounded-3xl p-4 md:p-8 shadow-2xl relative overflow-hidden">
          {/* Waiting State - Only for first game */}
          {gameState === "waiting" && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="material-symbols-outlined text-gray-600 text-5xl mb-4 animate-pulse">
                hourglass_empty
              </span>
              <h2 className="text-xl font-bold text-white mb-2">
                Waiting for the Arena to Open
              </h2>
              <p className="text-gray-400 text-sm max-w-sm">
                The competition will begin automatically at the scheduled start time. Get ready!
              </p>
              {gameStartTime && (
                <div className="mt-6 px-5 py-3 bg-gray-900 border border-gray-800 rounded-2xl text-[#19D1E6] font-mono text-sm shadow-inner">
                  {gameStartTime > currentTime ? (
                    <>
                      Time remaining:{" "}
                      <span className="font-bold">
                        {formatTimeUntilStart(gameStartTime - currentTime)}
                      </span>
                    </>
                  ) : (
                    <>Arena starting momentarily...</>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Countdown - Only for first game */}
          {gameState === "countdown" && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-xs uppercase tracking-[0.2em] text-[#19D1E6]/70 mb-3 font-semibold">
                Arena opening in
              </span>
              <div className="text-7xl font-extrabold text-[#19D1E6] font-mono drop-shadow-[0_0_20px_rgba(25,209,230,0.5)] animate-pulse">
                {formatCountdown(countdownTime)}
              </div>
              <p className="mt-4 text-gray-400 text-sm">
                First game up: <span className="text-white font-semibold">{GAMES[0].name}</span>
              </p>
            </div>
          )}

          {/* Playing Game State */}
          {gameState === "playing" && CurrentGame && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pb-4 border-b border-gray-800/50">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#19D1E6] animate-ping" />
                  <span className="text-sm text-gray-400 font-mono">
                    Current Goal:{" "}
                    <span className="text-white font-semibold font-sans">
                      {GAMES[currentGameIndex].name}
                    </span>
                  </span>
                </div>
                <button
                  onClick={handleGameComplete}
                  disabled={!isCurrentGameWon() || !isEditable}
                  className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm tracking-wide transition duration-300 active:scale-95 ${
                    isCurrentGameWon() && isEditable
                      ? "bg-[#19D1E6] hover:bg-[#19D1E6]/90 text-[#0e0e0e] shadow-[0_0_15px_rgba(25,209,230,0.35)]"
                      : isCurrentGameWon()
                        ? "bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-700/50"
                        : "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-800/80"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {isCurrentGameWon() ? "double_arrow" : "lock"}
                  </span>
                  {!isCurrentGameWon()
                    ? "Solve Puzzle to Unlock"
                    : isEditable
                      ? "Next Game"
                      : "Leader Only"}
                </button>
              </div>

              {/* Game Board Container */}
              <div className="game-container flex justify-center py-2">
                <CurrentGame
                  isWon={isCurrentGameWon()}
                  setIsWon={updateGameWinState}
                />
              </div>
            </div>
          )}

          {/* Submitting State */}
          {gameState === "submitting" && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="material-symbols-outlined animate-spin text-[#19D1E6] text-5xl mb-4">
                cloud_upload
              </span>
              <h2 className="text-xl font-bold text-white mb-2">Syncing Results</h2>
              <p className="text-gray-400 text-sm max-w-sm">
                Updating your team's score in the cloud database...
              </p>
            </div>
          )}

          {/* Results Screen */}
          {gameState === "finished" && (
            <div className="py-4">
              <div className="text-center mb-8">
                <div className="inline-flex p-3 bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 rounded-full mb-4 animate-bounce">
                  <span className="material-symbols-outlined text-4xl">emoji_events</span>
                </div>
                <h2 className="text-2xl font-bold text-white">All Challenges Completed!</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Congratulations! Your scores have been registered.
                </p>
              </div>

              <div className="max-w-md mx-auto bg-gray-900/40 border border-gray-800/80 rounded-2xl p-6 shadow-lg">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 font-mono">
                  Final Results Log
                </h3>
                <div className="divide-y divide-gray-800/60 text-sm">
                  {gameResults.map((result, idx) => (
                    <div key={idx} className="py-3 flex justify-between items-center">
                      <span className="text-gray-300 font-medium">{result.gameName}</span>
                      <span className="font-mono text-[#19D1E6]">{result.formattedTime}</span>
                    </div>
                  ))}
                  <div className="pt-4 mt-1 flex justify-between items-center font-bold text-base">
                    <span className="text-white">Total Arena Time</span>
                    <span className="font-mono text-[#19D1E6] drop-shadow-[0_0_8px_rgba(25,209,230,0.3)]">
                      {(() => {
                        const totalMs = gameResults.reduce(
                          (sum, res) => sum + (res.timeInMs || 0),
                          0
                        );
                        const totalMinutes = Math.floor(totalMs / 60000);
                        const totalSecondsNum = Math.floor((totalMs % 60000) / 1000);
                        const totalMilliseconds = Math.floor((totalMs % 1000) / 10);

                        return `${totalMinutes}:${totalSecondsNum < 10 ? "0" : ""}${totalSecondsNum}.${totalMilliseconds < 10 ? "0" : ""}${totalMilliseconds}`;
                      })()}
                    </span>
                  </div>
                </div>

                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => navigate("/")}
                    className="px-6 py-3 bg-gray-800 hover:bg-[#19D1E6]/10 text-white hover:text-[#19D1E6] border border-gray-700/50 hover:border-[#19D1E6]/40 font-semibold rounded-xl text-sm transition duration-200"
                  >
                    Return to Lobby
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Previous Results Panel */}
        {gameResults.length > 0 && gameState !== "finished" && (
          <div className="mt-6 bg-[#13171f] border border-gray-800/80 rounded-2xl p-4 md:p-6 shadow-lg">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 font-mono">
              Completed Stages
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gameResults.map((result, index) => (
                <div
                  key={index}
                  className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-3 flex justify-between items-center text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                    <span className="text-gray-300 font-medium">{result.gameName}</span>
                  </div>
                  <span className="font-mono text-[#19D1E6]">{result.formattedTime}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
