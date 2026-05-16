import { expect, test } from "@playwright/test";
import { STORAGE_STATE } from "../fixtures/users";
import { GuildDetailPage } from "../pages/guild-detail.page";
import { GuildsPage } from "../pages/guilds.page";

test("user A creates a guild, user B joins via invite code", async ({ page, browser }) => {
  // Unique name per run so retries don't collide on the unique guild name index.
  const guildName = `Test Guild ${Date.now()}`;

  // User A creates the guild and lands on its detail page.
  const guildsA = new GuildsPage(page);
  await guildsA.goto();
  await guildsA.createGuild(guildName);
  await expect(page).toHaveURL(/\/guilds\/[0-9a-f-]+$/);

  const detailA = new GuildDetailPage(page);
  await detailA.waitForLoaded(guildName);
  await detailA.expectMemberCount(1, 50);
  const inviteCode = await detailA.readInviteCode();
  expect(inviteCode).toMatch(/^[A-Z0-9]{8}$/);

  // User B joins via the invite code from a separate context.
  const contextB = await browser.newContext({ storageState: STORAGE_STATE.userB });
  const pageB = await contextB.newPage();
  const guildsB = new GuildsPage(pageB);
  await guildsB.goto();
  await guildsB.joinWithCode(inviteCode);
  await expect(pageB).toHaveURL(/\/guilds\/[0-9a-f-]+$/);

  const detailB = new GuildDetailPage(pageB);
  await detailB.waitForLoaded(guildName);
  await detailB.expectMemberCount(2, 50);

  // User A also reflects the new count after reload.
  await page.reload();
  await detailA.expectMemberCount(2, 50);

  await contextB.close();
});
