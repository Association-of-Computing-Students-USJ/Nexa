import achLogo from "../assets/images/sponsors/ACH LOGO ORIGINAL Updated.png";
import hackSlLogo from "../assets/images/sponsors/HackSL.png";
import greenGiftLogo from "../assets/images/sponsors/GreenGift.png";

export type Sponsor = {
  name: string;
  role: string;
  logo: string;
};

export const TITLE_SPONSOR: Sponsor = {
  name: "ACH Education PVT LTD",
  role: "Title Sponsor",
  logo: achLogo,
};

export const PARTNER_SPONSORS: Sponsor[] = [
  { name: "Hack SL", role: "Digital Media Partner", logo: hackSlLogo },
  { name: "Green Gifts by Startup Hub", role: "Gift Partner", logo: greenGiftLogo },
];
