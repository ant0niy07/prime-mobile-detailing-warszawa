import {
  pricing,
  type CalculatorState,
  type PackageId,
} from "../config/pricing";
export type Estimate = {
  kind: "pending" | "individual" | "minimum" | "range";
  min?: number;
  max?: number;
  adjustments: Array<"vehicle" | "dirt" | "hair" | "power">;
};
export function calculateEstimate(state: CalculatorState): Estimate {
  if (!state.package || !state.size || !state.condition || !state.power)
    return { kind: "pending", adjustments: [] };
  if (
    state.size === "van" ||
    state.condition === "extreme" ||
    state.problems.includes("other")
  )
    return { kind: "individual", adjustments: [] };
  const base = pricing.packages.find((p) => p.id === state.package)!.price;
  let min = base + pricing.vehicle[state.size],
    max = min;
  const adjustments: Estimate["adjustments"] = [];
  if (pricing.vehicle[state.size]) adjustments.push("vehicle");
  if (
    state.condition === "heavy" &&
    !pricing.includedDirt.includes(state.package)
  ) {
    min += pricing.heavyDirt[0];
    max += pricing.heavyDirt[1];
    adjustments.push("dirt");
  }
  if (
    state.problems.includes("hair") &&
    !pricing.includedHair.includes(state.package)
  ) {
    min += pricing.substantialHair[0];
    max += pricing.substantialHair[1];
    adjustments.push("hair");
  }
  if (state.power === "prime" && pricing.power[state.package]) {
    min += pricing.power[state.package];
    max += pricing.power[state.package];
    adjustments.push("power");
  }
  return { kind: min === max ? "minimum" : "range", min, max, adjustments };
}
export function recommendPackage(
  s: CalculatorState,
): { package: PackageId; reason: "family" | "extraction" } | null {
  if (!s.package) return null;
  const family =
    s.condition === "extreme" ||
    ((s.condition === "heavy" || s.problems.includes("odour")) &&
      s.problems.some((p) =>
        pricing.recommendation.familyProblems.includes(p),
      ));
  if (family && s.package !== "family")
    return { package: "family", reason: "family" };
  if (
    pricing.recommendation.deepCleanPackages.includes(s.package) &&
    (s.condition === "heavy" ||
      s.problems.includes("stains") ||
      s.problems.includes("odour"))
  )
    return { package: "premium", reason: "extraction" };
  return null;
}
export const CALCULATOR_KEY = "prime.calculator.v1";
export function readCalculator(): CalculatorState {
  try {
    const s = JSON.parse(localStorage.getItem(CALCULATOR_KEY) || "null");
    if (!s) return { problems: [] };
    return {
      package: pricing.packages.some((p) => p.id === s.package)
        ? s.package
        : undefined,
      size: ["small", "sedan", "suv", "large", "van"].includes(s.size)
        ? s.size
        : undefined,
      condition: ["light", "normal", "heavy", "extreme"].includes(s.condition)
        ? s.condition
        : undefined,
      power: ["customer", "prime"].includes(s.power) ? s.power : undefined,
      district: typeof s.district === "string" ? s.district.slice(0, 150) : "",
      problems: Array.isArray(s.problems)
        ? s.problems.filter((p: unknown) =>
            [
              "hair",
              "stains",
              "odour",
              "children",
              "leather",
              "other",
            ].includes(String(p)),
          )
        : [],
    };
  } catch {
    return { problems: [] };
  }
}
export function saveCalculator(s: CalculatorState) {
  try {
    localStorage.setItem(CALCULATOR_KEY, JSON.stringify(s));
  } catch {
    /* Optional device storage. */
  }
}
