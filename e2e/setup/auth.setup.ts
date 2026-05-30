import path from "node:path";
import { expect, test as setup } from "@playwright/test";
import { STORAGE_STATE, USER_A, USER_B, USER_PASSWORD } from "../fixtures/users";
import { LoginPage } from "../pages/login.page";

const userAFile = path.join(process.cwd(), STORAGE_STATE.userA);
const userBFile = path.join(process.cwd(), STORAGE_STATE.userB);

// First /dashboard visit per CI run pays the Turbopack first-compile cost
// (we run e2e against `pnpm dev`, not a prod build), which has been observed
// to exceed the default 5s expect timeout. Bumped narrowly here rather than
// globally so real assertion failures still report quickly.
const FIRST_NAV_TIMEOUT_MS = 15_000;

setup("authenticate user A", async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.signIn(USER_A.email, USER_PASSWORD);
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: FIRST_NAV_TIMEOUT_MS });
  await page.context().storageState({ path: userAFile });
});

setup("authenticate user B", async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.signIn(USER_B.email, USER_PASSWORD);
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: FIRST_NAV_TIMEOUT_MS });
  await page.context().storageState({ path: userBFile });
});
