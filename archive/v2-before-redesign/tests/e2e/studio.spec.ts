import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/studio/forge-runner");
  await expect(page.getByRole("status")).toHaveCount(0, { timeout: 30_000 });
});

test("select a part, change material and color, then undo", async ({ page }) => {
  await page.getByRole("button", { name: "Laces" }).click();
  await expect(page.getByRole("button", { name: "Laces" })).toHaveAttribute("aria-pressed", "true");

  // Laces allow canvas and knit only, so leather is offered as disabled.
  const leather = page.getByRole("radio", { name: /Leather/ });
  await expect(leather).toHaveAttribute("aria-disabled", "true");

  await page.getByRole("radio", { name: "Knit" }).click();
  await expect(page.getByRole("radio", { name: "Knit" })).toHaveAttribute("aria-checked", "true");

  const before = await page.getByRole("button", { name: "Undo (Ctrl+Z)" }).isDisabled();
  expect(before).toBe(false);
  await page.getByRole("button", { name: "Undo (Ctrl+Z)" }).click();
  await expect(page.getByRole("radio", { name: "Canvas" })).toHaveAttribute("aria-checked", "true");
});

test("the command menu opens and lists product actions", async ({ page }) => {
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog", { name: "Command menu" })).toBeVisible();
  await page.getByPlaceholder("Type a command").fill("Surprise");
  await expect(page.getByRole("button", { name: "Surprise me" })).toBeVisible();
  await page.keyboard.press("Escape");
});

test("PNG export downloads a file", async ({ page }) => {
  await page.getByRole("tab", { name: "Export" }).click();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Download PNG/ }).click()]);
  expect(download.suggestedFilename()).toMatch(/\.png$/);
});

test("adding to bag needs a size first", async ({ page }) => {
  await page.getByRole("button", { name: "Add to bag" }).click();
  await expect(page.getByText("Choose a size first.")).toBeVisible();
  await page.getByRole("radio", { name: "42" }).click();
  await page.getByRole("button", { name: "Add to bag" }).click();
  await expect(page.getByRole("link", { name: /Bag, 1 item/ })).toBeVisible();
});

test("placing a mark on the upper adds it to the placed list", async ({ page }) => {
  await page.getByRole("tab", { name: "Graphics" }).click();
  await page.getByRole("button", { name: "Place the spark mark" }).click();
  const box = await page.locator("canvas").first().boundingBox();
  if (!box) throw new Error("canvas not found");
  // Walk a grid over the shoe until a click lands on the upper, heel or tongue (the graphic zones).
  let placed = false;
  for (const fy of [0.42, 0.36, 0.5, 0.55]) {
    for (const fx of [0.5, 0.45, 0.55, 0.4, 0.6]) {
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
