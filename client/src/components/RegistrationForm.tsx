import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, doc, writeBatch, serverTimestamp, updateDoc, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { buildRegistrationEmailHtml } from "../lib/registrationEmail";

// ─── Constants ────────────────────────────────────────────────────────────────

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

/** Firestore-safe document id derived from a normalized email address. */
function emailToDocId(email: string): string {
  return email.toLowerCase().trim().replace(/@/g, "_at_").replace(/\./g, "_dot_");
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormFields {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  university: string;
  year: string;
}

interface TicketData extends FormFields {
  id: string;
}

type FieldErrors = Partial<Record<keyof FormFields, string>>;

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(f: FormFields): FieldErrors {
  const e: FieldErrors = {};

  if (!f.name.trim() || f.name.trim().length < 2)
    e.name = "Name must be at least 2 characters.";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))
    e.email = "Enter a valid email address.";

  const phoneDigits = f.phone.replace(/[\s\-\+\(\)]/g, "");
  if (!/^\d{7,15}$/.test(phoneDigits))
    e.phone = "Enter a valid phone number (digits only).";

  const waDigits = f.whatsapp.replace(/[\s\-\+\(\)]/g, "");
  if (!/^\d{7,15}$/.test(waDigits))
    e.whatsapp = "Enter a valid WhatsApp number (digits only).";

  if (!f.university.trim())
    e.university = "University / institution is required.";

  if (!f.year) e.year = "Please select your academic year.";

  return e;
}

// ─── Field Component ──────────────────────────────────────────────────────────

