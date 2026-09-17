/* global document */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const base = process.env.QA_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch({ channel: "msedge" });
try {
  const context = await browser.newContext({
    viewport: { width: 320, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  for (const lang of ["pl", "en", "ru"]) {
    await page.goto(`${base}/${lang}`);
    await page.waitForLoadState("networkidle");
    assert.equal(await page.locator("link[rel=canonical]").count(), 1);
    assert.ok(
      (await page.locator("link[rel=canonical]").getAttribute("href")).endsWith(
        `/${lang}`,
      ),
    );
    assert.equal(await page.locator("meta[name=description]").count(), 1);
    assert.equal(await page.locator("title").count(), 1);
    await page.evaluate(() =>
      localStorage.setItem(
        "prime.quote.v1",
        JSON.stringify({
          expires: Date.now() + 999999,
          data: {
            vehicle: "Toyota Corolla",
            size: "sedan",
            package: "plus",
            conditions: ["hair", "fabric"],
            district: "Mokotów",
            address: "",
            parking: "garage",
            date: "",
            time: "",
            flexible: true,
            description: "",
            name: "Anna",
            phone: "600123456",
            contactMethod: "whatsapp",
            consent: false,
          },
        }),
      ),
    );
    await page.locator(".hero-buttons button").first().click();
    const dialog = page.getByRole("dialog");
    for (let step = 0; step < 8; step++) {
      await dialog.locator("form h3").waitFor();
      assert.equal(
        await dialog.evaluate((el) => el.scrollWidth > el.clientWidth),
        false,
        `${lang} step ${step} overflow`,
      );
      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      assert.deepEqual(
        audit.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.failureSummary),
        })),
        [],
        `${lang} step ${step} accessibility`,
      );
      if (step === 6) await dialog.locator("input[name=consent]").check();
      if (step < 7)
        await dialog.locator(".form-actions button[type=submit]").click();
    }
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() => !!document.activeElement.closest("dialog")),
      true,
    );
    await page.keyboard.press("Escape");
    await page.goto(`${base}/${lang}/privacy`);
    await page.waitForLoadState("networkidle");
    assert.ok(
      (await page.locator("link[rel=canonical]").getAttribute("href")).endsWith(
        `/${lang}/privacy`,
      ),
    );
    const html = await readFile(`dist/${lang}/index.html`, "utf8");
    assert.ok(html.includes(`/${lang}"`));
    assert.ok(html.includes(`lang="${lang}"`));
    console.log(
      `PASS ${lang}: eight steps at 320px, accessibility, focus containment, unique localized metadata and static HTML`,
    );
  }
  await page.goto(`${base}/pl`);
  await page.waitForLoadState("networkidle");
  const buttons = page.locator("main button");
  const count = await buttons.count();
  for (let i = 0; i < count; i++) {
    await buttons.nth(i).click();
    await page.getByRole("dialog").waitFor();
    await page.keyboard.press("Escape");
  }
  console.log(`PASS all ${count} primary page buttons open the configurator`);
} finally {
  await browser.close();
}
