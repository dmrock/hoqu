import path from "node:path";
import { expect, test as setup } from "@playwright/test";
import { STORAGE_STATE, USER_A, USER_B, USER_PASSWORD } from "../fixtures/users";
import { LoginPage } from "../pages/login.page";

const userAFile = path.join(process.cwd(), STORAGE_STATE.userA);
const userBFile = path.join(process.cwd(), STORAGE_STATE.userB);

setup("authenticate user A", async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.signIn(USER_A.email, USER_PASSWORD);
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.context().storageState({ path: userAFile });
});

setup("authenticate user B", async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.signIn(USER_B.email, USER_PASSWORD);
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.context().storageState({ path: userBFile });
});
