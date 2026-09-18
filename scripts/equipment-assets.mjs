import sharp from "sharp";
import { mkdir } from "node:fs/promises";

// Preserve the supplied photographs: only resize and encode, never upscale.
await mkdir("public/images/equipment", { recursive: true });
for (const [name, extension, widths] of [
  ["wd3", "png", [320, 640, 1280]],
  ["puzzi", "png", [320, 640, 1280]],
  ["ecoflow", "png", [320, 640, 696]],
  ["chemicals", "jpg", [480, 960, 1280]],
]) {
  for (const width of widths) {
    const source = sharp(`assets/equipment/${name}.${extension}`).resize({
      width,
      withoutEnlargement: true,
    });
    await source
      .clone()
      .webp({ quality: 82 })
      .toFile(`public/images/equipment/${name}-${width}.webp`);
    await source
      .clone()
      .avif({ quality: 55, effort: 5 })
      .toFile(`public/images/equipment/${name}-${width}.avif`);
  }
}
