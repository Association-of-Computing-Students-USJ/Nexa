import { doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { GameResult, ArenaState } from "../types/game";

export async function setGameResultsApi(
  playerName: string,
  gameResults: GameResult[],
  totalTimeTaken: number
) {
  const docRef = doc(db, "players", playerName);
  await setDoc(
    docRef,
    {
      gameResults,
      totalTimeTaken,
    },
    { merge: true }
  );
}

// Set the player's individual start time
export async function setPlayerStartTime(playerName: string, startTime: number) {
  const docRef = doc(db, "players", playerName);
  await updateDoc(docRef, { playerStartTime: startTime });
}

// Arena state document reference
export function getArenaStateRef() {
  return doc(db, "arenaConfig", "state");
}

// Admin: set arena state
export async function setArenaState(state: Partial<ArenaState>) {
  const docRef = getArenaStateRef();
  await setDoc(docRef, state, { merge: true });
}
