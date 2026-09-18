import type { Lang } from "./business";
export type InteriorCase = {
  id: string;
  title: Record<Lang, string>;
  before: string;
  after: string;
  alt: Record<Lang, string>;
  category:
    | "fabric"
    | "seat"
    | "carpet"
    | "mat"
    | "boot"
    | "plastics"
    | "hair"
    | "family";
  verified: boolean;
};
export const cases: InteriorCase[] = [];
export type Review = {
  id: string;
  name: string;
  text: Record<Lang, string>;
  sourceUrl: string;
  verified: boolean;
  permissionConfirmed: boolean;
};
export const reviews: Review[] = [];
