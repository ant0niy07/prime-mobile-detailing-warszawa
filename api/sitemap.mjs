import { getPublicPosts, siteOrigin, escapeHtml } from "../server/blog.mjs";
export default async function handler(_req, res) {
  try {
    const posts = await getPublicPosts(),
      origin = siteOrigin();
    const pages = ["", "/privacy", "/floty", "/blog"].flatMap((path) =>
      ["pl", "en", "ru"].map((lang) => `${origin}/${lang}${path}`),
    );
    const base = pages
      .map((url) => `<url><loc>${escapeHtml(url)}</loc></url>`)
      .join("");
    const articles = posts
      .map(
        (p) =>
          `<url><loc>${escapeHtml(`${origin}/${p.locale}/blog/${p.slug}`)}</loc><lastmod>${escapeHtml(p.updated_at)}</lastmod>${posts
            .filter((x) => x.translation_group === p.translation_group)
            .map(
              (x) =>
                `<xhtml:link rel="alternate" hreflang="${escapeHtml(x.locale)}" href="${escapeHtml(`${origin}/${x.locale}/blog/${x.slug}`)}"/>`,
            )
            .join("")}</url>`,
      )
      .join("");
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=60");
    res.end(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${base}${articles}</urlset>`,
    );
  } catch {
    res.statusCode = 503;
    res.setHeader("Retry-After", "60");
    res.end("Sitemap temporarily unavailable");
  }
}
