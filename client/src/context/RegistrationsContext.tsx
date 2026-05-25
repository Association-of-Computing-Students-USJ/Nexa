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
import type { Participant } from "../types/participant";

interface RegistrationsContextValue {
  participants: Participant[];
  loading: boolean;
  error: string;
  /** Firestore listener is active and receiving updates. */
  live: boolean;
}

const RegistrationsContext = createContext<RegistrationsContextValue | null>(null);

export function RegistrationsProvider({ children }: { children: ReactNode }) {
  const [participants, setParticipants] = useState<Participant[]>([]);
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

        const q = query(collection(db, "registrations"), orderBy("registeredAt", "desc"));
        unsub = onSnapshot(
          q,
          (snap) => {
            setParticipants(
              snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Participant, "id">) }))
            );
            setLoading(false);
            setLive(true);
          },
          (err) => {
            setError(`Firestore error: ${err.code} — ${err.message}`);
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
    <RegistrationsContext.Provider value={{ participants, loading, error, live }}>
      {children}
    </RegistrationsContext.Provider>
  );
}

export function useRegistrations(): RegistrationsContextValue {
  const ctx = useContext(RegistrationsContext);
  if (!ctx) {
    throw new Error("useRegistrations must be used within RegistrationsProvider");
  }
  return ctx;
}
