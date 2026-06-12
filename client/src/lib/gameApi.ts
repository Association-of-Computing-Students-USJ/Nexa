import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { GameResult } from "../types/game";

export async function setGameResultsApi(
  teamName: string,
  gameResults: GameResult[],
  totalTimeTaken: number
) {
  const docRef = doc(db, "teams", teamName);
  await setDoc(
    docRef,
    {
      gameResults,
      totalTimeTaken,
    },
    { merge: true }
  );
}
