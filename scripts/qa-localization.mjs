/* global document */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const base = process.env.QA_URL || "http://127.0.0.1:5173";
const browser = await chromium.launch({ channel: "msedge" });
try {
  for (const lang of ["pl", "en", "ru"]) {
    const context = await browser.newContext({
      viewport: { width: 320, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto(base + "/" + lang);
    await page.waitForLoadState("networkidle");
    assert.equal(
      await page.locator("link[rel=canonical]").getAttribute("href"),
      "https://primemobdetail.pl/" + lang,
    );
    assert.equal(await page.locator("title").count(), 1);
    await page.locator(".package-row").nth(2).getByRole("button").click();
    const calc = page.locator("#calculator");
    assert.equal(
      await calc.locator("input[name=calc-package]:checked").count(),
      1,
    );
    await calc.locator(".form-actions .primary").click();
    await calc.locator("input[name=calc-size]").nth(2).check();
    await calc.locator(".form-actions .primary").click();
    await calc.locator("input[name=calc-condition]").nth(2).check();
    await calc.locator(".form-actions .primary").click();
    await calc.getByRole("checkbox").first().check();
    await calc.locator(".form-actions .primary").click();
    await calc.locator("input[name=calc-power]").nth(1).check();
    await calc.locator(".form-actions .primary").click();
    await calc.locator("#calc-district").fill("Mokotów");
    await calc.locator(".form-actions .primary").click();
    assert.match(
      await calc.locator(".price-result strong").innerText(),
      /769–969/,
    );
    await calc.locator(".calculator-submit").click();
    const dialog = page.getByRole("dialog");
    await dialog.locator("#vehicle").fill("Toyota Corolla");
    assert.equal(
      await dialog.locator("input[name=package]:checked").inputValue(),
      "premium",
    );
    assert.equal(
      await dialog.locator("input[name=size]:checked").inputValue(),
      "suv",
    );
    for (let step = 0; step < 5; step++) {
      if (step === 1) {
        assert.equal(
          await dialog.locator("input[name=condition]:checked").inputValue(),
          "heavy",
        );
        assert.equal(
          await dialog.locator("input[name=problems]:checked").inputValue(),
          "hair",
        );
        await dialog.locator("#district").fill("Mokotów");
        await dialog.locator("input[value=garage]").check();
      }
      if (step === 2) {
        await dialog.locator("input[name=flexible]").check();
        await dialog.locator("#photos").setInputFiles({
          name: "seat.png",
          mimeType: "image/png",
          buffer: Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7N8AAAAASUVORK5CYII=",
            "base64",
          ),
        });
      }
      if (step === 3) {
        await dialog.locator("#name").fill("Anna");
        await dialog.locator("#phone").fill("600123456");
        await dialog.locator("#email").fill("anna@example.test");
        await dialog.locator("input[name=consent]").check();
      }
      assert.equal(
        await dialog.evaluate((el) => el.scrollWidth > el.clientWidth),
        false,
        lang + " form overflow " + step,
      );
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
        lang + " form accessibility " + step,
      );
      if (step < 4) await dialog.locator("button[type=submit]").click();
    }
    assert.match(
      await dialog.locator(".summary").innerText(),
      /Toyota Corolla/,
    );
    assert.match(await dialog.locator(".summary-price").innerText(), /769–969/);
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() => !!document.activeElement.closest("dialog")),
      true,
    );
    await page.keyboard.press("Escape");
    await page.locator(".hero-buttons button").click();
    await dialog.locator("#vehicle").waitFor();
    assert.equal(
      await dialog.locator("#vehicle").inputValue(),
      "Toyota Corolla",
    );
    await dialog.locator("button[type=submit]").click();
    await dialog.locator("button[type=submit]").click();
    assert.equal(await dialog.locator(".photo-thumb").count(), 1);
    await page.keyboard.press("Escape");
    await page.goto(base + "/" + lang + "/privacy");
    const html = await readFile("dist/" + lang + "/index.html", "utf8");
    assert.ok(html.includes("https://primemobdetail.pl/" + lang));
    assert.ok(html.includes('lang="' + lang + '"'));
    console.log(
      "PASS " +
        lang +
        ": calculator transfer, five form steps, photos retained, focus, localized metadata",
    );
    await context.close();
  }
} finally {
  await browser.close();
}
