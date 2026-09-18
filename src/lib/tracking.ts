import type { PackageId } from "../config/pricing";
export type TrackingEvents = {
  select_vehicle_size: { size: "small" | "sedan" | "suv" | "large" | "van" };
  select_power_option: { power: "customer" | "prime" };
  family_pet_click: undefined;
  fleet_lead_start: undefined;
  fleet_lead_submit: undefined;
  view_blog_post: { id: string };
  view_pricing: undefined;
  select_package: { package: PackageId };
  start_calculator: undefined;
  calculator_complete: { kind: "minimum" | "range" | "individual" };
  start_quote: { package?: PackageId };
  upload_photos: { count: number };
  submit_quote: { mode: "whatsapp" };
  click_phone: undefined;
  click_whatsapp: undefined;
  click_facebook: undefined;
  change_language: { language: "pl" | "en" | "ru" };
};
export type TrackingProvider = (
  event: keyof TrackingEvents,
  properties: Record<string, string | number>,
) => void;
let provider: TrackingProvider | undefined;
let consent = false;
/** Configure a provider only after adding its consent UI and updating privacy copy. No scripts loaded here. */
export function configureTracking(next?: TrackingProvider) {
  provider = next;
}
export function setTrackingConsent(allowed: boolean) {
  consent = allowed;
}
export function track<K extends keyof TrackingEvents>(
  event: K,
  ...args: TrackingEvents[K] extends undefined ? [] : [TrackingEvents[K]]
) {
  if (!provider || !consent) return;
  // Runtime allow-list prevents accidental free text / identifiers reaching future adapters.
  const source = (args[0] || {}) as Record<string, unknown>;
  const safe: Record<string, string | number> = {};
  if (event === "select_package" || event === "start_quote") {
    if (["basic", "plus", "premium", "family"].includes(String(source.package)))
      safe.package = String(source.package);
  }
  if (
    event === "calculator_complete" &&
    ["minimum", "range", "individual"].includes(String(source.kind))
  )
    safe.kind = String(source.kind);
  if (event === "upload_photos" && Number.isInteger(source.count))
    safe.count = Math.max(0, Math.min(5, Number(source.count)));
  if (
    event === "select_vehicle_size" &&
    ["small", "sedan", "suv", "large", "van"].includes(String(source.size))
  )
    safe.size = String(source.size);
  if (
    event === "select_power_option" &&
    ["customer", "prime"].includes(String(source.power))
  )
    safe.power = String(source.power);
  if (
    event === "view_blog_post" &&
    typeof source.id === "string" &&
    /^[0-9a-f-]{36}$/i.test(source.id)
  )
    safe.id = source.id;
  if (event === "submit_quote") safe.mode = "whatsapp";
  if (
    event === "change_language" &&
    ["pl", "en", "ru"].includes(String(source.language))
  )
    safe.language = String(source.language);
  try {
    provider(event, safe);
  } catch {
    /* An optional provider must never interrupt an enquiry. */
  }
}
