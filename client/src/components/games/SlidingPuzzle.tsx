import React, { useState, useEffect } from "react";

interface SlidingPuzzleProps {
  isWon: boolean;
  setIsWon: (isWon: boolean) => void;
  setFinalMoves?: (moves: number) => void;
}

const GRID_SIZE = 4; // 4x4 grid for 15-Puzzle

export default function SlidingPuzzle({ isWon, setIsWon, setFinalMoves }: SlidingPuzzleProps) {
  // Solved state: [1, 2, 3, ..., 15, 0] (0 is empty space)
  const SOLVED_STATE = Array.from({ length: GRID_SIZE * GRID_SIZE - 1 }, (_, i) => i + 1).concat(0);

  const [board, setBoard] = useState<number[]>(() => {
    // Start with a solved state, then shuffle it using valid moves to guarantee solvability
    return shuffleBoard([...SOLVED_STATE], 40);
  });

  const [moves, setMoves] = useState<number>(0);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isWon) return;

      const emptyIndex = board.indexOf(0);
      const row = Math.floor(emptyIndex / GRID_SIZE);
      const col = emptyIndex % GRID_SIZE;

      let targetIndex = -1;

      // Key matches:
      // If ArrowUp is pressed, we want to slide the tile below the empty space UP (targetIndex is below emptyIndex)
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        if (row < GRID_SIZE - 1) targetIndex = emptyIndex + GRID_SIZE;
      }
      // If ArrowDown is pressed, slide the tile above the empty space DOWN
      else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        if (row > 0) targetIndex = emptyIndex - GRID_SIZE;
      }
      // If ArrowLeft is pressed, slide the tile to the right of empty space LEFT
      else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        if (col < GRID_SIZE - 1) targetIndex = emptyIndex + 1;
      }
      // If ArrowRight is pressed, slide the tile to the left of empty space RIGHT
      else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        if (col > 0) targetIndex = emptyIndex - 1;
      }

      if (targetIndex !== -1) {
        moveTile(targetIndex);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [board, isWon]);

  // Helper to shuffle the board by making valid random moves
  function shuffleBoard(arr: number[], movesCount: number): number[] {
    let emptyIndex = arr.indexOf(0);
    const shuffled = [...arr];

    for (let m = 0; m < movesCount; m++) {
      const row = Math.floor(emptyIndex / GRID_SIZE);
      const col = emptyIndex % GRID_SIZE;
      const validMoves: number[] = [];

      if (row > 0) validMoves.push(emptyIndex - GRID_SIZE); // top
      if (row < GRID_SIZE - 1) validMoves.push(emptyIndex + GRID_SIZE); // bottom
      if (col > 0) validMoves.push(emptyIndex - 1); // left
      if (col < GRID_SIZE - 1) validMoves.push(emptyIndex + 1); // right

      // pick a random valid move
      const nextIndex = validMoves[Math.floor(Math.random() * validMoves.length)];
      // swap
      shuffled[emptyIndex] = shuffled[nextIndex];
      shuffled[nextIndex] = 0;
      emptyIndex = nextIndex;
    }

    return shuffled;
  }

  // Check if tile is adjacent to empty space
  const isAdjacent = (index: number): boolean => {
    const emptyIndex = board.indexOf(0);
    const emptyRow = Math.floor(emptyIndex / GRID_SIZE);
    const emptyCol = emptyIndex % GRID_SIZE;

    const tileRow = Math.floor(index / GRID_SIZE);
    const tileCol = index % GRID_SIZE;

    return Math.abs(emptyRow - tileRow) + Math.abs(emptyCol - tileCol) === 1;
  };

  // Move tile at index
  const moveTile = (index: number) => {
    if (isWon || !isAdjacent(index)) return;

    const emptyIndex = board.indexOf(0);
    const newBoard = [...board];

    // swap empty spot and clicked tile
    newBoard[emptyIndex] = board[index];
    newBoard[index] = 0;

    setBoard(newBoard);
    setMoves((m) => m + 1);

    // check win condition
    checkWin(newBoard, moves + 1);
  };

  const checkWin = (currentBoard: number[], currentMoves: number) => {
    let matchesSolved = true;
    for (let i = 0; i < currentBoard.length; i++) {
      if (currentBoard[i] !== SOLVED_STATE[i]) {
        matchesSolved = false;
        break;
      }
    }
    if (matchesSolved) {
      setIsWon(true);
      if (setFinalMoves) setFinalMoves(currentMoves);
    } else {
      setIsWon(false);
    }
  };

  // Dev shortcut: Solves all except last slide
  const triggerAutoSolve = () => {
    const almostSolved = [...SOLVED_STATE];
    // Swap 15 and 0 (empty space) to have only 1 valid move remaining
    // Let's swap index 14 (value 15) and index 15 (value 0)
    // Board: [1, 2, ..., 14, 0, 15] or similar
    almostSolved[15] = 15;
    almostSolved[14] = 0;

    setBoard(almostSolved);
    setIsWon(false);
  };

  const handleReset = () => {
    setBoard(shuffleBoard([...SOLVED_STATE], 40));
    setMoves(0);
    setIsWon(false);
  };

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto w-full p-2 sm:p-5 bg-[#1b1d22]/90 border border-gray-800/80 rounded-2xl shadow-2xl backdrop-blur-xl">
      <div className="text-center mb-5">
        <h3 className="text-xl font-bold text-gray-200 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[#19D1E6] animate-pulse">widgets</span>
          15 Slide Puzzle
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Arrange tiles in numerical order (1 to 15) by clicking adjacent tiles or using arrow keys (W/A/S/D).
        </p>
      </div>

      {/* Grid Board */}
      <div className="w-full max-w-[360px] aspect-square bg-[#131518] rounded-2xl p-2.5 border border-gray-800/80 shadow-inner">
        <div className="grid grid-cols-4 grid-rows-4 gap-2.5 h-full w-full">
          {board.map((val, idx) => {
            const isEmpty = val === 0;
            const canMove = !isEmpty && isAdjacent(idx);

            let tileClasses =
              "w-full h-full rounded-xl flex items-center justify-center font-bold text-xl md:text-2xl select-none select-none transition-all duration-200 ";

            if (isEmpty) {
              tileClasses += "bg-transparent border-2 border-dashed border-gray-800/40 ";
            } else {
              tileClasses +=
                "border border-gray-700/50 shadow-md " +
                (canMove && !isWon
                  ? "bg-[#1f2229] hover:bg-[#19D1E6]/10 text-[#19D1E6] hover:border-[#19D1E6]/50 cursor-pointer hover:shadow-[0_0_12px_rgba(25,209,230,0.15)] active:scale-95 "
                  : "bg-gray-800 text-gray-400 cursor-not-allowed ");
            }

            return (
              <div
                key={idx}
                className={tileClasses}
                onClick={() => moveTile(idx)}
                role="button"
                aria-label={isEmpty ? "Empty cell" : `Tile ${val}`}
              >
                {!isEmpty && val}
              </div>
            );
          })}
        </div>
      </div>

      {/* Game Stats & Victory Status */}
      <div className="w-full max-w-[360px] mt-4 flex items-center justify-between text-sm px-1">
        <div className="text-gray-400 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">analytics</span>
          Moves: <span className="font-semibold text-gray-200">{moves}</span>
        </div>

        {isWon && (
          <div className="py-1 px-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 animate-bounce">
            <span className="material-symbols-outlined text-[14px]">task_alt</span>
            Solved!
          </div>
        )}
      </div>

      {/* Developer Helper Tools */}
      <div className="mt-5 flex gap-4 text-xs">
        <button
          onClick={triggerAutoSolve}
          disabled={isWon}
          className="hidden text-gray-500 hover:text-[#19D1E6] transition hover:underline active:scale-95"
        >
          [Dev: Near Solved State]
        </button>
        <button
          onClick={handleReset}
          className="text-gray-500 hover:text-red-400 transition hover:underline active:scale-95"
        >
          [Reset Board]
        </button>
      </div>
    </div>
  );
}
