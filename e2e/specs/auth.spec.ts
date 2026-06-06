import { FIRST_NAV_TIMEOUT_MS } from "../constants";
import { expect, test } from "../fixtures/test";
import { USER_PASSWORD } from "../fixtures/users";

test("user can register, sign out, and sign back in", async ({ page, app }) => {
  // Use a unique email so reruns within the same global-setup cycle don't collide.
  const stamp = Date.now();
  const email = `register-${stamp}@e2e.test`;
  const localPart = `register-${stamp}`;

  await app.register.goto();
  await app.register.register(email, USER_PASSWORD);

  await app.dashboard.waitForLoaded();
  // Name on the welcome heading defaults to the email local part on first register.
  await app.dashboard.expectWelcome(localPart);

  // Sign out via the sidebar profile menu.
  // Auth.js sign-out POST + /login compile have flaked at the default 5s on
  // CI runners; bump just this assertion's timeout so we don't have to raise
  // it globally. Same story for the post-sign-in /dashboard redirect below.
  await app.sidebar.signOut();
  await expect(page).toHaveURL(/\/login(\?.*)?$/, { timeout: FIRST_NAV_TIMEOUT_MS });

  // Sign back in with the same credentials.
  await app.login.goto();
  await app.login.signIn(email, USER_PASSWORD);
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: FIRST_NAV_TIMEOUT_MS });
  await app.dashboard.expectWelcome(localPart);
});
