import { expect, test } from "@playwright/test";
import { USER_PASSWORD } from "../fixtures/users";
import { DashboardPage } from "../pages/dashboard.page";
import { LoginPage } from "../pages/login.page";
import { RegisterPage } from "../pages/register.page";
import { Sidebar } from "../pages/sidebar";

test("user can register, sign out, and sign back in", async ({ page }) => {
  // Use a unique email so reruns within the same global-setup cycle don't collide.
  const stamp = Date.now();
  const email = `register-${stamp}@e2e.test`;
  const localPart = `register-${stamp}`;

  const register = new RegisterPage(page);
  await register.goto();
  await register.register(email, USER_PASSWORD);

  const dashboard = new DashboardPage(page);
  await dashboard.waitForLoaded();
  // Name on the welcome heading defaults to the email local part on first register.
  await dashboard.expectWelcome(localPart);

  // Sign out via the sidebar profile menu.
  const sidebar = new Sidebar(page);
  await sidebar.signOut();
  await expect(page).toHaveURL(/\/login(\?.*)?$/);

  // Sign back in with the same credentials.
  const login = new LoginPage(page);
  await login.goto();
  await login.signIn(email, USER_PASSWORD);
  await expect(page).toHaveURL(/\/dashboard$/);
  await dashboard.expectWelcome(localPart);
});
