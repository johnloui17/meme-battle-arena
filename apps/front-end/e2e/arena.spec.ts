import { test, expect } from "@playwright/test";
import { loginViaUI } from "./helpers/auth";
import { MOCK_MATCHUP, MOCK_VOTE_RESULT } from "./fixtures/mock-data";

test.describe("Arena page", () => {
  test("arena - ready", async ({ page }) => {
    await loginViaUI(page);
    await expect(page).toHaveURL("/", { timeout: 15_000 });

    await page.unroute("**/api/v1/battles/next");
    await page.route("**/api/v1/battles/next", (route) =>
      route.fulfill({ json: MOCK_MATCHUP })
    );

    await page.goto("/arena");
    await expect(page.locator("h1")).toContainText("The Arena");
    await expect(page.locator("text=Distracted Boyfriend")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=Surprised Pikachu")).toBeVisible();
    await expect(page).toHaveScreenshot("arena-ready.png", { fullPage: true });
  });

  test("arena - revealed", async ({ page }) => {
    await loginViaUI(page);
    await expect(page).toHaveURL("/", { timeout: 15_000 });

    await page.unroute("**/api/v1/battles/next");
    await page.route("**/api/v1/battles/next", (route) =>
      route.fulfill({ json: MOCK_MATCHUP })
    );
    await page.route("**/api/v1/battles/matchup-001/vote", (route) =>
      route.fulfill({ json: MOCK_VOTE_RESULT })
    );

    await page.goto("/arena");
    await expect(page.locator("text=Distracted Boyfriend")).toBeVisible({ timeout: 10_000 });

    // Click the VoteButton for the left meme (meme A)
    const leftVoteBtn = page.locator('button[aria-label*="left"], button[aria-label*="Left"], button:has(img)').first();
    if (await leftVoteBtn.isVisible()) {
      await leftVoteBtn.click();
    } else {
      // Fallback: click the card itself
      await page.locator("text=Distracted Boyfriend").first().click();
    }

    // Wait for the revealed state — the phase changes to "revealed"
    await page.waitForTimeout(1500);
    await expect(page).toHaveScreenshot("arena-revealed.png", { fullPage: true });
  });

  test("arena - empty", async ({ page }) => {
    await loginViaUI(page);
    await expect(page).toHaveURL("/", { timeout: 15_000 });

    await page.unroute("**/api/v1/battles/next");
    await page.route("**/api/v1/battles/next", (route) =>
      route.fulfill({
        status: 400,
        json: { error: "NOT_ENOUGH_MEMES", message: "Not enough memes" },
      })
    );

    await page.goto("/arena");
    await expect(page.locator("text=Not enough memes")).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveScreenshot("arena-empty.png", { fullPage: true });
  });

  test("arena - loading", async ({ page }) => {
    await loginViaUI(page);
    await expect(page).toHaveURL("/", { timeout: 15_000 });

    await page.unroute("**/api/v1/battles/next");
    let resolveNext: (() => void) | null = null;
    await page.route("**/api/v1/battles/next", (route) =>
      new Promise<void>((resolve) => {
        resolveNext = resolve;
      }).then(() => route.fulfill({ json: MOCK_MATCHUP }))
    );

    await page.goto("/arena");
    await expect(page.locator("text=Dealing a matchup")).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveScreenshot("arena-loading.png", { fullPage: true });

    resolveNext?.();
  });
});
