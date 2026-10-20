import { test, expect } from "@playwright/test";

test("landing shows the hero, recolors a part in place, and hands the design to the studio", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Yours");
  // The intro loader covers the page until the 3D scene is ready.
  await expect(page.locator(".sf-loader")).toHaveCount(0, { timeout: 30_000 });
  await page.waitForTimeout(1500);

  // A callout opens the color tray; picking a swatch recolors that part.
  const upper = page.getByRole("button", { name: /^01 Upper/ });
  await upper.hover({ force: true });
  await page.waitForTimeout(800);
  await upper.click();
  await expect(page.locator("#callout-tray")).toBeVisible();
  await page.getByRole("radio", { name: "Color #1E2BFF" }).click();
  await expect(upper).toHaveAttribute("aria-label", /#1E2BFF/);
  await page.keyboard.press("Escape");
  await page.screenshot({ path: "test-results/landing-hero.png" });

  // The part tour turns the shoe to each part.
  await page.locator("#tour-title").scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "test-results/landing-tour.png" });

  const href = await page.getByRole("link", { name: "Start designing" }).nth(1).getAttribute("href");
  expect(href).toMatch(/^\/studio\/forge-runner\?d=/);
  expect(errors).toEqual([]);
});
