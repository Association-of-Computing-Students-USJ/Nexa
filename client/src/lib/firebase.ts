import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getPerformance } from "firebase/performance";
import { getMessaging, isSupported as messagingSupported } from "firebase/messaging";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Prevent re-initialisation during HMR
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ─── Core services ────────────────────────────────────────────────────────────

/** Firebase Authentication */
export const auth = getAuth(app);

/** Cloud Firestore */
export const db = getFirestore(app);

/** Cloud Storage */
export const storage = getStorage(app);

/** Cloud Functions */
export const functions = getFunctions(app);

// ─── Browser-only services (guarded so SSR / Node environments don't crash) ──

/**
 * Google Analytics for Firebase.
 * Returns null in environments where Analytics is not supported (e.g. browsers
 * that block cookies, Node, or when the measurement ID is missing).
 */
export const getAnalyticsInstance = async () => {
  const supported = await isSupported().catch(() => false);
  return supported ? getAnalytics(app) : null;
};

/**
 * Firebase Performance Monitoring.
 * Only available in browser contexts.
 */
export const getPerformanceInstance = () => {
  if (typeof window === "undefined") return null;
  return getPerformance(app);
};

/**
 * Firebase Cloud Messaging (push notifications).
 * Requires a service-worker and HTTPS; returns null when not supported.
 */
export const getMessagingInstance = async () => {
  const supported = await messagingSupported().catch(() => false);
  return supported ? getMessaging(app) : null;
};

export default app;
