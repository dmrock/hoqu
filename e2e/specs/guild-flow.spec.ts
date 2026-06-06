import { App } from "../app";
import { expect, test } from "../fixtures/test";
import { STORAGE_STATE } from "../fixtures/users";

test("user A creates a guild, user B joins via invite code", async ({ page, app, browser }) => {
  // Unique name per run so retries don't collide on the unique guild name index.
  const guildName = `Test Guild ${Date.now()}`;

  // User A creates the guild and lands on its detail page.
  await app.guilds.goto();
  await app.guilds.createGuild(guildName);
  await expect(page).toHaveURL(/\/guilds\/[0-9a-f-]+$/);

  await app.guildDetail.waitForLoaded(guildName);
  await app.guildDetail.expectMemberCount(1, 50);
  const inviteCode = await app.guildDetail.readInviteCode();
  expect(inviteCode).toMatch(/^[A-Z0-9]{8}$/);

  // User B joins via the invite code from a separate context.
  const contextB = await browser.newContext({ storageState: STORAGE_STATE.userB });
  const pageB = await contextB.newPage();
  const appB = new App(pageB);
  await appB.guilds.goto();
  await appB.guilds.joinWithCode(inviteCode);
  await expect(pageB).toHaveURL(/\/guilds\/[0-9a-f-]+$/);

  await appB.guildDetail.waitForLoaded(guildName);
  await appB.guildDetail.expectMemberCount(2, 50);

  // User A also reflects the new count after reload.
  await page.reload();
  await app.guildDetail.expectMemberCount(2, 50);

  await contextB.close();
});
