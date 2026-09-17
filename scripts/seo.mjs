import { writeFile, readFile, mkdir } from "node:fs/promises";
import { loadEnv } from "vite";
const env = loadEnv("production", process.cwd(), "VITE_");
const seo = JSON.parse(await readFile("src/config/seo.json", "utf8"));
const url = (
  process.env.VITE_SITE_URL ||
  env.VITE_SITE_URL ||
  seo.fallbackUrl
).replace(/\/$/, "");
if (!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(url))
  throw new Error("VITE_SITE_URL must be an HTTPS origin without a path.");
const placeholder = url === seo.fallbackUrl;
if (placeholder)
  console.warn(
    "Set VITE_SITE_URL before launch. Placeholder builds disallow crawling.",
  );
await writeFile(
  "dist/robots.txt",
  `User-agent: *\n${placeholder ? "Disallow: /" : "Allow: /"}\nSitemap: ${url}/sitemap.xml\n`,
);
await writeFile(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${["", "/privacy"].flatMap((path) => ["pl", "en", "ru"].map((lang) => `<url><loc>${url}/${lang}${path}</loc>${["pl", "en", "ru"].map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${url}/${l}${path}"/>`).join("")}</url>`)).join("")}</urlset>`,
);
// Static localized head metadata also works for link preview crawlers that do not run JavaScript.
const shell = await readFile("dist/index.html", "utf8");
const escape = (s) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
function page(lang, path = "") {
  const title = path ? seo[lang].privacyTitle : seo[lang].title;
  const description = seo[lang].description;
  const meta = `<meta data-prime-static="true" name="description" content="${escape(description)}"/><link data-prime-static="true" rel="canonical" href="${url}/${lang}${path}"/>${["pl", "en", "ru"].map((l) => `<link data-prime-static="true" rel="alternate" hreflang="${l}" href="${url}/${l}${path}"/>`).join("")}<link data-prime-static="true" rel="alternate" hreflang="x-default" href="${url}/pl${path}"/><meta data-prime-static="true" property="og:title" content="${escape(title)}"/><meta data-prime-static="true" property="og:description" content="${escape(description)}"/><meta data-prime-static="true" property="og:type" content="website"/><meta data-prime-static="true" property="og:url" content="${url}/${lang}${path}"/><meta data-prime-static="true" property="og:image" content="${url}/og.jpg"/>`;
  return shell
    .replace('<html lang="pl">', `<html lang="${lang}">`)
    .replace(
      /<title[^>]*>.*?<\/title>/,
      `<title data-prime-static="true">${escape(title)}</title>`,
    )
    .replace("</head>", `${meta}</head>`);
}
for (const lang of ["pl", "en", "ru"])
  for (const path of ["", "/privacy"]) {
    await mkdir(`dist/${lang}${path}`, { recursive: true });
    await writeFile(`dist/${lang}${path}/index.html`, page(lang, path));
  }
await writeFile("dist/index.html", page("pl"));
