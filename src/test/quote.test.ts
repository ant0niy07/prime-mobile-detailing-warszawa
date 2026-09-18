import { describe, it, expect, vi } from "vitest";
import { dictionaries } from "../i18n";
import { business } from "../config/business";
import {
  buildMessage,
  copyText,
  emptyQuote,
  quoteSchema,
  summaryRows,
  validatePhoto,
  whatsappLink,
  type Quote,
} from "../lib/quote";
import { clearDraft, DRAFT_KEY, loadDraft, saveDraft } from "../lib/draft";
const q: Quote = {
  ...emptyQuote,
  vehicle: "Toyota Corolla",
  district: "Mokotów",
  name: "Anna",
  phone: "+48 600 111 222",
  problems: ["hair", "stains"],
  flexible: true,
  consent: true,
};
describe("quote and message", () => {
  it("requires contact, vehicle, condition, location and acknowledgement", () => {
    const parsed = quoteSchema(dictionaries.pl.form).safeParse(emptyQuote);
    expect(parsed.success).toBe(false);
    if (!parsed.success)
      expect(parsed.error.issues.map((i) => i.path[0])).toEqual(
        expect.arrayContaining([
          "vehicle",
          "district",
          "name",
          "phone",
          "consent",
          "date",
        ]),
      );
  });
  it("accepts a flexible date and rejects past dates and malformed phone", () => {
    expect(quoteSchema(dictionaries.en.form).safeParse(q).success).toBe(true);
    expect(
      quoteSchema(dictionaries.en.form).safeParse({
        ...q,
        flexible: false,
        date: "2000-01-01",
      }).success,
    ).toBe(false);
    expect(
      quoteSchema(dictionaries.en.form).safeParse({
        ...q,
        phone: "abc123456789",
      }).success,
    ).toBe(false);
  });
  it.each(["pl", "en", "ru"] as const)(
    "generates a complete %s message with the verified destination",
    (lang) => {
      const t = dictionaries[lang];
      const message = buildMessage(q, t, 3);
      expect(message).toContain(t.form.messageTitle);
      expect(message).toContain(`${t.form.selectedPhotos}: 3`);
      expect(message).toContain(t.calculator.problemOptions[0]);
      expect(message).toContain(q.phone);
      expect(message).toContain("BASIC PLUS");
      expect(whatsappLink(message)).toBe(
        `https://wa.me/48690747691?text=${encodeURIComponent(message)}`,
      );
      expect(summaryRows(q, t, 3)).toHaveLength(18);
    },
  );
  it("uses the exact centralized starting prices", () => {
    expect(business.packages.map((p) => p.price)).toEqual([249, 349, 499, 649]);
  });
});
describe("safe photo selection", () => {
  it("accepts JPEG PNG and WebP", () => {
    for (const [type, ext] of [
      ["image/jpeg", "jpg"],
      ["image/png", "png"],
      ["image/webp", "webp"],
    ])
      expect(
        validatePhoto(
          new File(["x"], `a.${ext}`, { type }),
          0,
          dictionaries.pl.form,
        ),
      ).toBe("");
  });
  it("rejects SVG and mismatched extensions", () => {
    expect(
      validatePhoto(
        new File(["x"], "a.svg", { type: "image/svg+xml" }),
        0,
        dictionaries.en.form,
      ),
    ).toBe(dictionaries.en.form.typeError);
    expect(
      validatePhoto(
        new File(["x"], "a.html", { type: "image/png" }),
        0,
        dictionaries.en.form,
      ),
    ).toBe(dictionaries.en.form.typeError);
  });
  it("rejects oversized images and a sixth image", () => {
    const file = new File(["x"], "a.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 8 * 1024 * 1024 + 1 });
    expect(validatePhoto(file, 0, dictionaries.pl.form)).toBe(
      dictionaries.pl.form.sizeError,
    );
    expect(
      validatePhoto(
        new File(["x"], "a.png", { type: "image/png" }),
        5,
        dictionaries.pl.form,
      ),
    ).toBe(dictionaries.pl.form.countError);
  });
});
describe("local draft", () => {
  it("preserves data without consent and clears explicitly", () => {
    saveDraft(q);
    expect(loadDraft()).toEqual({ ...q, consent: false });
    clearDraft();
    expect(loadDraft()).toEqual(emptyQuote);
  });
  it("ignores corrupt, expired and invalid stored fields", () => {
    localStorage.setItem(DRAFT_KEY, "broken");
    expect(loadDraft()).toEqual(emptyQuote);
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ expires: 1, data: q }));
    expect(loadDraft()).toEqual(emptyQuote);
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        expires: Date.now() + 99999,
        data: { ...q, size: "bad", problems: ["hair", "wrong"] },
      }),
    );
    expect(loadDraft().size).toBe("sedan");
    expect(loadDraft().problems).toEqual(["hair"]);
  });
});
describe("clipboard", () => {
  it("copies with the Clipboard API", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    expect(await copyText("hello")).toBe(true);
    expect(writeText).toHaveBeenCalledWith("hello");
  });
  it("falls back if permission is denied and restores focus", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: vi.fn(() => true),
    });
    const button = document.createElement("button");
    document.body.append(button);
    button.focus();
    expect(await copyText("hello")).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(document.activeElement).toBe(button);
    button.remove();
  });
  it("returns false when no copy method is available", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: undefined,
    });
    expect(await copyText("hello")).toBe(false);
    expect(document.querySelector("textarea")).toBeNull();
  });
});
