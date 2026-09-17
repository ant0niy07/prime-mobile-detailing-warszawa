import sharp from "sharp";
import { mkdir } from "node:fs/promises";
await mkdir("public/images", { recursive: true });
for (const name of ["interior", "detail"])
  for (const width of [640, 1200, 1920])
    await sharp(`artifacts/${name}.jpg`)
      .resize(width, Math.round((width * 2) / 3), { fit: "cover" })
      .webp({ quality: 80 })
      .toFile(`public/images/${name}-${width}.webp`);
const overlay = Buffer.from(
  `<svg width="1200" height="630"><defs><linearGradient id="g"><stop stop-color="#090b0d" stop-opacity=".95"/><stop offset="1" stop-color="#090b0d" stop-opacity=".3"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/><text x="75" y="170" fill="#b7f23a" font-family="Arial" font-weight="bold" font-size="76" letter-spacing="8">PRIME</text><text x="75" y="220" fill="#fff" font-family="Arial" font-size="22" letter-spacing="4">MOBILE DETAILING WARSZAWA</text><text x="75" y="385" fill="#fff" font-family="Arial" font-size="45">Profesjonalny detailing wnętrza.</text><text x="75" y="449" fill="#b7f23a" font-family="Arial" font-size="45">Tam, gdzie stoi Twoje auto.</text><text x="75" y="545" fill="#d0d6ce" font-family="Arial" font-size="23">Własne zasilanie. Dojazd do klienta.</text></svg>`,
);
await sharp("artifacts/interior.jpg")
  .resize(1200, 630, { fit: "cover" })
  .composite([{ input: overlay }])
  .jpeg({ quality: 85 })
  .toFile("public/og.jpg");
