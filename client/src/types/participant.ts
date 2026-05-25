import type { Timestamp } from "firebase/firestore";

export interface Participant {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  university: string;
  year: string;
  registeredAt: Timestamp | null;
  attended: boolean;
  attendedAt: Timestamp | null;
  mealServed: boolean;
  mealServedAt: Timestamp | null;
  emailStatus?: "sent" | "pending";
}

/** Scanner / manual search subset (no registration-only fields required). */
export type ParticipantScan = Pick<
  Participant,
  | "id"
  | "name"
  | "email"
  | "phone"
  | "university"
  | "year"
  | "attended"
  | "attendedAt"
  | "mealServed"
  | "mealServedAt"
>;
