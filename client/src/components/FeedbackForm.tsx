import { useState } from "react";
import { submitFeedback } from "../lib/submitFeedback";

interface FormFields {
  name: string;
  university: string;
  feedback: string;
}

type FieldErrors = Partial<Record<keyof FormFields, string>>;

const EMPTY: FormFields = {
  name: "",
  university: "",
  feedback: "",
};

function validate(f: FormFields): FieldErrors {
  const e: FieldErrors = {};

  if (!f.name.trim() || f.name.trim().length < 2)
    e.name = "Name must be at least 2 characters.";

  if (!f.university.trim())
    e.university = "University is required.";

  if (!f.feedback.trim())
    e.feedback = "Feedback is required.";

  return e;
}

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
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onBlur: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  error?: string;
}) {
  const sharedClass = `w-full bg-[#0e0e0e] text-white border rounded-xl px-4 py-3 text-sm placeholder-[#444] focus:outline-none focus:ring-2 transition-colors ${
    error
      ? "border-red-500/50 focus:ring-red-500/20"
      : "border-[#2a2a2a] focus:ring-[#19D1E6]/30 focus:border-[#19D1E6]/60"
  }`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-xs font-semibold text-[#888] uppercase tracking-wider">
        {label}
      </label>
      {type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          rows={5}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`${sharedClass} resize-y min-h-[120px]`}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete="off"
          className={sharedClass}
        />
      )}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

type FeedbackFormProps = {
  onSuccess: () => void;
};

export default function FeedbackForm({ onSuccess }: FeedbackFormProps) {
  const [fields, setFields] = useState<FormFields>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormFields, boolean>>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [apiError, setApiError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    const next = { ...fields, [name]: value };
    setFields(next);
    if (touched[name as keyof FormFields]) {
      const errs = validate(next);
      setErrors((prev) => ({ ...prev, [name]: errs[name as keyof FormFields] }));
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
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
      await submitFeedback({
        name: fields.name.trim(),
        university: fields.university.trim(),
        feedback: fields.feedback.trim(),
      });
      setFields(EMPTY);
      setTouched({});
      setErrors({});
      setStatus("idle");
      onSuccess();
    } catch (err: unknown) {
      console.error("Feedback submission error:", err);
      const code = (err as { code?: string })?.code;
      setApiError(
        code === "permission-denied"
          ? "Unable to submit feedback right now. Please try again later."
          : "Something went wrong. Please try again."
      );
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
      <Field
        label="Name"
        name="name"
        type="text"
        placeholder="e.g. Kasun Perera"
        value={fields.name}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.name}
      />
      <Field
        label="University"
        name="university"
        type="text"
        placeholder="University of Sri Jayewardenepura"
        value={fields.university}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.university}
      />
      <Field
        label="Feedback"
        name="feedback"
        type="textarea"
        placeholder="Share your thoughts about NEXA 2026…"
        value={fields.feedback}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.feedback}
      />

      {apiError && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <span className="material-symbols-outlined text-red-400 text-base mt-0.5">error</span>
          <p className="text-red-400 text-sm">{apiError}</p>
        </div>
      )}

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
            Submitting…
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-base">send</span>
            Submit Feedback
          </>
        )}
      </button>
    </form>
  );
}
