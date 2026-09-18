import { copyText, whatsappLink } from "./quote";
export type SubmissionPayload = { message: string; photos: File[] };
export type SubmissionResult =
  | { status: "handoff"; copied: boolean }
  | { status: "confirmed" }
  | { status: "unavailable" };
export interface QuoteSubmissionAdapter {
  mode: "whatsapp" | "api";
  submit: (payload: SubmissionPayload) => Promise<SubmissionResult>;
}
export const whatsappSubmission: QuoteSubmissionAdapter = {
  mode: "whatsapp",
  async submit({ message }) {
    const copied = await copyText(message);
    const a = document.createElement("a");
    a.href = whatsappLink(message);
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.append(a);
    a.click();
    a.remove();
    return { status: "handoff", copied };
  },
};
/** Future secure backend adapter. Only an explicit acknowledged server response can produce success. */
export function apiSubmission(
  send?: (payload: SubmissionPayload) => Promise<{ confirmed: boolean }>,
): QuoteSubmissionAdapter {
  return {
    mode: "api",
    async submit(payload) {
      if (!send) return { status: "unavailable" };
      const result = await send(payload);
      if (!result.confirmed) throw new Error("Submission not acknowledged");
      return { status: "confirmed" };
    },
  };
}
export function canSharePhotos(files: File[]) {
  try {
    return (
      files.length > 0 && !!navigator.share && !!navigator.canShare?.({ files })
    );
  } catch {
    return false;
  }
}
/** Transfers actual files to the user's chosen app; this is not a delivery receipt. */
export async function sharePhotos(
  payload: SubmissionPayload,
): Promise<"shared" | "cancelled" | "unavailable"> {
  if (!canSharePhotos(payload.photos)) return "unavailable";
  try {
    await navigator.share({ files: payload.photos, text: payload.message });
    return "shared";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      return "cancelled";
    throw error;
  }
}
// Without a configured private lead backend, WhatsApp remains the submission destination.
export const quoteSubmissionAdapter = whatsappSubmission;
