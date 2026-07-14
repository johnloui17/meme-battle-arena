import { test, expect } from "@playwright/test";
import { loginViaUI } from "./helpers/auth";
import path from "node:path";

const TEST_IMAGE = path.join(__dirname, "fixtures/test-images/test-meme.png");

test.describe("Upload page", () => {
  test("upload - empty form", async ({ page }) => {
    await loginViaUI(page);
    await expect(page).toHaveURL("/", { timeout: 15_000 });

    await page.goto("/upload");
    await expect(page.locator("h1")).toContainText("Upload a meme");
    await expect(page.getByRole("textbox", { name: /title/i })).toBeEmpty();
    await expect(page.getByRole("button", { name: "Upload", exact: true })).toBeDisabled();
    await expect(page).toHaveScreenshot("upload-empty.png", { fullPage: true });
  });

  test("upload - file selected", async ({ page }) => {
    await loginViaUI(page);
    await expect(page).toHaveURL("/", { timeout: 15_000 });

    await page.goto("/upload");

    const dropzoneBtn = page.getByRole("button", { name: /choose an image/i });
    await expect(dropzoneBtn).toBeVisible();

    const fileChooserPromise = page.waitForEvent("filechooser");
    await dropzoneBtn.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(TEST_IMAGE);

    // The dropzone should show a preview state after file selection
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot("upload-file-selected.png", { fullPage: true });
  });

  test("upload - with title", async ({ page }) => {
    await loginViaUI(page);
    await expect(page).toHaveURL("/", { timeout: 15_000 });

    await page.goto("/upload");
    await page.getByRole("textbox", { name: /title/i }).fill("My Test Meme");

    const dropzoneBtn = page.getByRole("button", { name: /choose an image/i });
    const fileChooserPromise = page.waitForEvent("filechooser");
    await dropzoneBtn.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(TEST_IMAGE);

    await page.waitForTimeout(1000);
    await expect(page.getByRole("button", { name: "Upload", exact: true })).toBeEnabled();
    await expect(page).toHaveScreenshot("upload-with-title.png", { fullPage: true });
  });

  test("upload - submitting", async ({ page }) => {
    await loginViaUI(page);
    await expect(page).toHaveURL("/", { timeout: 15_000 });

    let resolveUpload: (() => void) | null = null;
    await page.route("**/api/v1/memes", (route) => {
      if (route.request().method() === "POST") {
        new Promise<void>((resolve) => {
          resolveUpload = resolve;
        }).then(() =>
          route.fulfill({
            json: {
              id: "new-meme-001",
              title: "My Test Meme",
              image_url: "/uploads/new-meme-001.jpg",
              rating: 1000,
              wins: 0,
              losses: 0,
              created_at: new Date().toISOString(),
            },
          })
        );
      } else {
        route.fallback();
      }
    });

    await page.goto("/upload");
    await page.getByRole("textbox", { name: /title/i }).fill("My Test Meme");

    const dropzoneBtn = page.getByRole("button", { name: /choose an image/i });
    const fileChooserPromise = page.waitForEvent("filechooser");
    await dropzoneBtn.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(TEST_IMAGE);

    await page.waitForTimeout(1000);
    await page.getByRole("button", { name: "Upload", exact: true }).click();

    await expect(page.getByRole("button", { name: /uploading/i })).toBeVisible({ timeout: 5_000 });
    await expect(page).toHaveScreenshot("upload-submitting.png", { fullPage: true });

    resolveUpload?.();
  });
});
