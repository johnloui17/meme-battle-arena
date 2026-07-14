import { test, expect } from "@playwright/test";

test.describe("Register page", () => {
  test("register - empty form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("h1")).toContainText("Create an account");
    await expect(page.getByRole("textbox", { name: /display name/i })).toBeEmpty();
    await expect(page.getByRole("textbox", { name: /email/i })).toBeEmpty();
    await expect(page.getByRole("textbox", { name: /password/i })).toBeEmpty();
    await expect(page).toHaveScreenshot("register-empty.png", { fullPage: true });
  });

  test("register - validation error", async ({ page }) => {
    // Mock a server-side validation error for a password that passes HTML5 minLength
    await page.route("**/api/v1/auth/register", (route) =>
      route.fulfill({
        status: 422,
        json: { error: "VALIDATION_ERROR", message: "Password must contain a number." },
      })
    );

    await page.goto("/register");
    await page.getByRole("textbox", { name: /display name/i }).fill("TestUser");
    await page.getByRole("textbox", { name: /email/i }).fill("test@example.com");
    await page.getByRole("textbox", { name: /password/i }).fill("noNumbersHere");
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page.locator("text=Password must contain a number")).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveScreenshot("register-validation-error.png", { fullPage: true });
  });
});
