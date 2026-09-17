import { emptyQuote, sizes, parkings, conditions, type Quote } from "./quote";
export const DRAFT_KEY = "prime.quote.v1";
const TTL = 7 * 24 * 60 * 60 * 1000;
export function saveDraft(data: Quote) {
  if (
    JSON.stringify({ ...data, consent: false }) === JSON.stringify(emptyQuote)
  ) {
    clearDraft();
    return;
  }
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        expires: Date.now() + TTL,
        data: { ...data, consent: false },
      }),
    );
  } catch {
    /* Storage is optional. */
  }
}
export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* Storage may be disabled. */
  }
}
export function loadDraft(): Quote {
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    if (
      !saved ||
      typeof saved.expires !== "number" ||
      saved.expires < Date.now()
    ) {
      clearDraft();
      return { ...emptyQuote };
    }
    const q = { ...emptyQuote };
    const d = saved.data;
    for (const key of [
      "vehicle",
      "district",
      "address",
      "date",
      "time",
      "description",
      "name",
      "phone",
    ] as const)
      if (typeof d[key] === "string") q[key] = d[key].slice(0, 2000);
    if (sizes.includes(d.size)) q.size = d.size;
    if (parkings.includes(d.parking)) q.parking = d.parking;
    if (["basic", "plus", "premium", "help"].includes(d.package))
      q.package = d.package;
    if (Array.isArray(d.conditions))
      q.conditions = d.conditions.filter((c: (typeof conditions)[number]) =>
        conditions.includes(c),
      );
    q.flexible = d.flexible === true;
    q.contactMethod = d.contactMethod === "phone" ? "phone" : "whatsapp";
    return q;
  } catch {
    clearDraft();
    return { ...emptyQuote };
  }
}
export function persistLanguage(lang: string) {
  try {
    localStorage.setItem("prime.language", lang);
  } catch {
    /* Language still works through routes. */
  }
}
