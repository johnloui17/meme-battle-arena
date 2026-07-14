import type { Page } from "@playwright/test";

export const MOCK_USER = {
  id: "user-test-001",
  email: "tester@example.com",
  display_name: "Tester",
};

function createMockJWT(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.mock-signature`;
}

export const MOCK_TOKEN = createMockJWT({
  sub: MOCK_USER.id,
  display_name: MOCK_USER.display_name,
  exp: Math.floor(Date.now() / 1000) + 86400,
});

/** Set up common API mocks that don't depend on auth. */
export async function mockCommonAPIs(page: Page): Promise<void> {
  await page.route("**/api/v1/memes*", (route) =>
    route.fulfill({
      json: {
        data: [],
        pagination: { page: 1, page_size: 25, total_items: 0, total_pages: 0 },
      },
    })
  );

  await page.route("**/api/v1/leaderboard*", (route) =>
    route.fulfill({
      json: {
        data: [],
        pagination: { page: 1, page_size: 25, total_items: 0, total_pages: 0 },
      },
    })
  );

  await page.route("**/api/v1/battles/next", (route) =>
    route.fulfill({
      status: 400,
      json: { error: "NOT_ENOUGH_MEMES", message: "Not enough memes" },
    })
  );
}

/**
 * Logs in via the UI with mocked API. Call this before navigating
 * to any protected route.
 */
export async function loginViaUI(page: Page): Promise<void> {
  await page.route("**/api/v1/auth/login", (route) =>
    route.fulfill({
      json: { access_token: MOCK_TOKEN, user: MOCK_USER },
    })
  );

  await mockCommonAPIs(page);

  await page.goto("/login");
  await page.getByRole("textbox", { name: /email/i }).fill(MOCK_USER.email);
  await page.getByRole("textbox", { name: /password/i }).fill("supersecret123");
  await page.getByRole("button", { name: /log in/i }).click();
}
