import { expect, test } from "../fixtures/test";
import { USER_A } from "../fixtures/users";
import { deleteSeededItem, seedItem } from "../helpers/seed";

// Unique to the search spec so it doesn't collide with whatever add-item.spec.ts
// seeded for the same user. Title is intentionally not in any other spec.
const SEED_TITLE = "Search Palette Probe";
const SEED_EXTERNAL_ID = "search-spec-probe-001";

test.beforeAll(async () => {
  // status "completed" so the row survives the hobby page's `status IN (...)`
  // filter — without it RowFocus can't find #item-<id> and strips the ?focus=
  // param synchronously, so the E2E never sees it.
  await seedItem({
    email: USER_A.email,
    hobbySlug: "movies",
    title: SEED_TITLE,
    externalId: SEED_EXTERNAL_ID,
    year: 2026,
    status: "completed",
  });
});

test.afterAll(async () => {
  await deleteSeededItem(USER_A.email, SEED_EXTERNAL_ID);
});

test("Cmd+K opens the palette, Escape closes it", async ({ page, app }) => {
  await page.goto("/dashboard");

  await app.searchPalette.openWithShortcut();
  await expect(app.searchPalette.hint).toBeVisible();
  await app.searchPalette.closeWithEscape();
});

test("typing finds a seeded item and clicking navigates with focus param", async ({
  page,
  app,
}) => {
  await page.goto("/dashboard");
  await app.searchPalette.openWithClick();
  await app.searchPalette.type("probe");
  await expect(app.searchPalette.result(SEED_TITLE)).toBeVisible();

  await app.searchPalette.pickResult(SEED_TITLE);

  // Lands on /movies with the focus param. RowFocus keeps it for ~1.8s while
  // the row pulses, then replaces the URL with no params. We verify (a) the
  // param appeared (catches a regression where the palette stops passing it
  // through) and (b) the row actually rendered (catches a regression where
  // the focus target falls outside the default status filter).
  await expect(page).toHaveURL(/\/movies\?focus=[0-9a-f-]{8,}/i);
  await expect(page.getByText(SEED_TITLE).first()).toBeVisible();
});
