import hashanImage from "../assets/images/committee/hashan.jpg";
import niluniImage from "../assets/images/committee/niluni.jpg";
import vikumImage from "../assets/images/committee/vikum.jpg";
import banulaImage from "../assets/images/committee/banula.jpg";
import poornaImage from "../assets/images/committee/poorna.jpg";
import praveenImage from "../assets/images/committee/praveen.jpg";
import thiranImage from "../assets/images/committee/thiran.jpg";
import rumethImage from "../assets/images/committee/rumeeth.jpg";

export type CommitteeMember = {
  name: string;
  role: string;
  image: string;
};

export const COMMITTEE: CommitteeMember[] = [
  { name: "Hashan Hirantha", role: "Chairperson", image: hashanImage },
  { name: "Niluni Sandunika", role: "Secretary", image: niluniImage },
  { name: "Vikum Deshan", role: "Design Team Head", image: vikumImage },
  { name: "Banula Bimsara", role: "Technical Team Head", image: banulaImage },
  { name: "Poorna Sachinthana", role: "Finance Team Head", image: poornaImage },
  { name: "Praveen Seneviratne", role: "Programming Team Head", image: praveenImage },
  { name: "Thiran Ranathunga", role: "Marketing Team Head", image: thiranImage },
  { name: "Rumeth Sathnidu", role: "HR & Logistics Team Head", image: rumethImage },
];
