import { expect } from "@playwright/test";
import { PageHolder } from "./base";

export class GuildsPage extends PageHolder {
  readonly heading = this.page.getByRole("heading", { level: 1, name: "Guilds" });
  readonly nameInput = this.page.getByRole("textbox", { name: "Guild name" });
  readonly createButton = this.page.getByRole("button", { name: "Create guild" });
  readonly inviteCodeInput = this.page.getByRole("textbox", { name: "Invite code" });
  readonly joinButton = this.page.getByRole("button", { name: "Join", exact: true });

  async goto() {
    await this.page.goto("/guilds");
    await expect(this.heading).toBeVisible();
  }

  async createGuild(name: string) {
    await this.nameInput.fill(name);
    await this.createButton.click();
  }

  async joinWithCode(code: string) {
    await this.inviteCodeInput.fill(code);
    await this.joinButton.click();
  }
}
