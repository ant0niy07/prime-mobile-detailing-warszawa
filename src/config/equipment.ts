export const equipmentIds = [
  "wd3",
  "puzzi",
  "chemicals",
  "brushes",
  "hair",
] as const;
export type EquipmentId = (typeof equipmentIds)[number];
export type EquipmentPhoto = {
  src: string;
  width: number;
  height: number;
  credit: string;
};
// Add real owner photographs or assets with verified commercial permission here.
// Empty entries render an intentional editorial text layout, never fake product photos.
export const equipmentPhotos: Record<
  EquipmentId | "power",
  EquipmentPhoto | null
> = {
  wd3: null,
  puzzi: null,
  chemicals: null,
  brushes: null,
  hair: null,
  power: null,
};
export const equipmentMatrix = [
  ["included", "included", "included", "included"],
  ["included", "included", "included", "included"],
  ["scope", "included", "included", "included"],
  ["none", "scope", "included", "included"],
  ["extra", "extra", "extra", "included"],
  ["extra", "extra", "extra", "included"],
] as const;
