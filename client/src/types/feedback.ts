import type { Timestamp } from "firebase/firestore";

export interface FeedbackEntry {
  id: string;
  name: string;
  university: string;
  feedback: string;
  submittedAt: Timestamp | null;
}
