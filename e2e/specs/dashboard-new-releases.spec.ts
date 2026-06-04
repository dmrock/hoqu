import { expect, test } from "../fixtures/test";

const FIXTURE_MOVIE_TITLE = "Fixture Movie One";

test("adding a movie from the dashboard new-releases row works end-to-end", async ({
  page,
  app,
}) => {
  await app.dashboard.goto();

  await page.getByRole("button", { name: `Add ${FIXTURE_MOVIE_TITLE} to collection` }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(FIXTURE_MOVIE_TITLE)).toBeVisible();
  // getByRole("combobox") doesn't match the Radix Select trigger reliably across
  // versions; getByLabel hits it via the <Label htmlFor="status"> association.
  await expect(dialog.getByLabel("Status")).toContainText("Planned");

  await dialog.getByRole("button", { name: "Add", exact: true }).click();
  await expect(dialog).toBeHidden();

  await page.goto("/movies");
  await expect(page.getByRole("row", { name: new RegExp(FIXTURE_MOVIE_TITLE) })).toBeVisible();

  await app.dashboard.goto();
  const ownedPoster = page.getByRole("button", {
    name: `Add ${FIXTURE_MOVIE_TITLE} to collection`,
  });
  await expect(ownedPoster).toBeDisabled();
  await expect(ownedPoster.getByText("Owned")).toBeVisible();
});
