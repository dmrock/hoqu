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

  await app.movies.goto();
  await app.movies.openAddDialog();
  await app.movies.searchAndPick("inception", INCEPTION.title);
  await app.movies.confirmAdd();

  // The row shows up in the movies table.
  await app.movies.expectRow(INCEPTION.title);

  // First Step achievement toast appears on the same page (toaster is global).
  await expect(page.getByText("Achievement unlocked")).toBeVisible();
  await expect(page.getByText("First Step")).toBeVisible();

  // Dashboard counters tick: total points = 1, movies completed = 1.
  await app.dashboard.goto();
  expect(await app.dashboard.statValue("Total points")).toBe(1);
  expect(await app.dashboard.statValue("Items completed")).toBeGreaterThanOrEqual(1);
});
