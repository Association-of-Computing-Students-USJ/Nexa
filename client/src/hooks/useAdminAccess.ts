import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export function useAdminAccess() {
  const [accesses, setAccesses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchAccesses() {
      try {
        await auth.authStateReady();
        const user = auth.currentUser;
        
        if (!user) {
          if (active) {
            setAccesses([]);
            setLoading(false);
          }
          return;
        }

        const adminDocRef = doc(db, "users", user.uid);
        const adminDoc = await getDoc(adminDocRef);

        if (active) {
          if (adminDoc.exists()) {
            const data = adminDoc.data();
            
            // Robustly handle different possible structures user might have created
            let rawAccesses: any[] = [];
            if (Array.isArray(data?.accesses)) rawAccesses = data.accesses;
            else if (typeof data?.accesses === "string") rawAccesses = data.accesses.split(",").map((s: string) => s.trim());
            else if (Array.isArray(data?.access)) rawAccesses = data.access;
            else if (typeof data?.access === "string") rawAccesses = data.access.split(",").map((s: string) => s.trim());
            else if (typeof data?.role === "string") rawAccesses = data.role.split(",").map((s: string) => s.trim());

            // Normalize to lowercase
            const normalized = rawAccesses
              .filter(a => typeof a === "string")
              .map(a => a.toLowerCase().trim());
              
            setAccesses(normalized);
          } else {
            setAccesses([]);
          }
          setLoading(false);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || "Failed to fetch admin access");
          setLoading(false);
        }
      }
    }

    fetchAccesses();

    return () => {
      active = false;
    };
  }, []);

  return { accesses, loading, error };
}
