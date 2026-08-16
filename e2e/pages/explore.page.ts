import { expect } from "@playwright/test";
import { AddItemDialog } from "./add-item-dialog";
import { PageHolder } from "./base";

export class ExplorePage extends PageHolder {
  readonly heading = this.page.getByRole("heading", { level: 1, name: /^Welcome,/ });

  async goto() {
    await this.page.goto("/explore");
    await expect(this.heading).toBeVisible();
  }

  async waitForLoaded() {
    await expect(this.heading).toBeVisible();
  }

  async expectWelcome(name: string) {
    await expect(this.heading).toContainText(name);
  }

  /** Reads the numeric value of the stat card with the given label. */
  async statValue(label: string): Promise<number> {
    const text = await this.page.getByTestId(`stat-${label}`).innerText();
    return Number.parseInt(text, 10);
  }

  newReleasePoster(title: string) {
    return this.page.getByRole("button", { name: `Add ${title} to collection` });
  }

  /** Click a new-releases poster and wait for the shared add dialog to open. */
  async openAddFromPoster(title: string): Promise<AddItemDialog> {
    await this.newReleasePoster(title).click();
    const dialog = new AddItemDialog(this.page);
    await dialog.waitOpen();
    return dialog;
  }

  async expectPosterOwned(title: string) {
    const poster = this.newReleasePoster(title);
    await expect(poster).toBeDisabled();
    await expect(poster.getByText("Owned")).toBeVisible();
  }
}
