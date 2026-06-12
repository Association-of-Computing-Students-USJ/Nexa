import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../lib/firebase";
import { ensureFirebaseAuth } from "../lib/firebaseAuth";
import type { FeedbackEntry } from "../types/feedback";

interface FeedbackContextValue {
  entries: FeedbackEntry[];
  loading: boolean;
  error: string;
  live: boolean;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [live, setLive] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    let active = true;

    ensureFirebaseAuth()
      .then(() => {
        if (!active) return;
        setError("");
        setLoading(true);

        const q = query(collection(db, "feedback"), orderBy("submittedAt", "desc"));
        unsub = onSnapshot(
          q,
          (snap) => {
            setEntries(
              snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FeedbackEntry, "id">) }))
            );
            setLoading(false);
            setLive(true);
          },
          (err) => {
            setError(
              err.code === "permission-denied"
                ? "Cannot read feedback — Firestore rules for the feedback collection are not deployed yet. Run: firebase deploy --only firestore:rules"
                : `Firestore error: ${err.code} — ${err.message}`
            );
            setLoading(false);
            setLive(false);
          }
        );
      })
      .catch(() => {
        if (!active) return;
        setError("Not signed into Firebase. Please log out and log back in.");
        setLoading(false);
        setLive(false);
      });

    return () => {
      active = false;
      unsub?.();
    };
  }, []);

  return (
    <FeedbackContext.Provider value={{ entries, loading, error, live }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error("useFeedback must be used within FeedbackProvider");
  }
  return ctx;
}
