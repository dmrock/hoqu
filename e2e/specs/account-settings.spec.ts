import { expect, test } from "../fixtures/test";
import { USER_A } from "../fixtures/users";

test.describe("account settings", () => {
  test("renders the account management sections", async ({ app }) => {
    await app.settings.goto();
    await expect(app.page.getByRole("heading", { name: "Password" })).toBeVisible();
    await expect(app.page.getByRole("heading", { name: "Email" })).toBeVisible();
    await expect(app.page.getByRole("heading", { name: "Danger zone" })).toBeVisible();
  });

  test("rejects a wrong current password without changing it", async ({ app }) => {
    await app.settings.goto();
    await app.settings.changePassword("definitely-not-my-password", "some-new-password-1");
    await expect(app.page.getByText("Current password is incorrect")).toBeVisible();
  });

  test("delete confirm stays disabled until the exact username is typed", async ({ app }) => {
    await app.settings.goto();
    await app.settings.openDeleteDialog();

    await expect(app.settings.confirmDeleteButton).toBeDisabled();
    await app.settings.confirmUsernameInput.fill("wrong-name");
    await expect(app.settings.confirmDeleteButton).toBeDisabled();
    await app.settings.confirmUsernameInput.fill(USER_A.username);
    await expect(app.settings.confirmDeleteButton).toBeEnabled();

    // Cancel rather than confirm — this test user must survive the suite.
    await app.settings.cancelDeleteButton.click();
    await expect(app.settings.deleteDialog).toBeHidden();
  });
});

test("settings is reachable from the sidebar profile menu", async ({ app, page }) => {
  await app.explore.goto();
  await app.sidebar.profileMenuButton.click();
  await page.getByRole("menuitem", { name: "Settings" }).click();
  await expect(page).toHaveURL(/\/settings$/);
});
