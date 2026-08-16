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

  await app.explore.waitForLoaded();
  // Name on the welcome heading defaults to the email local part on first register.
  await app.explore.expectWelcome(localPart);

  // Sign out via the sidebar profile menu.
  // Auth.js sign-out POST + /login compile have flaked at the default 5s on
  // CI runners; bump just this assertion's timeout so we don't have to raise
  // it globally. Same story for the post-sign-in /explore redirect below.
  await app.sidebar.signOut();
  await expect(page).toHaveURL(/\/login(\?.*)?$/, { timeout: FIRST_NAV_TIMEOUT_MS });

  // Sign back in with the same credentials.
  await app.login.goto();
  await app.login.signIn(email, USER_PASSWORD);
  await expect(page).toHaveURL(/\/explore$/, { timeout: FIRST_NAV_TIMEOUT_MS });
  await app.explore.expectWelcome(localPart);
});

test("login links to forgot password, which acknowledges any email", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);

  await page.getByRole("textbox", { name: "Email" }).fill("nobody@e2e.test");
  await page.getByRole("button", { name: "Send reset link" }).click();
  // Generic acknowledgement — never reveals whether the account exists.
  await expect(page.getByText(/we've sent a link/i)).toBeVisible();
});

test("reset password without a token tells the user to request a new link", async ({ page }) => {
  await page.goto("/reset-password");
  await expect(page.getByText(/missing its token/i)).toBeVisible();
  await expect(page.getByRole("link", { name: "Request a new link" })).toBeVisible();
});

test("login tabs email -> password and keeps the email after a failed attempt", async ({
  page,
  app,
}) => {
  await app.login.goto();

  // Tab from email lands on the password field, not the "Forgot password?" link.
  await app.login.emailInput.fill("someone@e2e.test");
  await app.login.emailInput.press("Tab");
  await expect(app.login.passwordInput).toBeFocused();

  await app.login.passwordInput.fill("definitely-wrong");
  await app.login.submitButton.click();

  await expect(page.getByText("Invalid email or password")).toBeVisible();
  // Email survives the post-action form reset; password is intentionally cleared.
  await expect(app.login.emailInput).toHaveValue("someone@e2e.test");
});
