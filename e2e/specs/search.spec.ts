import { expect, test } from "@playwright/test";
import { mockMovieSearch } from "../helpers/search-mocks";
import { MoviesPage } from "../pages/movies.page";
import { SearchPalettePage } from "../pages/search-palette.page";

const INCEPTION = {
  externalId: "27205",
  title: "Inception",
  year: 2010,
  imageUrl: null,
  externalRating: 8.4,
};

test("Cmd+K opens the palette, Escape closes it", async ({ page }) => {
  await page.goto("/dashboard");

  const palette = new SearchPalettePage(page);
  await palette.openWithShortcut();
  await expect(palette.hint).toBeVisible();
  await palette.closeWithEscape();
});

test("typing finds an added movie and clicking navigates with focus param", async ({ page }) => {
  await mockMovieSearch(page, [INCEPTION]);

  // Seed one item via the production add-item flow so the search has
  // something to match against. Keeps the test honest end-to-end.
  const movies = new MoviesPage(page);
  await movies.goto();
  await movies.openAddDialog();
  await movies.searchAndPick("inception", INCEPTION.title);
  await movies.confirmAdd();
  await movies.expectRow(INCEPTION.title);

  // Now drive the global search palette from a different page.
  await page.goto("/dashboard");
  const palette = new SearchPalettePage(page);
  await palette.openWithClick();
  await palette.type("ince");
  await expect(palette.result(INCEPTION.title)).toBeVisible();

  await palette.pickResult(INCEPTION.title);

  // Lands on the right hobby page with the focus param, and the row is visible.
  await expect(page).toHaveURL(/\/movies\?focus=[0-9a-f-]{8,}/i);
  await expect(movies.rowFor(INCEPTION.title)).toBeVisible();

  // RowFocus strips the param after the highlight animation; wait for it to clean up.
  await expect(page).toHaveURL(/\/movies$/, { timeout: 5_000 });
});
