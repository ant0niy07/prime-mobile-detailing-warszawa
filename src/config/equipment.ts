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
  widths: number[];
  base: string;
  source?: string;
  illustrative?: boolean;
};
const photo = (
  name: string,
  width: number,
  height: number,
  widths = [320, 640, 1280],
): EquipmentPhoto => ({
  src: `/images/equipment/${name}-${width}.webp`,
  base: `/images/equipment/${name}`,
  width,
  height,
  widths,
  credit: "",
});
// Three user-supplied photographs; chemistry is explicitly labelled stock imagery.
export const equipmentPhotos: Record<
  EquipmentId | "power",
  EquipmentPhoto | null
> = {
  wd3: photo("wd3", 1280, 1280),
  puzzi: photo("puzzi", 1280, 1280),
  chemicals: {
    ...photo("chemicals", 1280, 1600, [480, 960, 1280]),
    illustrative: true,
    credit: "Hasan Gulec / Pexels",
    source:
      "https://www.pexels.com/photo/plastic-bottles-with-car-care-products-11139243/",
  },
  brushes: null,
  hair: null,
  power: photo("ecoflow", 696, 720, [320, 640, 696]),
};
export const equipmentMatrix = [
  ["included", "included", "included", "included"],
  ["included", "included", "included", "included"],
  ["scope", "included", "included", "included"],
  ["none", "scope", "included", "included"],
  ["extra", "extra", "extra", "included"],
  ["extra", "extra", "extra", "included"],
] as const;
