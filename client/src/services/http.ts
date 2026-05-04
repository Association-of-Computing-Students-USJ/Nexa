// Minimal fetch wrapper: JSON in/out + token support.
import { getToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000";

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const text = await res.text();
  const json = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const msg = (json as any)?.error ?? `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  return json as T;
}

