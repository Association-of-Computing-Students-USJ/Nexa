import { doc, runTransaction, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { ensureFirebaseAuth } from "./firebaseAuth";
import type { ParticipantScan } from "../types/participant";

export type CheckInOutcome = "success" | "already" | "not_found";

function toParticipant(id: string, data: Record<string, unknown>): ParticipantScan {
  return {
    id,
    name: String(data.name ?? ""),
    email: String(data.email ?? ""),
    phone: String(data.phone ?? ""),
    university: String(data.university ?? ""),
    year: String(data.year ?? ""),
    attended: Boolean(data.attended),
    attendedAt: (data.attendedAt as ParticipantScan["attendedAt"]) ?? null,
    mealServed: Boolean(data.mealServed),
    mealServedAt: (data.mealServedAt as ParticipantScan["mealServedAt"]) ?? null,
  };
}

/** Atomically check in for entry — safe when many scanners hit the same ticket. */
export async function checkInEntry(id: string): Promise<{
  outcome: CheckInOutcome;
  participant?: ParticipantScan;
}> {
  await ensureFirebaseAuth();
  const ref = doc(db, "registrations", id);

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return { outcome: "not_found" as const };

    const participant = toParticipant(snap.id, snap.data());
    if (participant.attended) {
      return { outcome: "already" as const, participant };
    }

    tx.update(ref, { attended: true, attendedAt: serverTimestamp() });
    return {
      outcome: "success" as const,
      participant: { ...participant, attended: true },
    };
  });
}

/** Atomically mark meal served — safe under concurrent scans. */
export async function checkInMeal(id: string): Promise<{
  outcome: CheckInOutcome;
  participant?: ParticipantScan;
}> {
  await ensureFirebaseAuth();
  const ref = doc(db, "registrations", id);

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return { outcome: "not_found" as const };

    const participant = toParticipant(snap.id, snap.data());
    if (participant.mealServed) {
      return { outcome: "already" as const, participant };
    }

    tx.update(ref, { mealServed: true, mealServedAt: serverTimestamp() });
    return {
      outcome: "success" as const,
      participant: { ...participant, mealServed: true },
    };
  });
}

export async function undoEntry(id: string): Promise<void> {
  await ensureFirebaseAuth();
  await updateDoc(doc(db, "registrations", id), {
    attended: false,
    attendedAt: null,
  });
}

export async function undoMeal(id: string): Promise<void> {
  await ensureFirebaseAuth();
  await updateDoc(doc(db, "registrations", id), {
    mealServed: false,
    mealServedAt: null,
  });
}
