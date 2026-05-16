import { expect, test } from "@playwright/test";
import { STORAGE_STATE, USER_A, USER_B } from "../fixtures/users";
import { FriendsPage } from "../pages/friends.page";

test("user A sends friend request, user B accepts, both see each other", async ({
  page,
  browser,
}) => {
  // Page is signed in as user A via the project storageState.
  const friendsA = new FriendsPage(page);
  await friendsA.goto();
  await friendsA.sendRequestTo(USER_B.username);
  // Outgoing pending entry appears (link to userB's profile).
  await expect(friendsA.friendRowLink(USER_B.name)).toBeVisible();

  // User B in a separate context.
  const contextB = await browser.newContext({ storageState: STORAGE_STATE.userB });
  const pageB = await contextB.newPage();
  const friendsB = new FriendsPage(pageB);
  await friendsB.goto();

  // Incoming request from user A → accept.
  await expect(friendsB.friendRowLink(USER_A.name)).toBeVisible();
  await friendsB.acceptFirstIncoming();

  // Reload user A's page; the entry has moved to the accepted Friends section.
  await page.reload();
  await expect(page.getByRole("heading", { name: /Friends \(1\)/ })).toBeVisible();
  await expect(friendsA.friendRowLink(USER_B.name)).toBeVisible();

  await contextB.close();
});
