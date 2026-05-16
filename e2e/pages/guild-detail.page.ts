import { expect } from "@playwright/test";
import { PageHolder } from "./base";

export class GuildDetailPage extends PageHolder {
  readonly guildHeading = (name: string) => this.page.getByRole("heading", { level: 1, name });

  readonly inviteCodeLabel = this.page.getByText("Invite code", { exact: true });

  async waitForLoaded(guildName: string) {
    await expect(this.guildHeading(guildName)).toBeVisible();
  }

  async readInviteCode(): Promise<string> {
    // The invite code is rendered in the section labeled "Invite code" as a
    // font-mono paragraph directly below the label.
    const codeText = await this.page
      .locator("p.font-mono.text-lg.tracking-wider")
      .first()
      .innerText();
    return codeText.trim();
  }

  async expectMemberCount(count: number, max: number) {
    await expect(this.page.getByText(`${count} / ${max} members`)).toBeVisible();
  }
}
