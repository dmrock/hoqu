import { expect, test } from "@playwright/test";
import { mockMovieSearch } from "../helpers/search-mocks";
import { DashboardPage } from "../pages/dashboard.page";
import { MoviesPage } from "../pages/movies.page";

const INCEPTION = {
  externalId: "27205",
  title: "Inception",
  year: 2010,
  imageUrl: null,
  externalRating: 8.4,
};

test("adding a movie ticks the points counter and unlocks First Step", async ({ page }) => {
  await mockMovieSearch(page, [INCEPTION]);

  const movies = new MoviesPage(page);
  await movies.goto();
  await movies.openAddDialog();
  await movies.searchAndPick("inception", INCEPTION.title);
  await movies.confirmAdd();

  // The row shows up in the movies table.
  await movies.expectRow(INCEPTION.title);

  // First Step achievement toast appears on the same page (toaster is global).
  await expect(page.getByText("Achievement unlocked")).toBeVisible();
  await expect(page.getByText("First Step")).toBeVisible();

  // Dashboard counters tick: total points = 1, movies completed = 1.
  const dashboard = new DashboardPage(page);
  await dashboard.goto();
  expect(await dashboard.statValue("Total points")).toBe(1);
  expect(await dashboard.statValue("Items completed")).toBeGreaterThanOrEqual(1);
});
