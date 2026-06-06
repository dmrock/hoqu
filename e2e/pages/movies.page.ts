import { expect } from "@playwright/test";
import { AddItemDialog } from "./add-item-dialog";
import { PageHolder } from "./base";

export class MoviesPage extends PageHolder {
  readonly heading = this.page.getByRole("heading", { level: 1, name: "Movies" });
  readonly addButton = this.page.getByRole("button", { name: "Add", exact: true });
  readonly dialog = new AddItemDialog(this.page);

  async goto() {
    await this.page.goto("/movies");
    await expect(this.heading).toBeVisible();
  }

  async openAddDialog() {
    await this.addButton.click();
    await this.dialog.waitOpen();
  }

  async searchAndPick(query: string, resultTitle: string) {
    await this.dialog.searchAndPick(query, resultTitle);
  }

  async confirmAdd() {
    await this.dialog.confirm();
  }

  rowFor(title: string) {
    return this.page.getByRole("row", { name: title });
  }

  async expectRow(title: string) {
    await expect(this.rowFor(title)).toBeVisible();
  }
}
