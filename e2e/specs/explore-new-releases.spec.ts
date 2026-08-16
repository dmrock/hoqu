import { test } from "../fixtures/test";

const FIXTURE_MOVIE_TITLE = "Fixture Movie One";

test("adding a movie from the Explore new-releases row works end-to-end", async ({ app }) => {
  await app.explore.goto();

  const dialog = await app.explore.openAddFromPoster(FIXTURE_MOVIE_TITLE);
  await dialog.expectItem(FIXTURE_MOVIE_TITLE);
  // New-releases adds default to "Planned" (no points), unlike the hobby-page add.
  await dialog.expectStatus("Planned");
  await dialog.confirm();

  await app.movies.goto();
  await app.movies.expectRow(FIXTURE_MOVIE_TITLE);

  await app.explore.goto();
  await app.explore.expectPosterOwned(FIXTURE_MOVIE_TITLE);
});
