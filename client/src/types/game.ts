export interface GameResult {
  gameId: string;
  gameName: string;
  timeInMs: number;
  formattedTime: string;
  moves?: number;
}

export interface PlayerDataType {
  totalTimeTaken?: number;
  gameResults?: GameResult[];
  playerStartTime?: number;  // when this player clicked "Start Playing"
}

export interface ArenaState {
  arenaStatus: "idle" | "open" | "closed";
  arenaOpenedAt: number | null;
  arenaWindowMs: number; // 1800000 = 30 min
}

export interface GameOptions {
  gameStartTime?: Date;
}
