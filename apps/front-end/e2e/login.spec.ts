import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test("login - empty form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Log in");
    await expect(page.getByRole("textbox", { name: /email/i })).toBeEmpty();
    await expect(page.getByRole("textbox", { name: /password/i })).toBeEmpty();
    await expect(page).toHaveScreenshot("login-empty.png", { fullPage: true });
  });

  test("login - wrong credentials", async ({ page }) => {
    await page.route("**/api/v1/auth/login", (route) =>
      route.fulfill({
        status: 401,
        json: { error: "INVALID_CREDENTIALS", message: "Incorrect email or password." },
      })
    );

    await page.goto("/login");
    await page.getByRole("textbox", { name: /email/i }).fill("wrong@example.com");
    await page.getByRole("textbox", { name: /password/i }).fill("wrongpassword");
    await page.getByRole("button", { name: /log in/i }).click();

    await expect(page.locator("text=Incorrect email or password")).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveScreenshot("login-wrong-credentials.png", { fullPage: true });
  });
});
