import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test("studio works at phone width with no horizontal scroll", async ({ page }) => {
  await page.goto("/studio/forge-runner");
  await expect(page.getByRole("status")).toHaveCount(0, { timeout: 30_000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.screenshot({ path: "test-results/studio-mobile.png" });
});
