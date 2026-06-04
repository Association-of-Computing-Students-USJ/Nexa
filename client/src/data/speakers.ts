import prabodhaImage from "../assets/images/speakers/Prabodha.jpeg";
import kosalaImage from "../assets/images/speakers/Kosala.jpeg";
import tharakaImage from "../assets/images/speakers/Tharaka.jpeg";

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
    id: "kosala",
    name: "Mr. Kosala Jayasekara",
    position: "CTO @ Fixel Digital & Olee.ai",
    description: "Skills of Project Management",
    image: kosalaImage,
  },
  {
    id: "tharaka",
    name: "Mr. Tharaka Mahabage",
    position: "Cybersecurity architect/educator",
    description:
      "The AI Identity Crisis: From Social Media Footprints to Deep Fake Deception",
    image: tharakaImage,
  },
  {
    id: "speaker-4",
    name: "To be announced soon",
    position: "",
    description: "",
    announced: false,
  },
];
