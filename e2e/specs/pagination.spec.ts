import { expect, test } from "../fixtures/test";
import { USER_A } from "../fixtures/users";
import { deleteSeededItems, seedItems } from "../helpers/seed";

// 55 items: enough to spill onto page 2 (page size 50) even if no other spec
// added movies for this user, without assuming an exact grand total. Titles are
// zero-padded so title-asc ordering is deterministic across pages.
const PROBE_COUNT = 55;
const probes = Array.from({ length: PROBE_COUNT }, (_, i) => {
  const n = String(i + 1).padStart(3, "0");
  return {
    title: `Pagination Probe ${n}`,
    externalId: `pagination-probe-${n}`,
    year: 2000,
    status: "completed" as const,
  };
});
const LAST_PROBE = probes[PROBE_COUNT - 1];

let idsByExternalId: Map<string, string>;

test.beforeAll(async () => {
  idsByExternalId = await seedItems({
    email: USER_A.email,
    hobbySlug: "movies",
    rows: probes,
  });
});

test.afterAll(async () => {
  await deleteSeededItems(
    USER_A.email,
    probes.map((p) => p.externalId),
  );
});

test("movies list caps a page at 50 rows and Next reaches the rest", async ({ page }) => {
  await page.goto("/movies?sort=title-asc");

  await expect(page.locator("tbody tr")).toHaveCount(50);
  await expect(page.getByText(/^Page 1 of \d+$/)).toBeVisible();
  // First page: Previous is an inert button, Next is a link.
  await expect(page.getByRole("button", { name: "Previous" })).toBeDisabled();

  await page.getByRole("link", { name: "Next" }).click();

  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByRole("row", { name: LAST_PROBE.title })).toBeVisible();
  await expect(page.getByRole("link", { name: "Previous" })).toBeVisible();
});

test("a ?focus= link to an item beyond page 1 lands on its page and stays there", async ({
  page,
}) => {
  const focusId = idsByExternalId.get(LAST_PROBE.externalId);
  if (!focusId) throw new Error("probe item not seeded");

  await page.goto(`/movies?sort=title-asc&focus=${focusId}`);

  // The server resolves the item's page and redirects with an explicit page=.
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByRole("row", { name: LAST_PROBE.title })).toBeVisible();

  // After the highlight pulse RowFocus strips ?focus= — the page param must
  // survive, or the user gets bounced back to page 1 mid-look.
  await expect(page).toHaveURL(/\?sort=title-asc&page=2$/, { timeout: 5_000 });
  await expect(page.getByRole("row", { name: LAST_PROBE.title })).toBeVisible();
});
