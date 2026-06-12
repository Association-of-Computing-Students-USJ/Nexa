import React, { useState, useEffect } from "react";

interface SudokuGameProps {
  isWon: boolean;
  setIsWon: (isWon: boolean) => void;
}

// A pre-solved Sudoku board with a few empty cells (0 represents empty) for gameplay
const INITIAL_BOARD = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

// Fully solved solution corresponding to the INITIAL_BOARD above
const SOLVED_BOARD = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

export default function SudokuGame({ isWon, setIsWon }: SudokuGameProps) {
  const [board, setBoard] = useState<number[][]>(() =>
    INITIAL_BOARD.map((row) => [...row])
  );
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [errors, setErrors] = useState<boolean[][]>(() =>
    Array(9).fill(null).map(() => Array(9).fill(false))
  );

  // Keyboard navigation and entry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell || isWon) return;

      const { r, c } = selectedCell;

      if (e.key >= "1" && e.key <= "9") {
        updateCell(r, c, parseInt(e.key));
      } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        updateCell(r, c, 0);
      } else if (e.key === "ArrowUp" && r > 0) {
        setSelectedCell({ r: r - 1, c });
      } else if (e.key === "ArrowDown" && r < 8) {
        setSelectedCell({ r: r + 1, c });
      } else if (e.key === "ArrowLeft" && c > 0) {
        setSelectedCell({ r, c: c - 1 });
      } else if (e.key === "ArrowRight" && c < 8) {
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

    // Validate the new board and update errors
    validateBoard(newBoard);
  };

  // Check rows, columns, and 3x3 blocks for duplicates
  const validateBoard = (currentBoard: number[][]) => {
    const newErrors = Array(9)
      .fill(null)
      .map(() => Array(9).fill(false));
    let hasDuplicate = false;

    // Check rows
    for (let r = 0; r < 9; r++) {
      const seen = new Map<number, number[]>();
      for (let c = 0; c < 9; c++) {
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
    for (let c = 0; c < 9; c++) {
      const seen = new Map<number, number[]>();
      for (let r = 0; r < 9; r++) {
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

    // Check 3x3 grids
    for (let block = 0; block < 9; block++) {
      const startRow = Math.floor(block / 3) * 3;
      const startCol = (block % 3) * 3;
      const seen = new Map<number, { r: number; c: number }[]>();

      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
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
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentBoard[r][c] === 0 || newErrors[r][c]) {
          isSolved = false;
          break;
        }
      }
      if (!isSolved) break;
    }

    // Double check against solution to be absolutely certain
    if (isSolved && !hasDuplicate) {
      let matchesSolution = true;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (currentBoard[r][c] !== SOLVED_BOARD[r][c]) {
            matchesSolution = false;
            break;
          }
        }
      }
      if (matchesSolution) {
        setIsWon(true);
      }
    } else {
      setIsWon(false);
    }
  };

  // Helper to trigger autocomplete (for easy development/testing)
  const triggerAutoSolve = () => {
    // Fill all but one cell to make it instantaneous to complete
    const almostSolved = SOLVED_BOARD.map((row) => [...row]);
    // Leave the first empty cell in the original board empty for the player to fill
    let leftOneEmpty = false;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (INITIAL_BOARD[r][c] === 0) {
          if (!leftOneEmpty) {
            almostSolved[r][c] = 0; // leave this one empty
            leftOneEmpty = true;
          }
        }
      }
    }
    setBoard(almostSolved);
    validateBoard(almostSolved);
    // Select the empty cell
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (almostSolved[r][c] === 0) {
          setSelectedCell({ r, c });
          return;
        }
      }
    }
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
      "relative aspect-square flex items-center justify-center font-semibold text-lg md:text-xl transition-all duration-200 cursor-pointer select-none border border-gray-700/40 ";

    // thick borders for 3x3 grids
    if (r % 3 === 0 && r !== 0) classes += "border-t-2 border-t-[#19D1E6]/40 ";
    if (c % 3 === 0 && c !== 0) classes += "border-l-2 border-l-[#19D1E6]/40 ";
    if (r === 8) classes += "border-b border-b-gray-600 ";
    if (c === 8) classes += "border-r border-r-gray-600 ";

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
          Sudoku Challenge
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Complete the grid using numbers 1–9. Row, column, and 3x3 box contents must be unique.
        </p>
      </div>

      {/* 9x9 Sudoku Board */}
      <div className="w-full max-w-[420px] bg-[#131518] rounded-xl overflow-hidden shadow-inner p-1 sm:p-2 border border-gray-800/50">
        <div className="grid grid-cols-9 gap-[1px]">
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
        <div className="mt-4 w-full max-w-[420px] py-2.5 px-4 bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 rounded-lg text-center flex items-center justify-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-emerald-400">task_alt</span>
          <span className="font-semibold text-sm">Sudoku Correctly Solved!</span>
        </div>
      )}

      {/* Number Input Pad */}
      <div className="w-full max-w-[420px] mt-4 flex flex-col gap-2">
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              onClick={() => handleNumInput(num)}
              disabled={isWon || !selectedCell}
              className="py-3 bg-gray-800 hover:bg-[#19D1E6]/20 hover:text-[#19D1E6] text-gray-200 border border-gray-700/50 hover:border-[#19D1E6]/50 rounded-xl transition duration-200 font-bold active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-800 disabled:hover:text-gray-200"
            >
              {num}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[6, 7, 8, 9].map((num) => (
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
            className="py-3 bg-red-950/30 border border-red-900/40 hover:bg-red-900/30 hover:border-red-500/50 text-red-400 rounded-xl transition duration-200 font-bold active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Erase
          </button>
        </div>
      </div>

      {/* Developer Helper Tools */}
      <div className="mt-4 flex gap-4 text-xs">
        <button
          onClick={triggerAutoSolve}
          disabled={isWon}
          className="hidden text-gray-500 hover:text-[#19D1E6] transition hover:underline active:scale-95"
        >
          [Dev: Autofill Board]
        </button>
        <button
          onClick={() => {
            setBoard(INITIAL_BOARD.map((row) => [...row]));
            setErrors(Array(9).fill(null).map(() => Array(9).fill(false)));
            setIsWon(false);
          }}
          className="text-gray-500 hover:text-red-400 transition hover:underline active:scale-95"
        >
          [Reset Board]
        </button>
      </div>
    </div>
  );
}
