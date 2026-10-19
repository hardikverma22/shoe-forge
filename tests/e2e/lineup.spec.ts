import { test, expect } from "@playwright/test";

test("the catalog filters by category and opens a brand shoe in the studio", async ({ page }) => {
  await page.goto("/shoes");
  await expect(page.getByRole("heading", { name: "Pick a pair." })).toBeVisible();
  await page.getByRole("button", { name: /^Skate/ }).click();
  await expect(page.getByRole("button", { name: /^Skate/ })).toHaveAttribute("aria-pressed", "true");
  const cards = page.getByRole("main").getByRole("listitem").filter({ has: page.getByRole("heading", { level: 3 }) });
  await expect(cards).toHaveCount(1);
  await page.getByRole("link", { name: /Vans Old Skool/ }).click();
  await expect(page).toHaveURL(/\/studio\/old-skool/);
  await expect(page.getByRole("status")).toHaveCount(0, { timeout: 30_000 });
  await expect(page.getByRole("link", { name: /3D model: thesidekick/ })).toBeVisible();
});

test("a brand shoe recolors a region with a named color, and takes a graphic", async ({ page }) => {
  await page.goto("/studio/air-jordan-1");
  await expect(page.getByRole("status")).toHaveCount(0, { timeout: 30_000 });

  const toeBox = page.getByRole("navigation", { name: "Parts" }).getByRole("button", { name: /Toe box, heel and wing/ });
  await toeBox.click();
  await expect(toeBox).toHaveAttribute("aria-current", "true");
  await page.getByRole("radio", { name: "Game Royal #1F4FBF" }).click();
  await expect(page.getByRole("radio", { name: "Game Royal #1F4FBF" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText(/Game Royal · #1F4FBF/)).toBeVisible();

  await page.getByRole("tab", { name: "Graphics" }).click();
  await page.getByRole("button", { name: "Place the spark mark" }).click();
  const box = await page.locator("canvas").first().boundingBox();
  if (!box) throw new Error("canvas not found");
  let placed = false;
  for (const fy of [0.45, 0.5, 0.4, 0.55]) {
    for (const fx of [0.45, 0.5, 0.4, 0.55, 0.35]) {
      await page.mouse.move(box.x + box.width * fx, box.y + box.height * fy);
      await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
      if (await page.getByRole("heading", { name: "On the shoe" }).isVisible().catch(() => false)) {
        placed = true;
        break;
      }
      await page.getByRole("button", { name: "Place the spark mark" }).click();
    }
    if (placed) break;
  }
  expect(placed).toBe(true);
});
