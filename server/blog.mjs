export const escapeHtml = (s = "") =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
export const siteOrigin = () =>
  process.env.VITE_SITE_URL || "https://primemobdetail.pl";
export async function getPublicPosts() {
  if (
    process.env.VITE_CMS_ENABLED !== "true" ||
    !process.env.VITE_SUPABASE_URL ||
    !process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  )
    return [];
  const query = new URLSearchParams({
    select: "*",
    status: "eq.published",
    published_at: `lte.${new Date().toISOString()}`,
    order: "published_at.desc",
  });
  const response = await fetch(
    `${process.env.VITE_SUPABASE_URL}/rest/v1/posts?${query}`,
    {
      headers: { apikey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!response.ok) throw new Error("CMS unavailable");
  return await response.json();
}
const safeUrl = (s) =>
  typeof s === "string" &&
  (/^https:\/\/[^\s]+$/i.test(s) || /^\/(?!\/)[^\s\\]*$/.test(s));
export function articleHtml(post) {
  return `<article><h1>${escapeHtml(post.title)}</h1><p>${escapeHtml(post.excerpt)}</p>${safeUrl(post.cover_image) ? `<img src="${escapeHtml(post.cover_image)}" alt="${escapeHtml(post.cover_alt)}" width="1200" height="800"/>` : ""}${(Array.isArray(
    post.content,
  )
    ? post.content
    : []
  )
    .map((b) => {
      if (b.type === "image")
        return safeUrl(b.url)
          ? `<figure><img src="${escapeHtml(b.url)}" alt="${escapeHtml(b.alt)}" width="1200" height="800" loading="lazy"/></figure>`
          : "";
      if (b.type === "cta")
        return safeUrl(b.url)
          ? `<a href="${escapeHtml(b.url)}">${escapeHtml(b.text)}</a>`
          : "";
      if (b.type === "list")
        return `<ul>${String(b.text)
          .split("\n")
          .map((s) => `<li>${escapeHtml(s)}</li>`)
          .join("")}</ul>`;
      const tag = ["h2", "h3"].includes(b.type) ? b.type : "p";
      return `<${tag}>${escapeHtml(b.text)}</${tag}>`;
    })
    .join("")}</article>`;
}
export function articleMetadata(post, posts) {
  const origin = siteOrigin(),
    url = `${origin}/${post.locale}/blog/${post.slug}`,
    image = post.og_image || post.cover_image || `${origin}/og.jpg`;
  const json = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { "@type": "Person", name: post.author },
    publisher: { "@type": "Organization", name: "Prime Mob Detail" },
    mainEntityOfPage: url,
    image,
    inLanguage: post.locale,
  }).replaceAll("<", "\\u003c");
  return `<title data-prime-static="true">${escapeHtml(post.seo_title)} | Prime Mob Detail</title><meta data-prime-static="true" name="description" content="${escapeHtml(post.seo_description)}"/><link data-prime-static="true" rel="canonical" href="${escapeHtml(url)}"/><meta data-prime-static="true" property="og:type" content="article"/><meta data-prime-static="true" property="og:title" content="${escapeHtml(post.seo_title)}"/><meta data-prime-static="true" property="og:description" content="${escapeHtml(post.seo_description)}"/><meta data-prime-static="true" property="og:url" content="${escapeHtml(url)}"/><meta data-prime-static="true" property="og:image" content="${escapeHtml(image)}"/><meta data-prime-static="true" name="twitter:card" content="summary_large_image"/>${posts
    .filter((p) => p.translation_group === post.translation_group)
    .map(
      (p) =>
        `<link data-prime-static="true" rel="alternate" hreflang="${escapeHtml(p.locale)}" href="${escapeHtml(`${origin}/${p.locale}/blog/${p.slug}`)}"/>`,
    )
    .join(
      "",
    )}<script data-prime-static="true" type="application/ld+json">${json}</script>`;
}
