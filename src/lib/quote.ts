import { z } from "zod";
import { business } from "../config/business";
import type { Dictionary } from "../i18n";
export const sizes = ["small", "sedan", "estate", "suv", "van"] as const;
export const conditions = [
  "regular",
  "visible",
  "heavy",
  "stains",
  "hair",
  "odour",
  "fabric",
  "leather",
  "mixed",
] as const;
export const parkings = ["outdoor", "private", "garage", "other"] as const;
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const quoteSchema = (t: Dictionary["form"]) =>
  z
    .object({
      vehicle: z.string().trim().min(2, t.required).max(120, t.tooLong),
      size: z.enum(sizes, { error: t.required }),
      package: z.enum(["basic", "plus", "premium", "help"], {
        error: t.required,
      }),
      conditions: z.array(z.enum(conditions)).min(1, t.required),
      district: z.string().trim().min(2, t.required).max(150, t.tooLong),
      address: z.string().trim().max(200, t.tooLong),
      parking: z.enum(parkings, { error: t.required }),
      date: z.string(),
      time: z.string().max(100, t.tooLong),
      flexible: z.boolean(),
      description: z.string().max(2000, t.tooLong),
      name: z.string().trim().min(2, t.required).max(100, t.tooLong),
      phone: z
        .string()
        .trim()
        .refine(
          (v) =>
            /^[+\d\s()-]+$/.test(v) &&
            v.replace(/\D/g, "").length >= 7 &&
            v.replace(/\D/g, "").length <= 15,
          t.phoneError,
        ),
      contactMethod: z.enum(["whatsapp", "phone"]),
      consent: z.boolean().refine(Boolean, t.consentError),
    })
    .refine((v) => v.flexible || (!!v.date && v.date >= today()), {
      path: ["date"],
      message: t.dateError,
    });
export type Quote = z.infer<ReturnType<typeof quoteSchema>>;
export const emptyQuote: Quote = {
  vehicle: "",
  size: "sedan",
  package: "help",
  conditions: [],
  district: "",
  address: "",
  parking: "outdoor",
  date: "",
  time: "",
  flexible: false,
  description: "",
  name: "",
  phone: "",
  contactMethod: "whatsapp",
  consent: false,
};
export function summaryRows(
  q: Quote,
  t: Dictionary,
  count: number,
): [string, string][] {
  const f = t.form;
  return [
    [f.name, q.name],
    [f.phone, q.phone],
    [f.vehicle, q.vehicle],
    [f.size, f.sizes[sizes.indexOf(q.size)]],
    [
      f.package,
      business.packages.find((p) => p.id === q.package)?.name || f.help,
    ],
    [
      f.conditions,
      q.conditions
        .map((c) => f.conditionOptions[conditions.indexOf(c)])
        .join(", "),
    ],
    [f.district, q.district],
    [f.address, q.address || f.notProvided],
    [f.parking, f.parkingOptions[parkings.indexOf(q.parking)]],
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
  if (file.size > 8 * 1024 * 1024) return t.sizeError;
  if (count >= 8) return t.countError;
  return "";
}
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* Try the local fallback. */
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
    /* Manual copy stays available. */
  }
  area.remove();
  active?.focus();
  return copied;
}
