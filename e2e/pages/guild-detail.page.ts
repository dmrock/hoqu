import { expect } from "@playwright/test";
import { PageHolder } from "./base";

export class GuildDetailPage extends PageHolder {
  readonly guildHeading = (name: string) => this.page.getByRole("heading", { level: 1, name });
  readonly inviteCode = this.page.getByTestId("invite-code");

  async waitForLoaded(guildName: string) {
    await expect(this.guildHeading(guildName)).toBeVisible();
  }

  async readInviteCode(): Promise<string> {
    return (await this.inviteCode.innerText()).trim();
  }

  async expectMemberCount(count: number, max: number) {
    await expect(this.page.getByText(`${count} / ${max} members`)).toBeVisible();
  }
}
