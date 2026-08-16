import { expect } from "@playwright/test";
import { PageHolder } from "./base";

/**
 * Component object for the shared add dialog (src/components/items/add-item-dialog.tsx),
 * reached either from a hobby page's "Add" button (search step first) or from a
 * Explore new-releases poster (opens straight to the configure step).
 */
export class AddItemDialog extends PageHolder {
  readonly root = this.page.getByRole("dialog");
  readonly searchInput = this.root.getByPlaceholder("Search...");
  readonly statusSelect = this.root.getByLabel("Status");
  readonly submitButton = this.root.getByRole("button", { name: "Add", exact: true });

  async waitOpen() {
    await expect(this.root).toBeVisible();
  }

  /** The configure step renders the picked item's title. */
  async expectItem(title: string) {
    await expect(this.root.getByText(title)).toBeVisible();
  }

  async expectStatus(label: string) {
    await expect(this.statusSelect).toContainText(label);
  }

  /** Search step → pick a result, which advances the dialog to the configure step. */
  async searchAndPick(query: string, resultTitle: string) {
    await this.searchInput.fill(query);
    await this.root.getByRole("button", { name: resultTitle }).click();
  }

  async confirm() {
    await this.submitButton.click();
    await expect(this.root).toBeHidden();
  }
}
