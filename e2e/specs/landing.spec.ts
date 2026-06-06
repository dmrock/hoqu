import { FIRST_NAV_TIMEOUT_MS } from "../constants";
import { expect, test } from "../fixtures/test";

// Locks in the proxy contract from src/proxy.ts:
//   - `/` is public — unauthed visitors land on the marketing page, not /login.
//   - Authed visitors at `/` are bounced to /dashboard so the landing never
//     renders post-sign-in.
test.describe("landing page", () => {
  test.describe("unauthenticated visitor", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("sees the landing at / without redirect to /login", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(/Log what you watch/i);
      await expect(page.getByRole("link", { name: /get started/i })).toBeVisible();
    });
  });

  test("authenticated visitor at / is redirected to /dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: FIRST_NAV_TIMEOUT_MS });
  });
});
