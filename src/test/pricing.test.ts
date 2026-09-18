import { describe, it, expect, vi, afterEach } from "vitest";
import {
  calculateEstimate,
  recommendPackage,
  readCalculator,
  saveCalculator,
} from "../lib/pricing";
import { pricing, type CalculatorState } from "../config/pricing";
import { apiSubmission } from "../lib/submission";
import { configureTracking, setTrackingConsent, track } from "../lib/tracking";
const state: CalculatorState = {
  package: "basic",
  size: "small",
  condition: "normal",
  power: "customer",
  problems: [],
};
describe("transparent estimates", () => {
  it.each([
    ["basic", "small", "customer", 249],
    ["basic", "small", "prime", 399],
    ["plus", "sedan", "prime", 499],
    ["premium", "sedan", "customer", 549],
    ["premium", "sedan", "prime", 619],
    ["family", "small", "prime", 649],
  ] as const)(
    "business example %s/%s/%s = %i",
    (packageId, size, power, expected) => {
      expect(
        calculateEstimate({ ...state, package: packageId, size, power }),
      ).toMatchObject({ kind: "minimum", min: expected, max: expected });
    },
  );
  it.each(pricing.packages)("$name starts from $price", (p) =>
    expect(calculateEstimate({ ...state, package: p.id })).toMatchObject({
      kind: "minimum",
      min: p.price,
      max: p.price,
    }),
  );
  it.each(pricing.packages)(
    "charges autonomous power correctly for $name",
    (p) =>
      expect(
        calculateEstimate({ ...state, package: p.id, power: "prime" }).min,
      ).toBe(p.price + pricing.power[p.id]),
  );
  it.each([
    ["small", 499],
    ["sedan", 549],
    ["suv", 599],
    ["large", 649],
  ] as const)("Premium %s starts from %i", (size, price) =>
    expect(calculateEstimate({ ...state, package: "premium", size }).min).toBe(
      price,
    ),
  );
  it("requires all core answers", () =>
    expect(calculateEstimate({ problems: [] })).toMatchObject({
      kind: "pending",
    }));
  it("adds vehicle size and independent dirt and hair ranges", () =>
    expect(
      calculateEstimate({
        ...state,
        size: "large",
        condition: "heavy",
        problems: ["hair"],
      }),
    ).toEqual({
      kind: "range",
      min: 499,
      max: 699,
      adjustments: ["vehicle", "dirt", "hair"],
    }));
  it("never charges FAMILY twice for normal intensive dirt and hair", () =>
    expect(
      calculateEstimate({
        ...state,
        package: "family",
        size: "suv",
        condition: "heavy",
        problems: ["hair", "children", "odour"],
      }),
    ).toEqual({
      kind: "minimum",
      min: 749,
      max: 749,
      adjustments: ["vehicle"],
    }));
  it.each([
    { size: "van" },
    { condition: "extreme" },
    { problems: ["other"] },
  ] as Partial<CalculatorState>[])(
    "uses individual assessment for %j",
    (change) =>
      expect(calculateEstimate({ ...state, ...change })).toMatchObject({
        kind: "individual",
      }),
  );
  it("does not invent charges for leather, children, odour or stains", () =>
    expect(
      calculateEstimate({
        ...state,
        problems: ["leather", "children", "odour", "stains"],
      }),
    ).toMatchObject({ min: 249, max: 249 }));
  it("recommends extraction without mutating the chosen package", () => {
    const s = { ...state, problems: ["stains"] as CalculatorState["problems"] };
    expect(recommendPackage(s)?.package).toBe("premium");
    expect(s.package).toBe("basic");
  });
  it("recommends family for intensive use with hair", () =>
    expect(
      recommendPackage({ ...state, condition: "heavy", problems: ["hair"] })
        ?.package,
    ).toBe("family"));
  it("persists and validates calculator fields", () => {
    saveCalculator(state);
    expect(readCalculator()).toEqual({ ...state, district: "" });
    localStorage.setItem(
      "prime.calculator.v1",
      '{"package":"bad","problems":["hair","private text"]}',
    );
    expect(readCalculator()).toEqual({
      package: undefined,
      size: undefined,
      condition: undefined,
      power: undefined,
      district: "",
      problems: ["hair"],
    });
  });
});
describe("honest server adapter", () => {
  it("cannot report success without configured transport", async () =>
    expect(
      await apiSubmission().submit({ message: "test", photos: [] }),
    ).toEqual({ status: "unavailable" }));
  it("requires explicit server acknowledgement", async () => {
    await expect(
      apiSubmission(async () => ({ confirmed: false })).submit({
        message: "test",
        photos: [],
      }),
    ).rejects.toThrow();
    expect(
      await apiSubmission(async () => ({ confirmed: true })).submit({
        message: "test",
        photos: [],
      }),
    ).toEqual({ status: "confirmed" });
  });
  it("propagates transport failure", async () => {
    await expect(
      apiSubmission(async () => {
        throw new Error("offline");
      }).submit({ message: "test", photos: [] }),
    ).rejects.toThrow("offline");
  });
});
describe("optional analytics", () => {
  afterEach(() => {
    configureTracking();
    setTrackingConsent(false);
  });
  it("is silent until configured and consented, strips unknown properties", () => {
    const provider = vi.fn();
    configureTracking(provider);
    track("click_phone");
    expect(provider).not.toHaveBeenCalled();
    setTrackingConsent(true);
    track(
      "select_package",
      Object.assign(
        { package: "basic" as const },
        { phone: "private", description: "private" },
      ),
    );
    expect(provider).toHaveBeenCalledWith("select_package", {
      package: "basic",
    });
  });
  it("isolates provider errors from user actions", () => {
    configureTracking(() => {
      throw Error("provider");
    });
    setTrackingConsent(true);
    expect(() => track("click_phone")).not.toThrow();
  });
});
