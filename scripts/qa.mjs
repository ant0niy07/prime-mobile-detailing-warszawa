/* global document, innerWidth, scrollTo */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({ channel: "msedge" });
const base = process.env.QA_URL || "http://127.0.0.1:5173";
const findings = [];
try {
  for (const width of [320, 375, 768, 1024, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 960 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    for (const lang of ["pl", "en", "ru"]) {
      await page.goto(`${base}/${lang}`);
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator("html").getAttribute("lang"), lang);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      assert.equal(overflow, false, `Overflow ${width}/${lang}`);
      const broken = await page
        .locator("img")
        .evaluateAll((imgs) =>
          imgs
            .filter((i) => i.complete && i.naturalWidth === 0)
            .map((i) => i.src),
        );
      assert.deepEqual(broken, []);
      const unsafe = await page
        .locator('a[target="_blank"]')
        .evaluateAll((as) =>
          as
            .filter(
              (a) =>
                !a.rel.includes("noopener") || !a.rel.includes("noreferrer"),
            )
            .map((a) => a.href),
        );
      assert.deepEqual(unsafe, []);
      await page.locator("#contact").scrollIntoViewIfNeeded();
      await page.waitForTimeout(100);
      await page.evaluate(() => scrollTo(0, 0));
      if (lang === "pl")
        await page.screenshot({
          path: `artifacts/qa-${width}.png`,
          fullPage: true,
        });
      if (lang === "en") {
        const audit = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        findings.push({
          width,
          lang,
          accessibility: audit.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              summary: n.failureSummary,
            })),
          })),
        });
      }
      await page.reload();
      await page.waitForLoadState("networkidle");
      assert.equal(await page.locator("html").getAttribute("lang"), lang);
    }
    await page.goto(`${base}/en`);
    await page.waitForLoadState("networkidle");
    if (width < 961) {
      const button = page.getByRole("button", { name: "Open menu" });
      await button.click();
      const menu = page.getByRole("dialog");
      await menu.waitFor();
      await page.keyboard.press("Escape");
      await menu.waitFor({ state: "detached" });
      assert.equal(
        await button.evaluate((el) => el === document.activeElement),
        true,
      );
      await button.click();
      await menu.getByRole("link", { name: "Русский" }).click();
      assert.equal(await page.locator("dialog").count(), 0);
      await page.goto(`${base}/en`);
    }
    await page
      .getByRole("button", { name: "Get my car quoted", exact: true })
      .first()
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Make and model").fill("Toyota Corolla");
    await dialog.getByLabel("SUV", { exact: true }).check();
    await dialog.getByRole("button", { name: "Continue" }).click();
    await dialog.getByLabel("BASIC PLUS").check();
    await dialog.getByRole("button", { name: "Continue" }).click();
    await dialog.getByLabel("Pet hair", { exact: true }).check();
    await dialog.getByLabel("Fabric upholstery", { exact: true }).check();
    await dialog.getByRole("button", { name: "Continue" }).click();
    await dialog.getByLabel("Warsaw district or nearby town").fill("Mokotów");
    await dialog.getByLabel("Underground garage", { exact: true }).check();
    assert.equal(await dialog.locator(".warning").isVisible(), true);
    await dialog.getByRole("button", { name: "Continue" }).click();
    await dialog.getByLabel("My date is flexible").check();
    await dialog.getByRole("button", { name: "Continue" }).click();
    await dialog
      .locator("input[type=file]")
      .setInputFiles("public/images/detail-640.webp");
    assert.equal(await dialog.locator(".photo-thumb").count(), 1);
    await dialog.getByRole("button", { name: "Continue" }).click();
    await dialog.getByLabel("Name", { exact: true }).fill("Anna");
    await dialog.getByLabel("Phone number").fill("+48 600 111 222");
    await dialog.getByRole("checkbox").check();
    await dialog.getByRole("button", { name: "Continue" }).click();
    assert.equal(await dialog.locator(".summary").isVisible(), true);
    assert.equal(
      await dialog
        .locator(".summary-price")
        .innerText()
        .then((t) => t.includes("299")),
      true,
    );
    assert.equal(
      await dialog.evaluate((el) => el.scrollWidth > el.clientWidth),
      false,
      `Dialog overflow ${width}`,
    );
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    findings.push({
      width,
      screen: "summary",
      accessibility: audit.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    });
    await dialog.screenshot({ path: `artifacts/form-${width}.png` });
    // Intercept the handoff locally: verify a real new tab without contacting WhatsApp.
    await context.route("https://wa.me/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<title>Local handoff test</title>",
      }),
    );
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const popupPromise = page.waitForEvent("popup");
    await dialog.getByRole("link", { name: "Send via WhatsApp" }).click();
    const popup = await popupPromise;
    await popup.waitForLoadState();
    assert.ok(popup.url().startsWith("https://wa.me/48690747691?text="));
    assert.ok(decodeURIComponent(popup.url()).includes("Toyota Corolla"));
    await popup.close();
    assert.equal(await dialog.locator(".summary").isVisible(), true);
    await page.keyboard.press("Escape");
    await page.locator("dialog").waitFor({ state: "detached" });
    const slider = page.getByRole("slider");
    await slider.scrollIntoViewIfNeeded();
    await slider.focus();
    const initial = await slider.inputValue();
    await page.keyboard.press("ArrowRight");
    assert.equal(Number(await slider.inputValue()), Number(initial) + 1);
    const faq = page.locator("summary").first();
    await faq.focus();
    await page.keyboard.press("Enter");
    assert.equal(await faq.evaluate((el) => el.parentElement.open), true);
    await page.goto(`${base}/en/privacy`);
    await page.reload();
    assert.equal(
      await page
        .getByRole("heading", { name: "Privacy and your data" })
        .count(),
      1,
    );
    assert.deepEqual(errors, [], `Console errors at ${width}`);
    findings.push({
      width,
      responsive: "pass",
      flow: "pass",
      keyboard: "pass",
      consoleErrors: errors,
    });
    await context.close();
    console.log(
      `PASS ${width}px: PL/EN/RU, refresh, layout, photos, quote flow, keyboard, console`,
    );
  }
} finally {
  await writeFile(
    "artifacts/qa-report.json",
    JSON.stringify(findings, null, 2),
  );
  await browser.close();
}
const violations = findings.flatMap((x) => x.accessibility || []);
console.log(`Accessibility violations: ${violations.length}`);
if (violations.length) {
  console.log(JSON.stringify(violations, null, 2));
  process.exitCode = 1;
}
