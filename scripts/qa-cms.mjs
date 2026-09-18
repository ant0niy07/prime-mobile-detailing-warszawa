/* global document, window */
// Uses intercepted Supabase responses only; never creates a real user/post or uploads a file.
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "msedge" });
const base = process.env.QA_CMS_URL || "http://127.0.0.1:5175";
const user = {
  id: "c8e30fb1-533f-4d03-895f-08e76f7a2c4f",
  aud: "authenticated",
  role: "authenticated",
  email: "editor@example.test",
  email_confirmed_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  created_at: new Date().toISOString(),
};
const token = [
  "eyJhbGciOiJIUzI1NiJ9",
  Buffer.from(
    JSON.stringify({
      sub: user.id,
      exp: Math.floor(Date.now() / 1000) + 3600,
      role: "authenticated",
    }),
  ).toString("base64url"),
  "test",
].join(".");
let posts = [],
  editor = true,
  failSave = false,
  uploads = 0;
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  await context.route("https://*.supabase.co/**", async (route) => {
    const req = route.request(),
      url = new URL(req.url());
    let body,
      status = 200;
    if (url.pathname.includes("/auth/v1/token"))
      body = {
        access_token: token,
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "test",
        user,
      };
    else if (url.pathname.includes("/auth/v1/user")) body = user;
    else if (url.pathname.includes("/auth/v1/logout")) body = {};
    else if (url.pathname.includes("/rpc/is_prime_editor")) body = editor;
    else if (url.pathname.includes("/storage/v1/object/public/blog-images/")) {
      await route.fulfill({
        contentType: "image/png",
        body: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7N8AAAAASUVORK5CYII=",
          "base64",
        ),
      });
      return;
    } else if (url.pathname.includes("/storage/v1/object/blog-images")) {
      uploads++;
      body = { Key: "blog-images/test.webp" };
    } else if (url.pathname.endsWith("/posts")) {
      if (req.method() === "POST") {
        if (failSave) {
          status = 403;
          body = { message: "denied", code: "42501" };
        } else {
          const p = req.postDataJSON();
          posts = [...posts.filter((existing) => existing.id !== p.id), p];
          body = p;
        }
      } else if (req.method() === "DELETE") {
        const id = url.searchParams.get("id")?.replace(/^eq\./, "");
        body = posts.filter((p) => p.id === id).map((p) => ({ id: p.id }));
        posts = posts.filter((p) => p.id !== id);
      } else
        body = url.searchParams.has("status")
          ? posts.filter((p) => p.status === "published")
          : posts;
    } else {
      status = 404;
      body = {};
    }
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
  const page = await context.newPage();
  await page.goto(base + "/en/admin");
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.getByRole("button", { name: "New article" }).click();
  await page.locator("#post-title").fill("A real workflow test");
  await page.locator("#post-slug").fill("workflow-test");
  await page
    .locator("#post-excerpt")
    .fill("An excerpt used only in this intercepted test.");
  await page.locator("#post-seo_title").fill("Workflow SEO title");
  await page
    .locator("#post-seo_description")
    .fill("A description used only in this intercepted test.");
  await page
    .locator(".editor-block textarea")
    .fill("A useful **paragraph** with a [safe link](https://example.test).");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByText("Saved to the database.").waitFor();
  assert.equal(posts[0].status, "draft");
  failSave = true;
  await page.locator("#post-title").fill("Retained after error");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByText(/Could not save/).waitFor();
  assert.equal(
    await page.locator("#post-title").inputValue(),
    "Retained after error",
  );
  failSave = false;
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "cover.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7N8AAAAASUVORK5CYII=",
        "base64",
      ),
    });
  await page.waitForFunction(() =>
    document.querySelector("#post-cover_image").value.includes("blog-images"),
  );
  await page.locator("#post-cover_alt").fill("Test image");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await page.getByText("Saved to the database.").waitFor();
  assert.equal(posts[0].status, "published");
  assert.ok(posts[0].published_at);
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  assert.equal(
    await page.locator(".article-content strong").innerText(),
    "paragraph",
  );
  await page.getByRole("button", { name: "Close preview" }).click();
  for (const width of [375, 430, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      ),
      false,
      "admin overflow " + width,
    );
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    assert.deepEqual(
      result.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
      [],
      "admin accessibility " + width,
    );
    if (width === 1440 || width === 375)
      await page.screenshot({ path: "artifacts/admin-" + width + ".png" });
  }
  const original = posts[0];
  for (const locale of ["pl", "ru"]) {
    await page.getByRole("button", { name: "New article" }).click();
    await page.locator("#post-title").fill("Translation " + locale);
    await page.locator("#post-slug").fill("workflow-" + locale);
    await page.locator("#post-locale").selectOption(locale);
    await page
      .locator("#post-translation")
      .selectOption(original.translation_group);
    await page
      .locator("#post-excerpt")
      .fill("An intercepted translation test excerpt.");
    await page.locator("#post-seo_title").fill("Translation SEO " + locale);
    await page
      .locator("#post-seo_description")
      .fill("An intercepted translation SEO description.");
    await page
      .locator(".editor-block textarea")
      .fill("Translated article content " + locale);
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await page.getByText("Saved to the database.").waitFor();
  }
  assert.equal(posts.length, 3);
  assert.ok(
    posts.every((p) => p.translation_group === original.translation_group),
  );
  await page.goto(base + "/en/blog/workflow-test");
  await page.locator(".blog-article h1").waitFor();
  assert.equal(
    await page.locator("link[rel=canonical]").getAttribute("href"),
    "https://primemobdetail.pl/en/blog/workflow-test",
  );
  assert.equal(
    await page.locator(".article-content strong").innerText(),
    "paragraph",
  );
  assert.equal(
    await page.locator('script[type="application/ld+json"]').count(),
    1,
  );
  for (const [name, locale, slug] of [
    ["Polski", "pl", "workflow-pl"],
    ["Русский", "ru", "workflow-ru"],
    ["English", "en", "workflow-test"],
  ]) {
    await page.getByRole("link", { name, exact: true }).click();
    await page.waitForURL(base + "/" + locale + "/blog/" + slug);
    await page.locator(".blog-article h1").waitFor();
    assert.equal(
      await page.locator("link[rel=canonical]").getAttribute("href"),
      "https://primemobdetail.pl/" + locale + "/blog/" + slug,
    );
  }
  await page.locator("header .logo").click();
  await page.waitForURL(base + "/en");
  await page.locator(".hero h1").waitFor();
  assert.equal(
    await page
      .getByRole("link", { name: "Polski", exact: true })
      .getAttribute("href"),
    "/pl",
  );
  await page.goto(base + "/en/admin");
  await page
    .locator("article")
    .filter({ hasText: "Retained after error" })
    .getByRole("button", { name: "Edit", exact: true })
    .click();
  await page.getByRole("button", { name: "Unpublish", exact: true }).click();
  await page.getByText("Saved to the database.").waitFor();
  assert.equal(posts.find((p) => p.id === original.id).status, "draft");
  await page
    .getByRole("button", { name: "Delete article", exact: true })
    .click();
  await page
    .locator(".warning")
    .getByRole("button", { name: "Delete article", exact: true })
    .click();
  await page.getByText("Saved to the database.").waitFor();
  assert.equal(posts.length, 2);
  assert.ok(!posts.some((p) => p.id === original.id));
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await page.getByRole("button", { name: "Log in", exact: true }).waitFor();
  editor = false;
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await page.getByText("This account does not have editor access.").waitFor();
  assert.equal(
    await page.getByRole("button", { name: "New article" }).count(),
    0,
  );
  assert.equal(uploads, 1);
  console.log(
    "PASS intercepted CMS: login, editor authorization, draft, failure retention, publish, preview, metadata, unpublish, delete, logout, six widths, accessibility. No live backend changes.",
  );
  await context.close();
} finally {
  await browser.close();
}
