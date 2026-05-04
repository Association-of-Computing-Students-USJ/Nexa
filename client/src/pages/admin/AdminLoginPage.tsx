import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/http";
import { setToken } from "../../services/auth";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@nexa.local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await apiFetch<{ token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setToken(res.token);
      navigate("/admin/events");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <section className="mx-auto mt-14 max-w-md space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Admin Login</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6">
        <div>
          <label className="text-sm text-zinc-200">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md bg-zinc-950/60 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-white/20"
          />
        </div>
        <div>
          <label className="text-sm text-zinc-200">Password</label>
          <input
            value={password}
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md bg-zinc-950/60 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-white/20"
          />
        </div>
        {error ? (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}
        <button className="w-full rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-100">
          Sign in
        </button>
        <p className="text-xs text-zinc-400">
          Demo creds (auto-created): <span className="text-white">admin@nexa.local</span> /{" "}
          <span className="text-white">admin123</span>
        </p>
      </form>
    </section>
  );
}

