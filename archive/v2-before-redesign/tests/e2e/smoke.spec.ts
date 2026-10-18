import { test, expect } from "@playwright/test";

test("studio renders the 3D model and the side panel", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/studio/forge-runner");
  // The loader disappears once the model layout is ready.
  await expect(page.getByRole("status")).toHaveCount(0, { timeout: 30_000 });
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByRole("img", { name: /Forge Runner/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Design" })).toHaveAttribute("aria-selected", "true");
  await page.screenshot({ path: "test-results/studio-desktop.png", fullPage: false });
  expect(errors).toEqual([]);
});
