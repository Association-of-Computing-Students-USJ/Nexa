import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { EVENT_DATE } from "../data/eventInfo";
import { buildWhatsAppCommunityEmailBlock } from "../lib/whatsappCommunity";

// ─── Constants ────────────────────────────────────────────────────────────────

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

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

// ─── Email HTML builder ───────────────────────────────────────────────────────

function buildEmailHtml(t: TicketData): string {
  const shortId = t.id.slice(0, 8).toUpperCase();
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=19D1E6&bgcolor=0e0e0e&data=NEXA-2026-${t.id}&format=png`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0e0e;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#161616;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">

    <div style="height:4px;background:linear-gradient(90deg,#19D1E6,#0ea5e9,#19D1E6)"></div>

    <div style="padding:40px 40px 24px;text-align:center;">
      <div style="display:inline-block;padding:6px 18px;border-radius:999px;background:rgba(25,209,230,0.12);border:1px solid rgba(25,209,230,0.25);margin-bottom:20px;">
        <span style="color:#19D1E6;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">✓ Registration Confirmed</span>
      </div>
      <h1 style="color:#ffffff;font-size:26px;font-weight:700;margin:0 0 8px 0;">Welcome to NEXA 2026!</h1>
      <p style="color:#888888;font-size:15px;margin:0;">Hi <strong style="color:#fff">${t.name}</strong>, your spot is secured.</p>
    </div>

    <div style="margin:0 32px;border-top:1px dashed #2a2a2a;"></div>

    <div style="padding:24px 40px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:7px 0;color:#555;font-size:11px;text-transform:uppercase;letter-spacing:1px;width:42%;">Ticket ID</td>
            <td style="padding:7px 0;color:#19D1E6;font-family:monospace;font-size:14px;font-weight:700;">${shortId}</td></tr>
        <tr><td style="padding:7px 0;color:#555;font-size:11px;text-transform:uppercase;letter-spacing:1px;">University</td>
            <td style="padding:7px 0;color:#fff;font-size:14px;">${t.university}</td></tr>
        <tr><td style="padding:7px 0;color:#555;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Year</td>
            <td style="padding:7px 0;color:#fff;font-size:14px;">${t.year}</td></tr>
        <tr><td style="padding:7px 0;color:#555;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Event Date</td>
            <td style="padding:7px 0;color:#fff;font-size:14px;">${EVENT_DATE}</td></tr>
        <tr><td style="padding:7px 0;color:#555;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Venue</td>
            <td style="padding:7px 0;color:#fff;font-size:14px;">USJP, Sri Lanka</td></tr>
        <tr><td style="padding:7px 0;color:#555;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Access</td>
            <td style="padding:7px 0;color:#fff;font-size:14px;">All-Access Pass</td></tr>
      </table>
    </div>

    <div style="margin:0 32px;border-top:1px dashed #2a2a2a;"></div>

    <div style="padding:28px 40px;text-align:center;">
      <p style="color:#888;font-size:13px;margin:0 0 16px 0;">Scan this QR code at the venue entrance:</p>
      <img src="${qrUrl}" width="160" height="160" alt="NEXA 2026 Ticket QR Code"
           style="border-radius:12px;border:1px solid #2a2a2a;display:block;margin:0 auto;" />
      <p style="color:#555;font-size:11px;font-family:monospace;margin:10px 0 0 0;">${shortId}</p>
    </div>

    <div style="margin:0 32px 0;border-top:1px dashed #2a2a2a;"></div>

    ${buildWhatsAppCommunityEmailBlock()}

    <div style="margin:0 32px 0;border-top:1px dashed #2a2a2a;"></div>

    <div style="padding:24px 40px 32px;background:#111;text-align:center;">
      <p style="color:#555;font-size:13px;margin:0 0 4px 0;">Questions? Reach us at</p>
      <a href="mailto:nexa.acs.sjp@gmail.com" style="color:#19D1E6;font-size:13px;text-decoration:none;">nexa.acs.sjp@gmail.com</a>
      <p style="color:#333;font-size:11px;margin:20px 0 0 0;">© 2026 NEXA · ACS SJP. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
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

    setStatus("loading");
    setApiError("");

    try {
      // ── Email uniqueness check ────────────────────────────────────────────
      try {
        const emailQuery = query(
          collection(db, "registrations"),
          where("email", "==", fields.email.toLowerCase().trim())
        );
        const emailSnap = await getDocs(emailQuery);
        if (!emailSnap.empty) {
          setErrors({ email: "This email is already registered." });
          setStatus("error");
          return;
        }
      } catch {
        // If read is denied by Firestore rules, proceed — the write-side
        // uniqueness constraint (or rules) will be the final enforcement.
      }

      // ── Save registration document ─────────────────────────────────────
      const docRef = await addDoc(collection(db, "registrations"), {
        ...fields,
        email: fields.email.toLowerCase().trim(),
        registeredAt: serverTimestamp(),
        attended: false,
        attendedAt: null,
        mealServed: false,
        mealServedAt: null,
        emailStatus: "pending",
      });

      // ── Send confirmation email ────────────────────────────────────────
      let emailSent = false;
      try {
        await addDoc(collection(db, "mail"), {
          to: fields.email,
          message: {
            subject: "🎉 You're Registered for NEXA 2026!",
            html: buildEmailHtml({ ...fields, id: docRef.id }),
          },
        });
        emailSent = true;
      } catch (emailErr) {
        console.warn("Email queuing failed, flagged for retry:", emailErr);
      }

      // Update emailStatus based on whether email was queued successfully
      if (emailSent) {
        await updateDoc(docRef, { emailStatus: "sent" }).catch(() => {});
      }

      navigate("/ticket", { state: { ticket: { ...fields, id: docRef.id } } });
    } catch (err: unknown) {
      console.error("Registration error:", err);
      const code = (err as { code?: string })?.code;
      const msg =
        code === "permission-denied"
          ? "Permission denied — Firestore rules are blocking this write. Please update your Firebase security rules."
          : `Something went wrong${code ? ` (${code})` : ""}. Please try again or contact nexa.acs.sjp@gmail.com`;
      setApiError(msg);
      setStatus("error");
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
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
          <Field
            label="Email Address"
            name="email"
            type="email"
            placeholder="you@university.ac.lk"
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
