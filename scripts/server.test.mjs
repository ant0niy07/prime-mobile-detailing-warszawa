import { test } from "node:test";
import assert from "node:assert/strict";
import {
  articleHtml,
  articleMetadata,
  getPublicPosts,
} from "../server/blog.mjs";
import blog from "../api/blog.mjs";
const post = {
  id: "1",
  translation_group: "group",
  locale: "pl",
  slug: "article",
  title: "A <script>bad</script>",
  excerpt: "Excerpt",
  seo_title: '" title',
  seo_description: "Description",
  author: "PRIME",
  published_at: "2026-09-19T00:00:00Z",
  updated_at: "2026-09-19T00:00:00Z",
  cover_image: "javascript:bad",
  content: [
    { type: "paragraph", text: "<script>bad</script>" },
    { type: "cta", url: "javascript:bad", text: "Bad" },
    {
      type: "image",
      url: "https://example.test/a.webp",
      alt: '" onerror="bad',
    },
  ],
};
test("server article markup escapes stored content and dangerous URLs", () => {
  const html = articleHtml(post);
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes("javascript:"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("&quot; onerror=&quot;bad"));
});
test("metadata encodes JSON script escapes and publishes only existing alternates", () => {
  const html = articleMetadata(post, [post]);
  assert.ok(html.includes("\\u003cscript>"));
  assert.equal((html.match(/hreflang=/g) || []).length, 1);
  assert.ok(html.includes("&quot; title"));
});
test("disabled CMS does not fabricate content", async () => {
  const prior = process.env.VITE_CMS_ENABLED;
  process.env.VITE_CMS_ENABLED = "false";
  assert.deepEqual(await getPublicPosts(), []);
  if (prior === undefined) delete process.env.VITE_CMS_ENABLED;
  else process.env.VITE_CMS_ENABLED = prior;
});
test("article route rejects malformed slugs before accessing data", async () => {
  let result;
  const res = {
    statusCode: 200,
    end: (value) => {
      result = value;
    },
  };
  await blog({ url: "/api/blog?lang=pl&slug=../admin" }, res);
  assert.equal(res.statusCode, 404);
  assert.equal(result, "Not found");
});
