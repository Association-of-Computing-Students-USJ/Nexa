export interface GameResult {
  gameId: string;
  gameName: string;
  timeInMs: number;
  formattedTime: string;
}

export interface TeamDataType {
  totalTimeTaken?: number;
  gameResults?: GameResult[];
}

export interface GameOptions {
  gameStartTime?: Date;
}
