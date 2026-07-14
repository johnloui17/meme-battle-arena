import { test, expect } from "@playwright/test";
import { loginViaUI } from "./helpers/auth";
import { MOCK_MY_MEMES } from "./fixtures/mock-data";

test.describe("My Memes page", () => {
  test("my-memes - loading", async ({ page }) => {
    await loginViaUI(page);
    await expect(page).toHaveURL("/", { timeout: 15_000 });

    let resolveUserMemes: (() => void) | null = null;
    await page.route("**/api/v1/users/**/memes", (route) => {
      if (route.request().method() === "GET") {
        new Promise<void>((resolve) => {
          resolveUserMemes = resolve;
        }).then(() =>
          route.fulfill({
            json: {
              data: MOCK_MY_MEMES,
              pagination: { total: MOCK_MY_MEMES.length, page: 1, pageSize: 20, totalPages: 1 },
            },
          })
        );
      } else {
        route.fallback();
      }
    });

    await page.goto("/my-memes", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("My memes");
    await expect(page).toHaveScreenshot("my-memes-loading.png", { fullPage: true });

    resolveUserMemes?.();
  });

  test("my-memes - with data", async ({ page }) => {
    await loginViaUI(page);
    await expect(page).toHaveURL("/", { timeout: 15_000 });

    await page.route("**/api/v1/memes*", (route) =>
      route.fulfill({
        json: {
          data: MOCK_MY_MEMES,
          pagination: { page: 1, page_size: 25, total_items: 2, total_pages: 1 },
        },
      })
    );

    await page.goto("/my-memes");
    await expect(page.locator("text=Distracted Boyfriend")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=Surprised Pikachu")).toBeVisible();
    await expect(page.locator("text=Delete").first()).toBeVisible();
    await expect(page).toHaveScreenshot("my-memes-with-data.png", { fullPage: true });
  });

  test("my-memes - empty", async ({ page }) => {
    await loginViaUI(page);
    await expect(page).toHaveURL("/", { timeout: 15_000 });

    await page.route("**/api/v1/memes*", (route) =>
      route.fulfill({
        json: {
          data: [],
          pagination: { page: 1, page_size: 25, total_items: 0, total_pages: 0 },
        },
      })
    );

    await page.goto("/my-memes");
    await expect(page.locator("text=No memes yet")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=Upload your first one")).toBeVisible();
    await expect(page).toHaveScreenshot("my-memes-empty.png", { fullPage: true });
  });
});
