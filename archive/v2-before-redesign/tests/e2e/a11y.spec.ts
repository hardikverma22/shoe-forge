import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = ["/", "/gallery", "/docs", "/studio/forge-runner"];

for (const path of pages) {
  test(`no serious or critical accessibility issues on ${path}`, async ({ page }) => {
    await page.goto(path);
    if (path.startsWith("/studio")) await expect(page.getByRole("status")).toHaveCount(0, { timeout: 30_000 });
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
}
