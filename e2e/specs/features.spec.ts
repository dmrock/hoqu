import { expect, test } from "../fixtures/test";

// Locks in the proxy contract from src/proxy.ts: `/features` is public, so a
// logged-out visitor (the search audience) must reach it without being bounced
// to /login. If this breaks, the page is invisible to the people it's for.
test.describe("features page", () => {
  test.describe("unauthenticated visitor", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("sees the features page at /features without redirect to /login", async ({ page }) => {
      await page.goto("/features");
      await expect(page).toHaveURL(/\/features$/);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        /Everything HOQU can do/i,
      );
      await expect(page.getByRole("link", { name: /get started/i })).toBeVisible();
    });
  });
});
