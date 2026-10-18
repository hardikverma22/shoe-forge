import { test, expect } from "@playwright/test";

test("landing shows the hero and the exploded section", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Build your");
  await expect(page.getByRole("link", { name: "Start designing" }).first()).toBeVisible();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "test-results/landing-hero.png" });
  await page.locator("#explode-heading").scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "test-results/landing-explode.png" });
  expect(errors).toEqual([]);
});
