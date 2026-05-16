import { expect } from "@playwright/test";
import { PageHolder } from "./base";

export class FriendsPage extends PageHolder {
  readonly heading = this.page.getByRole("heading", { level: 1, name: "Friends" });
  readonly usernameInput = this.page.getByLabel("Find a friend by username");
  readonly sendRequestButton = this.page.getByRole("button", { name: "Send request" });
  readonly acceptButton = this.page.getByRole("button", { name: "Accept" });

  async goto() {
    await this.page.goto("/friends");
    await expect(this.heading).toBeVisible();
  }

  async sendRequestTo(username: string) {
    await this.usernameInput.fill(username);
    await this.sendRequestButton.click();
  }

  async acceptFirstIncoming() {
    await this.acceptButton.first().click();
  }

  /** Locator matching a row in the "Friends" section by display name (link text). */
  friendRowLink(displayName: string) {
    return this.page.getByRole("link", { name: displayName });
  }
}
