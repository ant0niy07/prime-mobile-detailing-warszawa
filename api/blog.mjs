import { readFile } from "node:fs/promises";
import {
  getPublicPosts,
  articleHtml,
  articleMetadata,
} from "../server/blog.mjs";
export default async function handler(req, res) {
  const query = new URL(req.url, "https://primemobdetail.pl").searchParams;
  const lang = query.get("lang"),
    slug = query.get("slug");
  if (
    !["pl", "en", "ru"].includes(lang) ||
    !slug ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  ) {
    res.statusCode = 404;
    return res.end("Not found");
  }
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  try {
    const posts = await getPublicPosts(),
      post = posts.find((p) => p.locale === lang && p.slug === slug);
    let shell = await readFile(`${process.cwd()}/dist/index.html`, "utf8");
    shell = shell
      .replace(/<title[^>]*>[\s\S]*?<\/title>/g, "")
      .replace(/<(meta|link)[^>]*data-prime-static="true"[^>]*>/g, "")
      .replace('<html lang="pl">', `<html lang="${lang}">`);
    if (!post) {
      res.statusCode = 404;
      return res.end(
        shell.replace(
          "</head>",
          '<meta data-prime-static="true" name="robots" content="noindex"/></head>',
        ),
      );
    }
    shell = shell
      .replace("</head>", `${articleMetadata(post, posts)}</head>`)
      .replace(
        '<div id="root"></div>',
        `<div id="root"><main class="container section blog-article">${articleHtml(post)}</main></div>`,
      );
    res.statusCode = 200;
    return res.end(shell);
  } catch {
    res.statusCode = 503;
    res.setHeader("Retry-After", "60");
    return res.end("Service temporarily unavailable");
  }
}
