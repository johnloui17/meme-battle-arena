import { test, expect } from "@playwright/test";
import { loginViaUI } from "./helpers/auth";
import { MOCK_LEADERBOARD_ENTRIES } from "./fixtures/mock-data";

test.describe("Leaderboard page", () => {
  test("leaderboard - loading", async ({ page }) => {
    await page.unroute("**/api/v1/leaderboard*");

    let resolveLeaderboard: (() => void) | null = null;
    await page.route("**/api/v1/leaderboard*", (route) => {
      if (!resolveLeaderboard) {
        new Promise<void>((resolve) => {
          resolveLeaderboard = resolve;
        }).then(() =>
          route.fulfill({
            json: {
              data: [],
              pagination: { page: 1, page_size: 25, total_items: 0, total_pages: 0 },
            },
          })
        );
      } else {
        route.fallback();
      }
    });

    await loginViaUI(page);
    await expect(page).toHaveURL("/", { timeout: 15_000 });

    await page.goto("/leaderboard", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("Leaderboard");
    await expect(page).toHaveScreenshot("leaderboard-loading.png", { fullPage: true, timeout: 10_000 });

    resolveLeaderboard?.();
  });

  test("leaderboard - with data", async ({ page }) => {
    await loginViaUI(page);
    await expect(page).toHaveURL("/", { timeout: 15_000 });

    await page.unroute("**/api/v1/leaderboard*");
    await page.route("**/api/v1/leaderboard*", (route) =>
      route.fulfill({
        json: {
          data: MOCK_LEADERBOARD_ENTRIES,
          pagination: { page: 1, page_size: 25, total_items: 3, total_pages: 1 },
        },
      })
    );

    await page.goto("/leaderboard");
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveScreenshot("leaderboard-with-data.png", { fullPage: true });
  });

  test("leaderboard - empty", async ({ page }) => {
    await loginViaUI(page);
    await expect(page).toHaveURL("/", { timeout: 15_000 });

    await page.unroute("**/api/v1/leaderboard*");
    await page.route("**/api/v1/leaderboard*", (route) =>
      route.fulfill({
        json: {
          data: [],
          pagination: { page: 1, page_size: 25, total_items: 0, total_pages: 0 },
        },
      })
    );

    await page.goto("/leaderboard");
    await expect(page.locator("h1")).toContainText("Leaderboard");
    await expect(page).toHaveScreenshot("leaderboard-empty.png", { fullPage: true });
  });
});
