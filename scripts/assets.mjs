import sharp from "sharp";
// Original licensed source is documented in CREDITS.md; kept outside Git in artifacts/.
for (const width of [640, 1200, 1920])
  await sharp("artifacts/interior.jpg")
    .resize(width, Math.round((width * 2) / 3), { fit: "cover" })
    .webp({ quality: 80 })
    .toFile("public/images/interior-" + width + ".webp");
const svg =
  '<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="630" fill="#f5f6f3"/><rect x="72" y="66" width="56" height="6" fill="#2458d5"/><text x="72" y="168" fill="#191d23" font-family="Arial" font-weight="bold" font-size="80">PRIME</text><text x="75" y="212" fill="#59616d" font-family="Arial" font-size="23" letter-spacing="4">MOB DETAIL / WARSZAWA</text><text x="72" y="347" fill="#191d23" font-family="Arial" font-size="50" font-weight="bold">Mobilny detailing wnętrza.</text><text x="72" y="418" fill="#59616d" font-family="Arial" font-size="45">My przyjeżdżamy do Twojego auta.</text><text x="75" y="548" fill="#2458d5" font-family="Arial" font-size="23">Własne zasilanie. Wycena na podstawie zdjęć.</text></svg>';
await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile("public/og.jpg");
