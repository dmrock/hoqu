import type { Page } from "@playwright/test";

export type MovieSearchResult = {
  externalId: string;
  title: string;
  year: number | null;
  imageUrl: string | null;
  externalRating: number | null;
};

/**
 * Intercept the movies search API so tests don't depend on TMDB being up,
 * rate-limited, or returning a different result set.
 */
export async function mockMovieSearch(page: Page, results: MovieSearchResult[]) {
  await page.route("**/api/search/movies*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: results }),
    });
  });
}
