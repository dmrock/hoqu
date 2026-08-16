import { expect, test } from "../fixtures/test";
import { mockMovieSearch } from "../helpers/search-mocks";

const INCEPTION = {
  externalId: "27205",
  title: "Inception",
  year: 2010,
  imageUrl: null,
  externalRating: 8.4,
};

test("adding a movie ticks the points counter and unlocks First Step", async ({ page, app }) => {
  await mockMovieSearch(page, [INCEPTION]);

  // The e2e branch is shared across specs, so capture a baseline and assert a
  // delta rather than an absolute total.
  await app.explore.goto();
  const pointsBefore = await app.explore.statValue("Total points");
  const completedBefore = await app.explore.statValue("Items completed");

  await app.movies.goto();
  await app.movies.openAddDialog();
  await app.movies.searchAndPick("inception", INCEPTION.title);
  await app.movies.confirmAdd();

  // The row shows up in the movies table.
  await app.movies.expectRow(INCEPTION.title);

  // First Step achievement toast appears on the same page (toaster is global).
  await expect(page.getByText("Achievement unlocked")).toBeVisible();
  await expect(page.getByText("First Step")).toBeVisible();

  // Movies are worth 1 point; completing one ticks both counters by exactly one.
  await app.explore.goto();
  expect(await app.explore.statValue("Total points")).toBe(pointsBefore + 1);
  expect(await app.explore.statValue("Items completed")).toBe(completedBefore + 1);
});
