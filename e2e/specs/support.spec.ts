import { expect, test } from "../fixtures/test";

// Same proxy contract as /features: the support page has to be reachable by a
// logged-out visitor, because "I can't sign in" is one of the things it exists
// to answer. It also carries the issue-form links every other surface routes to.
test.describe("support page", () => {
  test.describe("unauthenticated visitor", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("sees the support page at /support without redirect to /login", async ({ page }) => {
      await page.goto("/support");
      await expect(page).toHaveURL(/\/support$/);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(/support/i);

      const tracker = page.getByRole("link", { name: /open the issue tracker/i });
      await expect(tracker).toBeVisible();
      await expect(tracker).toHaveAttribute("href", /github\.com\/.+\/issues$/);

      // Each lane deep-links into its own issue form; a renamed template file
      // would break these silently otherwise.
      await expect(page.getByRole("link", { name: /file a bug report/i })).toHaveAttribute(
        "href",
        /issues\/new\?template=bug_report\.yml$/,
      );
      await expect(page.getByRole("link", { name: /open a feature request/i })).toHaveAttribute(
        "href",
        /issues\/new\?template=feature_request\.yml$/,
      );
    });
  });

  // The page lives outside the (main) route group, so it renders its own
  // chrome — without this it strands a signed-in reader on a page with no way
  // back into the app.
  test("keeps the sidebar for a signed-in reader", async ({ page }) => {
    await page.goto("/support");
    await expect(page.getByRole("link", { name: "Explore" })).toBeVisible();
    await expect(page.getByRole("link", { name: /open the issue tracker/i })).toBeVisible();
  });
});
