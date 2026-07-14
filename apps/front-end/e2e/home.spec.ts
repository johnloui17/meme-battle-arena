import { test, expect } from "@playwright/test";
import { loginViaUI } from "./helpers/auth";

test.describe("Home page", () => {
  test("home - logged out", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
    await expect(page.locator("text=Log in")).toBeVisible();
    await expect(page.locator("text=The Arena")).toBeVisible();
    await expect(page.locator("text=@ntrs/core + @ntrs/meme")).toBeVisible();
    await expect(page).toHaveScreenshot("home-logged-out.png", { fullPage: true });
  });

  test("home - logged in", async ({ page }) => {
    await loginViaUI(page);
    await expect(page).toHaveURL("/", { timeout: 15_000 });

    await expect(page.locator("text=Logged in as")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("link", { name: "Arena" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Upload a meme" })).toBeVisible();
    await expect(page.getByRole("link", { name: "My memes" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Leaderboard" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
    await expect(page).toHaveScreenshot("home-logged-in.png", { fullPage: true });
  });
});
