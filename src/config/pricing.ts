export const packageIds = ["basic", "plus", "premium", "family"] as const;
export type PackageId = (typeof packageIds)[number];
export const vehicleSizes = ["small", "sedan", "suv", "large", "van"] as const;
export const dirtLevels = ["light", "normal", "heavy", "extreme"] as const;
export const problemIds = [
  "hair",
  "stains",
  "odour",
  "children",
  "leather",
  "other",
] as const;
export type CalculatorState = {
  package?: PackageId;
  size?: (typeof vehicleSizes)[number];
  condition?: (typeof dirtLevels)[number];
  power?: "customer" | "prime";
  district?: string;
  problems: Array<(typeof problemIds)[number]>;
};
export const pricing = {
  packages: [
    { id: "basic", name: "BASIC", price: 249 },
    { id: "plus", name: "BASIC PLUS", price: 349 },
    { id: "premium", name: "PREMIUM", price: 499 },
    { id: "family", name: "FAMILY & PET", price: 649 },
  ] satisfies Array<{ id: PackageId; name: string; price: number }>,
  vehicle: { small: 0, sedan: 50, suv: 100, large: 150, van: null },
  power: { basic: 150, plus: 100, premium: 70, family: 0 },
  travel: { enabled: false },
  heavyDirt: [50, 150],
  substantialHair: [50, 150],
  // Family's ordinary scope includes intensive dirt and hair work: never charge it twice.
  includedDirt: ["family"] as PackageId[],
  includedHair: ["family"] as PackageId[],
  recommendation: {
    deepCleanPackages: ["basic", "plus"] as PackageId[],
    familyProblems: ["hair", "children"] as string[],
  },
  maxPhotos: 5,
  photoBytes: 8 * 1024 * 1024,
} as const;
