import { emptyQuote, parkings, type Quote } from "./quote";
import {
  packageIds,
  vehicleSizes,
  dirtLevels,
  problemIds,
} from "../config/pricing";
import { CALCULATOR_KEY } from "./pricing";
export const DRAFT_KEY = "prime.quote.v2";
const LEGACY_KEY = "prime.quote.v1";
const TTL = 7 * 24 * 60 * 60 * 1000;
export function saveDraft(data: Quote) {
  try {
    if (
      JSON.stringify({ ...data, consent: false }) === JSON.stringify(emptyQuote)
    ) {
      localStorage.removeItem(DRAFT_KEY);
      return;
    }
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        expires: Date.now() + TTL,
        data: { ...data, consent: false },
      }),
    );
  } catch {
    /* Optional storage. */
  }
}
export function clearDraft() {
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event("prime:clear-draft"));
  try {
    for (const key of [DRAFT_KEY, LEGACY_KEY, CALCULATOR_KEY])
      localStorage.removeItem(key);
  } catch {
    /* No persistent data in unavailable storage. */
  }
}
export function loadDraft(): Quote {
  try {
    const saved = JSON.parse(
      localStorage.getItem(DRAFT_KEY) ||
        localStorage.getItem(LEGACY_KEY) ||
        "null",
    );
    if (
      !saved ||
      typeof saved.expires !== "number" ||
      saved.expires < Date.now()
    ) {
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(LEGACY_KEY);
      return { ...emptyQuote };
    }
    const d = saved.data,
      q = { ...emptyQuote };
    const limits = {
      vehicle: 120,
      district: 150,
      address: 200,
      date: 10,
      time: 100,
      description: 2000,
      name: 100,
      phone: 30,
      email: 254,
    };
    for (const key of Object.keys(limits) as Array<keyof typeof limits>)
      if (typeof d[key] === "string") q[key] = d[key].slice(0, limits[key]);
    if (packageIds.includes(d.package)) q.package = d.package;
    if (vehicleSizes.includes(d.size)) q.size = d.size;
    else if (d.size === "estate") q.size = "sedan";
    if (dirtLevels.includes(d.condition)) q.condition = d.condition;
    else if (d.conditions?.includes("heavy")) q.condition = "heavy";
    if (parkings.includes(d.parking)) q.parking = d.parking;
    q.problems = (
      Array.isArray(d.problems)
        ? d.problems
        : Array.isArray(d.conditions)
          ? d.conditions
          : []
    ).filter((v: unknown) =>
      problemIds.includes(v as (typeof problemIds)[number]),
    );
    q.power = d.power === "prime" ? "prime" : "customer";
    q.serviceSpace = d.serviceSpace === "yes" ? "yes" : "unsure";
    q.flexible = d.flexible === true;
    q.contactMethod = d.contactMethod === "phone" ? "phone" : "whatsapp";
    localStorage.removeItem(LEGACY_KEY);
    return q;
  } catch {
    return { ...emptyQuote };
  }
}
export function persistLanguage(lang: string) {
  try {
    localStorage.setItem("prime.language", lang);
  } catch {
    /* Routes still work. */
  }
}
