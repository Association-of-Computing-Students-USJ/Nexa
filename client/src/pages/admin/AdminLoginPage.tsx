import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import nexaLogo from "../../assets/images/logo/NEXA Colour.png";
import CustomCursor from "../../components/CustomCursor";
import { auth } from "../../lib/firebase";

export const ADMIN_SESSION_KEY = "nexa_admin_auth";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already authenticated redirect straight to dashboard
  useEffect(() => {
    if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "true") {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
      navigate("/admin/dashboard", { replace: true });
    } catch {
      setError("Firebase sign-in failed. Check your email/password and ensure Email/Password auth is enabled.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0a] flex items-center justify-center p-4">
      <CustomCursor />
      {/* Background grid */}
      <div className="fixed inset-0 grid-pattern pointer-events-none opacity-50" />

      {/* Glow orbs */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#19D1E6]/6 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-3xl overflow-hidden shadow-2xl">

          {/* Top accent */}
          <div className="h-1 w-full bg-gradient-to-r from-[#19D1E6] via-[#0ea5e9] to-[#19D1E6]" />

          <div className="px-8 pt-10 pb-10">
            {/* Brand */}
            <div className="flex flex-col items-center mb-8">
              <img src={nexaLogo} alt="NEXA" className="h-12 w-12 object-contain mb-3" />
              <h1 className="text-xl font-bold text-white tracking-tight">NEXA Admin Portal</h1>
              <p className="text-[#555] text-sm mt-1">Participant Management System</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-[#888] uppercase tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#444] text-base pointer-events-none">
                    email
                  </span>
                  <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(""); }}
                    placeholder="Enter email"
                    autoComplete="email"
                    className="w-full bg-[#0e0e0e] border border-[#2a2a2a] text-white rounded-xl pl-10 pr-4 py-3 text-sm placeholder-[#444] focus:outline-none focus:ring-2 focus:ring-[#19D1E6]/30 focus:border-[#19D1E6]/60 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-xs font-semibold text-[#888] uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#444] text-base pointer-events-none">
                    lock
                  </span>
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    className="w-full bg-[#0e0e0e] border border-[#2a2a2a] text-white rounded-xl pl-10 pr-11 py-3 text-sm placeholder-[#444] focus:outline-none focus:ring-2 focus:ring-[#19D1E6]/30 focus:border-[#19D1E6]/60 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#444] hover:text-[#888] transition-colors"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined text-base">
                      {showPass ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <span className="material-symbols-outlined text-red-400 text-base shrink-0">error</span>
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-3.5 bg-[#19D1E6] text-[#0e0e0e] font-bold rounded-xl hover:bg-[#19D1E6]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm mt-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">login</span>
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-[#444] text-xs mt-6">
          NEXA 2026 · ACS SJP · Admin Access Only
        </p>
      </div>
    </div>
  );
}
