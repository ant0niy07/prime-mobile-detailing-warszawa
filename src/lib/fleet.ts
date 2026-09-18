import { z } from "zod";
export const fleetSchema = z.object({
  company: z.string().trim().min(2).max(200),
  taxId: z.string().regex(/^$|^\d{10}$/),
  contact: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .regex(/^[+\d\s()-]+$/)
    .refine(
      (s) =>
        s.replace(/\D/g, "").length >= 7 && s.replace(/\D/g, "").length <= 15,
    ),
  email: z.email().max(254),
  count: z.coerce.number().int().min(1).max(10000),
  types: z.string().trim().min(2).max(500),
  location: z.string().trim().min(2).max(300),
  frequency: z.enum(["once", "regular", "monthly", "quarterly"]),
  scope: z.string().trim().min(5).max(2000),
  power: z.enum(["yes", "no", "unsure"]),
  message: z.string().max(2000),
  consent: z.literal(true),
  website: z.literal(""),
});
