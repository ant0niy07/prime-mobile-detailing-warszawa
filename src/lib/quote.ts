import { z } from "zod";
import { business } from "../config/business";
import {
  vehicleSizes,
  dirtLevels,
  problemIds,
  packageIds,
  pricing,
  type CalculatorState,
} from "../config/pricing";
import { calculateEstimate } from "./pricing";
import type { Dictionary } from "../i18n";
export const sizes = vehicleSizes;
export const conditions = problemIds;
export const parkings = ["outdoor", "private", "garage", "other"] as const;
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const quoteSchema = (f: Dictionary["form"]) =>
  z
    .object({
      vehicle: z.string().trim().min(2, f.required).max(120, f.tooLong),
      size: z.enum(sizes, { error: f.required }),
      package: z.enum(packageIds, { error: f.required }),
      power: z.enum(["customer", "prime"], { error: f.required }),
      condition: z.enum(dirtLevels, { error: f.required }),
      problems: z.array(z.enum(problemIds)),
      district: z.string().trim().min(2, f.required).max(150, f.tooLong),
      address: z.string().trim().max(200, f.tooLong),
      parking: z.enum(parkings),
      serviceSpace: z.enum(["yes", "unsure"], { error: f.required }),
      date: z.string(),
      time: z.string().max(100, f.tooLong),
      flexible: z.boolean(),
      description: z.string().max(2000, f.tooLong),
      name: z.string().trim().min(2, f.required).max(100, f.tooLong),
      phone: z
        .string()
        .trim()
        .refine(
          (v) =>
            /^[+\d\s()-]+$/.test(v) &&
            v.replace(/\D/g, "").length >= 7 &&
            v.replace(/\D/g, "").length <= 15,
          f.phoneError,
        ),
      email: z
        .string()
        .trim()
        .max(254, f.tooLong)
        .refine((v) => !v || z.email().safeParse(v).success, f.emailError),
      contactMethod: z.enum(["whatsapp", "phone"]),
      consent: z.boolean().refine(Boolean, f.consentError),
    })
    .refine(
      (v) =>
        v.flexible ||
        (/^\d{4}-\d{2}-\d{2}$/.test(v.date) &&
          !Number.isNaN(Date.parse(v.date)) &&
          v.date >= today()),
      { path: ["date"], message: f.dateError },
    );
export type Quote = z.infer<ReturnType<typeof quoteSchema>>;
export const emptyQuote: Quote = {
  vehicle: "",
  size: "sedan",
  package: "plus",
  condition: "normal",
  power: "customer",
  problems: [],
  district: "",
  address: "",
  parking: "outdoor",
  serviceSpace: "unsure",
  date: "",
  time: "",
  flexible: false,
  description: "",
  name: "",
  phone: "",
  email: "",
  contactMethod: "whatsapp",
  consent: false,
};
export function formatEstimate(state: CalculatorState, t: Dictionary) {
  const e = calculateEstimate(state);
  const c = t.calculator;
  if (e.kind === "pending") return c.pending;
  if (e.kind === "individual") return c.individual;
  return e.kind === "range"
    ? `${c.estimate}: ${e.min}–${e.max} ${t.currency}`
    : `${c.minimum} ${e.min} ${t.currency}`;
}
export function summaryRows(
  q: Quote,
  t: Dictionary,
  count: number,
): [string, string][] {
  const f = t.form,
    c = t.calculator;
  return [
    [f.name, q.name],
    [f.phone, q.phone],
    ...(q.email ? [[f.email, q.email] as [string, string]] : []),
    [f.vehicle, q.vehicle],
    [c.size, c.sizes[sizes.indexOf(q.size)]],
    [f.package, business.packages.find((p) => p.id === q.package)!.name],
    [c.estimate, formatEstimate(q, t)],
    [c.condition, c.levels[dirtLevels.indexOf(q.condition)]],
    [
      c.problems,
      q.problems
        .map((v) => c.problemOptions[problemIds.indexOf(v)])
        .join(", ") || f.notProvided,
    ],
    [c.power, c.powerOptions[q.power === "customer" ? 0 : 1]],
    [f.district, q.district],
    [f.address, q.address || f.notProvided],
    [f.parking, f.parkingOptions[parkings.indexOf(q.parking)]],
    [f.serviceSpace, f.spaceOptions[q.serviceSpace === "yes" ? 0 : 1]],
    [
      f.date,
      [q.date, q.flexible ? f.flexible : ""].filter(Boolean).join(" • ") ||
        f.notProvided,
    ],
    [f.time, q.time || f.notProvided],
    [f.description, q.description || f.notProvided],
    [f.contactMethod, f.contactOptions[q.contactMethod === "whatsapp" ? 0 : 1]],
    [f.selectedPhotos, String(count)],
  ];
}
export function buildMessage(q: Quote, t: Dictionary, count: number) {
  return [
    t.form.messageTitle,
    "",
    ...summaryRows(q, t, count).map(([k, v]) => `${k}: ${v}`),
    "",
    t.calculator.note,
    t.form.messageEnd,
  ].join("\n");
}
export const whatsappLink = (message: string) =>
  `${business.whatsappUrl}?text=${encodeURIComponent(message)}`;
export function validatePhoto(
  file: File,
  count: number,
  t: Dictionary["form"],
) {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    !/\.(jpe?g|png|webp)$/i.test(file.name)
  )
    return t.typeError;
  if (file.size > pricing.photoBytes) return t.sizeError;
  if (count >= pricing.maxPhotos) return t.countError;
  return "";
}
export async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* Fall back to selected text. */
  }
  const active = document.activeElement as HTMLElement | null;
  const area = document.createElement("textarea");
  area.value = text;
  area.style.cssText = "position:fixed;left:-9999px;top:0";
  document.body.append(area);
  area.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    /* The UI also offers manual copy. */
  }
  area.remove();
  active?.focus();
  return copied;
}
