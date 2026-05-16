import { expect } from "@playwright/test";
import { PageHolder } from "./base";

export class MoviesPage extends PageHolder {
  readonly heading = this.page.getByRole("heading", { level: 1, name: "Movies" });
  readonly addButton = this.page.getByRole("button", { name: "Add", exact: true });

  // Within the add dialog
  readonly dialog = this.page.getByRole("dialog");
  readonly searchInput = this.dialog.getByPlaceholder("Search...");
  readonly submitAddButton = this.dialog.getByRole("button", { name: "Add", exact: true });

  async goto() {
    await this.page.goto("/movies");
    await expect(this.heading).toBeVisible();
  }

  async openAddDialog() {
    await this.addButton.click();
    await expect(this.dialog).toBeVisible();
  }

  async searchAndPick(query: string, resultTitle: string) {
    await this.searchInput.fill(query);
    await this.dialog.getByRole("button", { name: resultTitle }).click();
  }

  async confirmAdd() {
    await this.submitAddButton.click();
    await expect(this.dialog).toBeHidden();
  }

  rowFor(title: string) {
    return this.page.getByRole("row", { name: new RegExp(title) });
  }

  async expectRow(title: string) {
    await expect(this.rowFor(title)).toBeVisible();
  }
}