function Field({
  label,
  name,
  type,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onBlur: React.FocusEventHandler<HTMLInputElement>;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-xs font-semibold text-[#888] uppercase tracking-wider">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete="off"
        className={`bg-[#0e0e0e] text-white border rounded-xl px-4 py-3 text-sm placeholder-[#444] focus:outline-none focus:ring-2 transition-colors ${
          error
            ? "border-red-500/50 focus:ring-red-500/20"
            : "border-[#2a2a2a] focus:ring-[#19D1E6]/30 focus:border-[#19D1E6]/60"
        }`}
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

const EMPTY: FormFields = {
  name: "",
  email: "",
  phone: "",
  whatsapp: "",
  university: "",
  year: "",
};

export default function RegistrationForm() {
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(true); // Assume true by default
  const [recaptchaError, setRecaptchaError] = useState("");

  useEffect(() => {
    // Dynamically load reCAPTCHA script with the Vite site key
    const key = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (!key) return;
    if ((window as any).grecaptcha) {
      setRecaptchaLoaded(true);
      setRecaptchaError("");
      return;
    }

    const s = document.createElement("script");
    s.src = `https://www.google.com/recaptcha/api.js?render=${key}`;
    s.async = true;
    s.onload = () => {
      if ((window as any).grecaptcha) {
        setRecaptchaLoaded(true);
        setRecaptchaError("");
      }
    };
    s.onerror = () => {
      setRecaptchaLoaded(false);
      setRecaptchaError("reCAPTCHA failed to load. Please disable your ad-blocker or Brave Shields and try again.");
    };
    document.head.appendChild(s);

    // Check if script was blocked after a timeout
    const timeoutId = setTimeout(() => {
      if (!(window as any).grecaptcha) {
        setRecaptchaLoaded(false);
        setRecaptchaError("reCAPTCHA is blocked. Please disable your ad-blocker or Brave Shields to complete registration.");
      }
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, []);

  async function ensureRecaptcha(): Promise<void> {
    const key = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (!key) return;
    if ((window as any).grecaptcha) return;
    await new Promise<void>((resolve, reject) => {
      const check = () => {
        if ((window as any).grecaptcha) return resolve();
        setTimeout(check, 50);
      };
      check();
      // Timeout after 5s
      setTimeout(() => reject(new Error("reCAPTCHA load timeout")), 5000);
    });
  }

  async function getRecaptchaToken(): Promise<string | null> {
    try {
      const key = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
      if (!key) return null;
      await ensureRecaptcha();
      const grecaptcha = (window as any).grecaptcha;
      return await grecaptcha.execute(key, { action: "register" });
    } catch (e) {
      console.warn("reCAPTCHA failed to execute:", e);
      return null;
    }
  }
  const navigate = useNavigate();
  const [fields, setFields] = useState<FormFields>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormFields, boolean>>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [apiError, setApiError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    const next = { ...fields, [name]: value };
    setFields(next);
    if (touched[name as keyof FormFields]) {
      const errs = validate(next);
      setErrors((prev) => ({ ...prev, [name]: errs[name as keyof FormFields] }));
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const errs = validate(fields);
    setErrors((prev) => ({ ...prev, [name]: errs[name as keyof FormFields] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(Object.fromEntries(Object.keys(fields).map((k) => [k, true])));
    const errs = validate(fields);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    // Check if reCAPTCHA is available before proceeding
    if (!recaptchaLoaded || !(window as any).grecaptcha) {
      setApiError("reCAPTCHA is blocked. Please disable your ad-blocker or Brave Shields to complete registration.");
      return;
    }

    setStatus("loading");
    setApiError("");

    try {
      const normalizedEmail = fields.email.toLowerCase().trim();
      const emailKey = emailToDocId(normalizedEmail);

      let registrationId: string | null = null;

      // Obtain reCAPTCHA v3 token
      const recaptchaToken = await getRecaptchaToken();

      // Attempt batched write
      try {
        const emailLockRef = doc(db, "registrationEmails", emailKey);
        const regRef = doc(collection(db, "registrations"));

        const registrationData = {
          name: fields.name.trim(),
          email: normalizedEmail,
          phone: fields.phone.trim(),
          whatsapp: fields.whatsapp.trim(),
          university: fields.university.trim(),
          year: fields.year,
          registeredAt: serverTimestamp(),
          attended: false,
          attendedAt: null,
          mealServed: false,
          mealServedAt: null,
          emailStatus: "pending",
          recaptchaToken: recaptchaToken,
        };

        const batch = writeBatch(db);

        // This will fail with permission-denied if the document already exists,
        // because the 'create' rule requires !exists() and 'update' is false.
        batch.set(emailLockRef, {
          email: normalizedEmail,
          registrationId: regRef.id,
          registeredAt: serverTimestamp(),
          recaptchaToken: recaptchaToken,
        });
        batch.set(regRef, registrationData);

        await batch.commit();
        registrationId = regRef.id;
      } catch (transactionErr: unknown) {
        const code = (transactionErr as { code?: string })?.code;
        console.error("Batch write failed:", code, transactionErr);
        if (code === "permission-denied") {
          setErrors({ email: "This email is already registered." });
          setStatus("error");
          return;
        }
        throw transactionErr;
      }

      // Only proceed if transaction succeeded and we have a valid ID
      if (!registrationId) {
        throw new Error("Registration created but ID is missing.");
      }

      // Use a proper DocumentReference for later updates (updateDoc expects this)
      const docRef = doc(db, "registrations", registrationId);

      // ── Send confirmation email ONLY if registration succeeded ────────────────────────────────────────
      let emailSent = false;
      try {
        await addDoc(collection(db, "mail"), {
          to: fields.email,
          message: {
            subject: "🎉 You're Registered for NEXA 2026!",
            html: buildRegistrationEmailHtml({ ...fields, id: docRef.id }),
          },
        });
        emailSent = true;
        console.log("Email queued successfully for:", fields.email);
      } catch (emailErr) {
        console.warn("Email queuing failed, flagged for retry:", emailErr);
      }

      // Update emailStatus based on whether email was queued successfully
      if (emailSent) {
        await updateDoc(docRef, { emailStatus: "sent" }).catch(() => {});
      }

      navigate("/ticket", { state: { ticket: { ...fields, id: docRef.id } } });
    } catch (err: unknown) {
      console.error("Registration workflow error:", err);
      const code = (err as { code?: string })?.code;
      const msg = `Something went wrong${code ? ` (${code})` : ""}. Please try again or contact nexa.acs.sjp@gmail.com`;
      setApiError(msg);
      setStatus("error");
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
        {/* reCAPTCHA error */}
        {recaptchaError && (
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <span className="material-symbols-outlined text-yellow-400 text-base mt-0.5">warning</span>
            <p className="text-yellow-400 text-sm">{recaptchaError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div className="flex flex-col gap-1.5">
            <Field
              label="Full Name"
              name="name"
              type="text"
              placeholder="e.g. Kasun Perera"
              value={fields.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.name}
            />
            <p className="text-[10px] sm:text-[11px] text-[#888] leading-tight flex items-start gap-1.5 -mt-0.5">
              <span className="material-symbols-outlined text-[#19D1E6] text-xs shrink-0 mt-0.5">info</span>
              Enter your proper full name as it appears on official documents. This exact name will be used when printing your certificate.
            </p>
          </div>
          <Field
            label="Email Address"
            name="email"
            type="email"
            placeholder="your@email.com"
            value={fields.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.email}
          />
          <Field
            label="Phone Number"
            name="phone"
            type="tel"
            placeholder="+94 71 234 5678"
            value={fields.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.phone}
          />
          <Field
            label="WhatsApp Number"
            name="whatsapp"
            type="tel"
            placeholder="+94 77 234 5678"
            value={fields.whatsapp}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.whatsapp}
          />
          <Field
            label="University / Institution"
            name="university"
            type="text"
            placeholder="University of Sri Jayewardenepura"
            value={fields.university}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.university}
          />

          {/* Year dropdown */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="year" className="text-xs font-semibold text-[#888] uppercase tracking-wider">
              Academic Year
            </label>
            <div className="relative">
              <select
                id="year"
                name="year"
                value={fields.year}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full bg-[#0e0e0e] border rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 transition-colors ${
                  errors.year
                    ? "border-red-500/50 focus:ring-red-500/20 text-white"
                    : "border-[#2a2a2a] focus:ring-[#19D1E6]/30 focus:border-[#19D1E6]/60"
                } ${!fields.year ? "text-[#444]" : "text-white"}`}
              >
                <option value="" disabled>
                  Select year
                </option>
                {YEARS.map((y) => (
                  <option key={y} value={y} className="text-white bg-[#1a1a1a]">
                    {y}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#555] text-base pointer-events-none">
                expand_more
              </span>
            </div>
            {errors.year && <p className="text-red-400 text-xs">{errors.year}</p>}
          </div>
        </div>

        {/* API error */}
        {apiError && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <span className="material-symbols-outlined text-red-400 text-base mt-0.5">error</span>
            <p className="text-red-400 text-sm">{apiError}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full py-4 px-6 bg-[#19D1E6] text-[#0e0e0e] font-bold rounded-xl hover:bg-[#19D1E6]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.01] flex items-center justify-center gap-2 text-sm tracking-wide"
        >
          {status === "loading" ? (
            <>
              <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
                />
              </svg>
              Registering…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-base">how_to_reg</span>
              Register for NEXA 2026
            </>
          )}
        </button>

        <p className="text-center text-xs text-[#444]">
          Your ticket QR code will appear instantly after submission and will also be emailed to you.
        </p>
      </form>
    </>
  );
}
