import { describe, it, expect, vi, afterEach } from "vitest";
import { canSharePhotos, sharePhotos } from "../lib/submission";

describe("real photo handoff", () => {
  afterEach(() => vi.unstubAllGlobals());
  const photos = [new File(["photo"], "seat.jpg", { type: "image/jpeg" })];
  it("passes the selected files and message to the chosen application", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { canShare: () => true, share });
    expect(await sharePhotos({ photos, message: "PRIME enquiry" })).toBe(
      "shared",
    );
    expect(share).toHaveBeenCalledWith({
      files: photos,
      text: "PRIME enquiry",
    });
  });
  it("keeps cancellation distinct from successful handoff", async () => {
    vi.stubGlobal("navigator", {
      canShare: () => true,
      share: vi
        .fn()
        .mockRejectedValue(new DOMException("Cancelled", "AbortError")),
    });
    expect(await sharePhotos({ photos, message: "Enquiry" })).toBe("cancelled");
    expect(photos).toHaveLength(1);
  });
  it("does not claim file transfer on unsupported browsers", async () => {
    vi.stubGlobal("navigator", {});
    expect(canSharePhotos(photos)).toBe(false);
    expect(await sharePhotos({ photos, message: "Enquiry" })).toBe(
      "unavailable",
    );
  });
  it("propagates failures so the form can offer manual attachment", async () => {
    vi.stubGlobal("navigator", {
      canShare: () => true,
      share: vi.fn().mockRejectedValue(new Error("Failed")),
    });
    await expect(sharePhotos({ photos, message: "Enquiry" })).rejects.toThrow(
      "Failed",
    );
  });
});
