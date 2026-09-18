/* global document, innerWidth */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "msedge" }),
  base = process.env.QA_URL || "http://127.0.0.1:5173";
try {
  for (const width of [375, 430, 768, 1024, 1440, 1920]) {
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
    for (const lang of ["pl", "ru", "en"])
      for (const route of ["floty", "blog", "admin"]) {
        await page.goto(`${base}/${lang}/${route}`);
        await page.waitForLoadState("networkidle");
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
          `${width}/${lang}/${route}`,
        );
        assert.equal(await page.locator("h1").count(), 1);
        const audit = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        assert.deepEqual(
          audit.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              reason: n.failureSummary,
            })),
          })),
          [],
          `${width}/${lang}/${route}`,
        );
        if (width === 375 && lang === "pl")
          await page.screenshot({
            path: `artifacts/${route}-mobile.png`,
            fullPage: true,
          });
        if (width === 1440 && lang === "pl")
          await page.screenshot({ path: `artifacts/${route}-desktop.png` });
      }
    assert.deepEqual(errors, []);
    console.log(
      `PASS ${width}: fleet/blog/admin, all languages, no console errors, accessibility, no overflow`,
    );
    await context.close();
  }
} finally {
  await browser.close();
}
