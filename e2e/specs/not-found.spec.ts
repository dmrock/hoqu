import { eq } from "drizzle-orm";
import { db } from "../../src/lib/db";
import { users } from "../../src/lib/db/schema";
import { expect, test } from "../fixtures/test";
import { USER_B } from "../fixtures/users";

function setProfileVisibility(username: string, visibility: "public" | "private") {
  return db
    .update(users)
    .set({ profileVisibility: visibility })
    .where(eq(users.username, username));
}

test("authed 404s render the themed page instead of the stock screen", async ({ page, app }) => {
  // A private profile must be indistinguishable from a username that was
  // never registered, so existence can't be probed. Both render the themed
  // 404 with the same HTTP status (200: the profile loading.tsx flushes the
  // shell before notFound() throws, so the status is already committed).
  // workers=1 means flipping userB's visibility can't race another spec;
  // restored in finally either way.
  await setProfileVisibility(USER_B.username, "private");
  let privateStatus: number | undefined;
  try {
    const privateResponse = await page.goto(`/profile/${USER_B.username}`);
    privateStatus = privateResponse?.status();
    await expect(app.notFound.heading).toBeVisible();
  } finally {
    await setProfileVisibility(USER_B.username, "public");
  }

  const unknownResponse = await page.goto("/profile/never-registered");
  expect(unknownResponse?.status()).toBe(privateStatus);
  await expect(app.notFound.heading).toBeVisible();

  // A bogus authed URL falls through the (main) catch-all into the same
  // boundary, inside the sidebar layout (<aside> = complementary landmark).
  const typoResponse = await page.goto("/movies-typo");
  expect(typoResponse?.status()).toBe(404);
  await expect(app.notFound.heading).toBeVisible();
  await expect(page.getByRole("complementary")).toBeVisible();

  await app.notFound.backToDashboard.click();
  await expect(page).toHaveURL(/\/dashboard$/);
});
