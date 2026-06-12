import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

const FEEDBACK_INBOX = "nexa.acs.sjp@gmail.com";

export type FeedbackPayload = {
  name: string;
  university: string;
  feedback: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildFeedbackEmailHtml({ name, university, feedback }: FeedbackPayload): string {
  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:24px;background:#0e0e0e;font-family:Arial,sans-serif;color:#ffffff;">
  <div style="max-width:560px;margin:0 auto;background:#161616;border:1px solid #2a2a2a;border-radius:16px;padding:24px;">
    <h1 style="margin:0 0 8px 0;font-size:20px;color:#19D1E6;">NEXA 2026 Event Feedback</h1>
    <p style="margin:0 0 20px 0;color:#888;font-size:13px;">Submitted via the feedback form</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:8px 0;color:#888;vertical-align:top;width:110px;">Name</td><td style="padding:8px 0;color:#fff;">${escapeHtml(name)}</td></tr>
      <tr><td style="padding:8px 0;color:#888;vertical-align:top;">University</td><td style="padding:8px 0;color:#fff;">${escapeHtml(university)}</td></tr>
      <tr><td style="padding:8px 0;color:#888;vertical-align:top;">Feedback</td><td style="padding:8px 0;color:#fff;white-space:pre-wrap;">${escapeHtml(feedback)}</td></tr>
    </table>
  </div>
</body>
</html>`;
}

async function queueFeedbackEmail(payload: FeedbackPayload): Promise<void> {
  await addDoc(collection(db, "mail"), {
    to: FEEDBACK_INBOX,
    message: {
      subject: `NEXA 2026 Feedback — ${payload.name}`,
      html: buildFeedbackEmailHtml(payload),
    },
  });
}

/** Store feedback in Firestore; fall back to email queue if rules are not deployed yet. */
export async function submitFeedback(payload: FeedbackPayload): Promise<void> {
  try {
    await addDoc(collection(db, "feedback"), {
      ...payload,
      submittedAt: serverTimestamp(),
    });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code !== "permission-denied") throw err;
    await queueFeedbackEmail(payload);
  }
}
