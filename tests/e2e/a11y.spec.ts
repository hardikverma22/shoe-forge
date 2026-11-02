import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = ["/", "/gallery", "/shoes", "/studio/forge-runner", "/studio/air-jordan-1"];

for (const path of pages) {
  test(`no serious or critical accessibility issues on ${path}`, async ({ page }) => {
    await page.goto(path);
    if (path === "/") await expect(page.locator(".sf-loader")).toHaveCount(0, { timeout: 60_000 });
    // The hero fades in after the loader leaves; axe must not sample text mid-fade.
    await expect
      .poll(() => page.evaluate(() => document.getAnimations().some((a) => a.playState === "running")), { timeout: 30_000 })
      .toBe(false);
    if (path.startsWith("/studio")) await expect(page.getByRole("status")).toHaveCount(0, { timeout: 30_000 });
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
}
