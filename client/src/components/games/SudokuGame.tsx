import React, { useState, useEffect } from "react";

interface SudokuGameProps {
  isWon: boolean;
  setIsWon: (isWon: boolean) => void;
  setFinalMoves?: (moves: number) => void;
}

// A pre-solved 4x4 Sudoku board with a few empty cells (0 represents empty) for gameplay
const INITIAL_BOARD = [
  [0, 2, 0, 4],
  [3, 0, 0, 2],
  [0, 0, 4, 0],
  [4, 0, 2, 0],
];

// Fully solved solution corresponding to the INITIAL_BOARD above
const SOLVED_BOARD = [
  [1, 2, 3, 4],
  [3, 4, 1, 2],
  [2, 1, 4, 3],
  [4, 3, 2, 1],
];

export default function SudokuGame({ isWon, setIsWon, setFinalMoves }: SudokuGameProps) {
  const [board, setBoard] = useState<number[][]>(() =>
    INITIAL_BOARD.map((row) => [...row])
  );
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [errors, setErrors] = useState<boolean[][]>(() =>
    Array(4).fill(null).map(() => Array(4).fill(false))
  );
  const [moves, setMoves] = useState<number>(0);

  // Keyboard navigation and entry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell || isWon) return;

      const { r, c } = selectedCell;

      if (e.key >= "1" && e.key <= "4") {
        updateCell(r, c, parseInt(e.key));
      } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        updateCell(r, c, 0);
      } else if (e.key === "ArrowUp" && r > 0) {
        setSelectedCell({ r: r - 1, c });
      } else if (e.key === "ArrowDown" && r < 3) {
        setSelectedCell({ r: r + 1, c });
      } else if (e.key === "ArrowLeft" && c > 0) {
        setSelectedCell({ r, c: c - 1 });
      } else if (e.key === "ArrowRight" && c < 3) {
        setSelectedCell({ r, c: c + 1 });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCell, isWon]);

  // Check if cell is pre-filled from start
  const isOriginal = (r: number, c: number): boolean => {
    return INITIAL_BOARD[r][c] !== 0;
  };

  // Update a single cell val
  const updateCell = (r: number, c: number, val: number) => {
    if (isOriginal(r, c) || isWon) return;

    const newBoard = board.map((row, ri) =>
      row.map((colVal, ci) => (ri === r && ci === c ? val : colVal))
    );
    setBoard(newBoard);
    setMoves((m) => m + 1);

    // Validate the new board and update errors
    validateBoard(newBoard, moves + 1);
  };

  // Check rows, columns, and 2x2 blocks for duplicates
  const validateBoard = (currentBoard: number[][], currentMoves: number = moves) => {
    const newErrors = Array(4)
      .fill(null)
      .map(() => Array(4).fill(false));
    let hasDuplicate = false;

    // Check rows
    for (let r = 0; r < 4; r++) {
      const seen = new Map<number, number[]>();
      for (let c = 0; c < 4; c++) {
        const val = currentBoard[r][c];
        if (val !== 0) {
          if (seen.has(val)) {
            seen.get(val)!.push(c);
            seen.get(val)!.forEach((colIndex) => {
              newErrors[r][colIndex] = true;
            });
            hasDuplicate = true;
          } else {
            seen.set(val, [c]);
          }
        }
      }
    }

    // Check columns
    for (let c = 0; c < 4; c++) {
      const seen = new Map<number, number[]>();
      for (let r = 0; r < 4; r++) {
        const val = currentBoard[r][c];
        if (val !== 0) {
          if (seen.has(val)) {
            seen.get(val)!.push(r);
            seen.get(val)!.forEach((rowIndex) => {
              newErrors[rowIndex][c] = true;
            });
            hasDuplicate = true;
          } else {
            seen.set(val, [r]);
          }
        }
      }
    }

    // Check 2x2 grids
    for (let block = 0; block < 4; block++) {
      const startRow = Math.floor(block / 2) * 2;
      const startCol = (block % 2) * 2;
      const seen = new Map<number, { r: number; c: number }[]>();

      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          const r = startRow + i;
          const c = startCol + j;
          const val = currentBoard[r][c];
          if (val !== 0) {
            if (seen.has(val)) {
              seen.get(val)!.push({ r, c });
              seen.get(val)!.forEach((cell) => {
                newErrors[cell.r][cell.c] = true;
              });
              hasDuplicate = true;
            } else {
              seen.set(val, [{ r, c }]);
            }
          }
        }
      }
    }

    setErrors(newErrors);

    // Check if fully and correctly solved
    let isSolved = true;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentBoard[r][c] === 0 || newErrors[r][c]) {
          isSolved = false;
          break;
        }
      }
      if (!isSolved) break;
    }

    if (isSolved && !hasDuplicate) {
      setIsWon(true);
      if (setFinalMoves) setFinalMoves(currentMoves);
    } else {
      setIsWon(false);
    }
  };

  // Auto solver logic
  const triggerAutoSolve = () => {
    // Fill the board correctly according to SOLVED_BOARD
    const solved = SOLVED_BOARD.map((row) => [...row]);
    setBoard(solved);
    validateBoard(solved, moves);
  };

  const handleNumInput = (num: number) => {
    if (selectedCell) {
      updateCell(selectedCell.r, selectedCell.c, num);
    }
  };

  const handleErase = () => {
    if (selectedCell) {
      updateCell(selectedCell.r, selectedCell.c, 0);
    }
  };

  // Styling helper for board cells
  const getCellClasses = (r: number, c: number) => {
    let classes =
      "relative aspect-square flex items-center justify-center font-semibold text-2xl md:text-3xl transition-all duration-200 cursor-pointer select-none border border-gray-700/40 ";

    // thick borders for 2x2 grids
    if (r % 2 === 0 && r !== 0) classes += "border-t-2 border-t-[#19D1E6]/40 ";
    if (c % 2 === 0 && c !== 0) classes += "border-l-2 border-l-[#19D1E6]/40 ";
    if (r === 3) classes += "border-b border-b-gray-600 ";
    if (c === 3) classes += "border-r border-r-gray-600 ";

    const val = board[r][c];
    const isSel = selectedCell?.r === r && selectedCell?.c === c;
    const isRowColSel = selectedCell?.r === r || selectedCell?.c === c;
    const isSameNum =
      selectedCell && val !== 0 && board[selectedCell.r][selectedCell.c] === val;

    if (isOriginal(r, c)) {
      classes += "bg-[#282c35] text-gray-400 ";
    } else {
      classes += "bg-[#1f2229] text-[#19D1E6] ";
    }

    if (errors[r][c]) {
      classes += "bg-red-950/70 text-red-400 border border-red-500/50 ";
    } else if (isSel) {
      classes += "ring-2 ring-[#19D1E6] bg-[#19D1E6]/25 z-10 shadow-[0_0_12px_rgba(25,209,230,0.4)] ";
    } else if (isSameNum) {
      classes += "bg-[#19D1E6]/15 text-[#19D1E6] font-bold ";
    } else if (isRowColSel) {
      classes += "bg-gray-800/30 ";
    }

    return classes;
  };

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto w-full p-1 sm:p-4 bg-[#1b1d22]/90 border border-gray-800/80 rounded-2xl shadow-2xl backdrop-blur-xl">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-gray-200 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[#19D1E6] animate-pulse">grid_on</span>
          Mini Sudoku
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Complete the grid using numbers 1–4. Row, column, and 2x2 box contents must be unique.
        </p>
      </div>

      {/* 4x4 Sudoku Board */}
      <div className="w-full max-w-[280px] bg-[#131518] rounded-xl overflow-hidden shadow-inner p-1 sm:p-2 border border-gray-800/50">
        <div className="grid grid-cols-4 gap-[1px]">
          {board.map((row, r) =>
            row.map((val, c) => (
              <div
                key={`${r}-${c}`}
                className={getCellClasses(r, c)}
                onClick={() => !isWon && setSelectedCell({ r, c })}
              >
                {val !== 0 ? val : ""}
                {/* Visual indicator for non-editable filled values */}
                {isOriginal(r, c) && (
                  <div className="absolute top-0.5 left-0.5 w-1 h-1 rounded-full bg-gray-500/60" />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Status Alert */}
      {isWon && (
        <div className="mt-4 w-full max-w-[280px] py-2.5 px-4 bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 rounded-lg text-center flex items-center justify-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-emerald-400">task_alt</span>
          <span className="font-semibold text-sm">Sudoku Solved!</span>
        </div>
      )}

      {/* Number Input Pad */}
      <div className="w-full max-w-[280px] mt-4 flex flex-col gap-2">
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4].map((num) => (
            <button
              key={num}
              onClick={() => handleNumInput(num)}
              disabled={isWon || !selectedCell}
              className="py-3 bg-gray-800 hover:bg-[#19D1E6]/20 hover:text-[#19D1E6] text-gray-200 border border-gray-700/50 hover:border-[#19D1E6]/50 rounded-xl transition duration-200 font-bold active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-800 disabled:hover:text-gray-200"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleErase}
            disabled={isWon || !selectedCell}
            className="py-3 bg-red-950/30 border border-red-900/40 hover:bg-red-900/30 hover:border-red-500/50 text-red-400 rounded-xl transition duration-200 font-bold text-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
          >
            Erase
          </button>
        </div>
      </div>

      {/* Helper Tools */}
      <div className="mt-4 flex gap-4 text-xs">
        <button
          onClick={triggerAutoSolve}
          disabled={isWon}
          className="hidden text-gray-500 hover:text-[#19D1E6] transition hover:underline active:scale-95"
        >
          [Auto Solve]
        </button>
        <button
          onClick={() => {
            setBoard(INITIAL_BOARD.map((row) => [...row]));
            setErrors(Array(4).fill(null).map(() => Array(4).fill(false)));
            setMoves(0);
            setIsWon(false);
          }}
          className="py-2 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl transition duration-200 font-bold text-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-red-900/20"
        >
          Reset Board
        </button>
      </div>
    </div>
  );
}

