import { App } from "../app";
import { expect, test } from "../fixtures/test";
import { STORAGE_STATE, USER_A, USER_B } from "../fixtures/users";

test("friend request flow: badges the addressee's nav, both see each other after accept", async ({
  page,
  app,
  browser,
}) => {
  // Page is signed in as user A via the project storageState.
  await app.friends.goto();
  await app.friends.sendRequestTo(USER_B.username);
  // Outgoing pending entry appears (link to userB's profile).
  await expect(app.friends.friendRowLink(USER_B.name)).toBeVisible();

  // User B in a separate context: the pending request badges the Friends nav,
  // visible on any authed page (here the dashboard).
  const contextB = await browser.newContext({ storageState: STORAGE_STATE.userB });
  const pageB = await contextB.newPage();
  const appB = new App(pageB);
  await appB.dashboard.goto();
  await expect(appB.sidebar.friendRequestBadge).toHaveText("1");

  // Incoming request from user A → accept. The badge clears without a manual
  // reload because acceptFriendRequest revalidates "/friends" (the layout query).
  await appB.friends.goto();
  await expect(appB.friends.friendRowLink(USER_A.name)).toBeVisible();
  await appB.friends.acceptFirstIncoming();
  await expect(appB.sidebar.friendRequestBadge).toHaveCount(0);

  // Reload user A's page; the entry has moved to the accepted Friends section.
  await page.reload();
  await expect(page.getByRole("heading", { name: /Friends \(1\)/ })).toBeVisible();
  await expect(app.friends.friendRowLink(USER_B.name)).toBeVisible();

  await contextB.close();
});
