import prabodhaImage from "../assets/images/speakers/Prabodha.jpeg";

export interface Speaker {
  id: string;
  name: string;
  position: string;
  description: string;
  /** Omit or leave empty for a photo placeholder. */
  image?: string;
  /** When false, the card shows a “to be announced” state. Defaults to true. */
  announced?: boolean;
}

/**
 * NEXA 2026 speakers — update names, positions, photos, and descriptions here.
 */
export const SPEAKERS: Speaker[] = [
  {
    id: "prabodha",
    name: "Mr. Prabodha Lakshan",
    position: "Company Director & Social Media strategist",
    description:
      "World Biggest Marketplace - Social Media: Winning the Gen Z Audience in the Digital Era",
    image: prabodhaImage,
  },
  {
    id: "speaker-2",
    name: "To be announced soon",
    position: "",
    description: "",
    announced: false,
  },
  {
    id: "speaker-3",
    name: "To be announced soon",
    position: "",
    description: "",
    announced: false,
  },
  {
    id: "speaker-4",
    name: "To be announced soon",
    position: "",
    description: "",
    announced: false,
  },
];
