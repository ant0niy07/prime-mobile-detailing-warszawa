import seo from "./seo.json";
import { pricing } from "./pricing";
export const business = {
  name: "Prime Mob Detail",
  logo: "PRIME",
  descriptor: "MOB DETAIL / WARSZAWA",
  phone: "+48 690 747 691",
  telephoneUrl: "tel:+48690747691",
  whatsappNumber: "48690747691",
  whatsappUrl: "https://wa.me/48690747691",
  facebook: "https://www.facebook.com/profile.php?id=61594147304659",
  developer: "https://instagram.com/ant0niy07",
  signature: "Designed & Developed by @ant0niy07",
  area: {
    pl: "Warszawa i okolice",
    en: "Warsaw and nearby areas",
    ru: "Варшава и окрестности",
  },
  districts: [
    "Mokotów",
    "Wilanów",
    "Ursynów",
    "Wola",
    "Śródmieście",
    "Żoliborz",
    "Praga",
    "Bemowo",
  ],
  packages: pricing.packages,
  siteUrl: (import.meta.env.VITE_SITE_URL || seo.fallbackUrl).replace(
    /\/$/,
    "",
  ),
  // Owner must supply and verify these before public launch. Never render invented legal details.
  legal: {
    controllerName: "",
    registrationNumber: "",
    address: "",
    privacyContact: "",
  },
} as const;
export type Lang = "pl" | "en" | "ru";
