import { expect } from "@playwright/test";
import { PageHolder } from "./base";

export class SettingsPage extends PageHolder {
  readonly heading = this.page.getByRole("heading", { name: "Settings", level: 1 });
  readonly currentPasswordInput = this.page.getByLabel("Current password", { exact: true });
  readonly newPasswordInput = this.page.getByLabel("New password", { exact: true });
  readonly updatePasswordButton = this.page.getByRole("button", { name: "Update password" });

  readonly deleteAccountTrigger = this.page.getByRole("button", { name: "Delete account" });
  readonly deleteDialog = this.page.getByRole("dialog");
  readonly confirmUsernameInput = this.deleteDialog.getByLabel("Username");
  readonly confirmDeleteButton = this.deleteDialog.getByRole("button", { name: "Delete account" });
  readonly cancelDeleteButton = this.deleteDialog.getByRole("button", { name: "Cancel" });

  async goto() {
    await this.page.goto("/settings");
    await expect(this.heading).toBeVisible();
  }

  async changePassword(current: string, next: string) {
    await this.currentPasswordInput.fill(current);
    await this.newPasswordInput.fill(next);
    await this.updatePasswordButton.click();
  }

  async openDeleteDialog() {
    await this.deleteAccountTrigger.click();
    await expect(this.deleteDialog).toBeVisible();
  }
}
