/* global document, innerWidth */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "msedge" });
const base = process.env.QA_URL || "http://127.0.0.1:5173";
await mkdir("artifacts", { recursive: true });
const findings = [];
try {
  for (const width of [320, 375, 430, 768, 1024, 1440, 1920]) {
    const context = await browser.newContext({
      viewport: { width, height: 960 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    for (const lang of ["pl", "en", "ru"]) {
      await page.goto(base + "/" + lang);
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator("html").getAttribute("lang"), lang);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        width + "/" + lang + " overflow",
      );
      assert.equal(await page.locator("h1").count(), 1);
      assert.equal(await page.locator(".package-row").count(), 4);
      assert.equal(await page.locator("#equipment tbody tr").count(), 6);
      assert.equal(await page.locator("#equipment picture").count(), 4);
      for (const photo of await page.locator("#equipment picture img").all()) {
        await photo.scrollIntoViewIfNeeded();
        await photo.evaluate(async (img) => {
          await img.decode();
        });
        assert.ok(
          await photo.evaluate(
            (img) => img.naturalWidth > 0 && img.currentSrc.endsWith(".avif"),
          ),
        );
        assert.ok(await photo.getAttribute("alt"));
      }
      assert.equal(await page.getByRole("slider").count(), 0);
      assert.deepEqual(
        await page
          .locator("img")
          .evaluateAll((imgs) =>
            imgs
              .filter((i) => i.complete && i.naturalWidth === 0)
              .map((i) => i.src),
          ),
        [],
      );
      assert.deepEqual(
        await page
          .locator('a[target="_blank"]')
          .evaluateAll((as) =>
            as
              .filter(
                (a) =>
                  !a.rel.includes("noopener") || !a.rel.includes("noreferrer"),
              )
              .map((a) => a.href),
          ),
        [],
      );
      if (lang === "pl") {
        await page.screenshot({ path: "artifacts/qa-" + width + ".png" });
        await page
          .locator("#equipment")
          .screenshot({ path: "artifacts/equipment-" + width + ".png" });
      }
      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      const violations = audit.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          reason: n.failureSummary,
        })),
      }));
      findings.push({ width, lang, violations });
      assert.deepEqual(violations, [], width + "/" + lang + " accessibility");
      console.log(
        "PASS " +
          width +
          "/" +
          lang +
          ": layout, equipment, links, images, accessibility",
      );
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  await writeFile(
    "artifacts/qa-report.json",
    JSON.stringify(findings, null, 2),
  );
} finally {
  await browser.close();
}
