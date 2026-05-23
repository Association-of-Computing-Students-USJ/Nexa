import {
  createUserWithEmailAndPassword,
  signInAnonymously,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "./firebase";

const ADMIN_FIREBASE_EMAIL = import.meta.env.VITE_ADMIN_FIREBASE_EMAIL as string;
const ADMIN_FIREBASE_PASS = import.meta.env.VITE_ADMIN_FIREBASE_PASS as string;

/**
 * Ensure a Firebase Auth session exists before Firestore reads/writes.
 * NEXA uses Firebase as the sole backend — all admin operations require auth.
 *
 * Strategy (each step falls through to the next on failure):
 *  1. Return immediately if already signed in
 *  2. Email/password sign-in (VITE_ADMIN_FIREBASE_*)
 *  3. Auto-create account if it doesn't exist yet
 *  4. Anonymous sign-in fallback (satisfies request.auth != null rules)
 */
export async function ensureFirebaseAuth(): Promise<void> {
  if (auth.currentUser) return;

  if (ADMIN_FIREBASE_EMAIL && ADMIN_FIREBASE_PASS) {
    try {
      await signInWithEmailAndPassword(auth, ADMIN_FIREBASE_EMAIL, ADMIN_FIREBASE_PASS);
      return;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";

      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
        try {
          await createUserWithEmailAndPassword(auth, ADMIN_FIREBASE_EMAIL, ADMIN_FIREBASE_PASS);
          return;
        } catch {
          // e.g. email/password provider disabled — fall through
        }
      }
    }
  }

  await signInAnonymously(auth);
}
