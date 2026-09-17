import seo from "./seo.json";
export const business = {
  name: "PRIME Mobile Detailing",
  logo: "PRIME",
  descriptor: "Mobile Detailing Warszawa",
  phone: "+48 690 747 691",
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
  packages: [
    { id: "basic", name: "BASIC", price: 199 },
    { id: "plus", name: "BASIC PLUS", price: 299 },
    { id: "premium", name: "PREMIUM", price: 449 },
  ],
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
