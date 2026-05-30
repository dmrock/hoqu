import { expect, test } from "@playwright/test";
import { and, eq } from "drizzle-orm";
import { db } from "../../src/lib/db";
import { hobbies, items, users } from "../../src/lib/db/schema";
import { USER_A } from "../fixtures/users";
import { SearchPalettePage } from "../pages/search-palette.page";

// Unique to the search spec so it doesn't collide with whatever add-item.spec.ts
// seeded for the same user. Title is intentionally not in any other spec.
const SEED_TITLE = "Search Palette Probe";
const SEED_EXTERNAL_ID = "search-spec-probe-001";

test.beforeAll(async () => {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, USER_A.email))
    .limit(1);
  if (!user) throw new Error(`USER_A (${USER_A.email}) not found in DB`);

  const [hobby] = await db
    .select({ id: hobbies.id })
    .from(hobbies)
    .where(eq(hobbies.slug, "movies"))
    .limit(1);
  if (!hobby) throw new Error("movies hobby not seeded");

  // Idempotent so retries / re-runs in the same Playwright session don't trip
  // the (user_id, hobby_id, external_id) unique constraint.
  // status must be set: the hobby page filters with `status IN (...)`, which
  // excludes NULL, so a status-less row would never render. Without it RowFocus
  // can't find #item-<id> and strips the ?focus= param synchronously, so the
  // E2E never sees it.
  await db
    .insert(items)
    .values({
      userId: user.id,
      hobbyId: hobby.id,
      title: SEED_TITLE,
      externalId: SEED_EXTERNAL_ID,
      year: 2026,
      status: "completed",
    })
    .onConflictDoNothing();
});

test.afterAll(async () => {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, USER_A.email))
    .limit(1);
  if (!user) return;
  await db
    .delete(items)
    .where(and(eq(items.userId, user.id), eq(items.externalId, SEED_EXTERNAL_ID)));
});

test("Cmd+K opens the palette, Escape closes it", async ({ page }) => {
  await page.goto("/dashboard");

  const palette = new SearchPalettePage(page);
  await palette.openWithShortcut();
  await expect(palette.hint).toBeVisible();
  await palette.closeWithEscape();
});

test("typing finds a seeded item and clicking navigates with focus param", async ({ page }) => {
  await page.goto("/dashboard");
  const palette = new SearchPalettePage(page);
  await palette.openWithClick();
  await palette.type("probe");
  await expect(palette.result(SEED_TITLE)).toBeVisible();

  await palette.pickResult(SEED_TITLE);

  // Lands on /movies with the focus param. RowFocus keeps it for ~1.8s while
  // the row pulses, then replaces the URL with no params. We verify (a) the
  // param appeared (catches a regression where the palette stops passing it
  // through) and (b) the row actually rendered (catches a regression where
  // the focus target falls outside the default status filter).
  await expect(page).toHaveURL(/\/movies\?focus=[0-9a-f-]{8,}/i);
  await expect(page.getByText(SEED_TITLE).first()).toBeVisible();
});
