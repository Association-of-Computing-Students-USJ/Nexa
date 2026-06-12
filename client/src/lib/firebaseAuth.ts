import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./firebase";

const ADMIN_FIREBASE_EMAIL = (import.meta.env.VITE_ADMIN_FIREBASE_EMAIL as string | undefined)?.trim();
const ADMIN_FIREBASE_PASS = (import.meta.env.VITE_ADMIN_FIREBASE_PASS as string | undefined)?.trim();

export function firebaseAuthErrorMessage(code: string): string {
  switch (code) {
    case "auth/not-signed-in":
      return "Session expired. Please sign out and log in again.";
    case "auth/admin-restricted-operation":
      return "Email/Password sign-in is disabled. Enable it in Firebase Console → Authentication → Sign-in method.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Sign-in failed. Use the admin login page, or check VITE_ADMIN_FIREBASE_EMAIL / VITE_ADMIN_FIREBASE_PASS in .env.";
    case "auth/too-many-requests":
      return "Too many sign-in attempts. Please wait a moment and try again.";
    default:
      return `Firebase Auth failed (${code}). Please sign in again.`;
  }
}

/**
 * Ensure a Firebase Auth session exists before Firestore reads/writes.
 * Waits for the persisted session from the admin login page to restore first.
 */
export async function ensureFirebaseAuth(): Promise<void> {
  await auth.authStateReady();

  if (auth.currentUser) return;

  if (ADMIN_FIREBASE_EMAIL && ADMIN_FIREBASE_PASS) {
    try {
      await signInWithEmailAndPassword(auth, ADMIN_FIREBASE_EMAIL, ADMIN_FIREBASE_PASS);
      return;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "auth/unknown";
      throw Object.assign(new Error(firebaseAuthErrorMessage(code)), { code });
    }
  }

  const code = "auth/not-signed-in";
  throw Object.assign(new Error(firebaseAuthErrorMessage(code)), { code });
}

export async function signOutAdmin(): Promise<void> {
  await signOut(auth);
}
