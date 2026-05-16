import { expect } from "@playwright/test";
import { PageHolder } from "./base";

export class DashboardPage extends PageHolder {
  readonly heading = this.page.getByRole("heading", { level: 1, name: /^Welcome,/ });

  async goto() {
    await this.page.goto("/dashboard");
    await expect(this.heading).toBeVisible();
  }

  async waitForLoaded() {
    await expect(this.heading).toBeVisible();
  }

  async expectWelcome(name: string) {
    await expect(this.heading).toContainText(name);
  }

  /** Reads the numeric value rendered under a stat label like "Total points". */
  async statValue(label: string): Promise<number> {
    const card = this.page.locator("div").filter({
      has: this.page.getByText(label, { exact: true }),
    });
    const text = await card.locator("p.font-pixel").first().innerText();
    return Number.parseInt(text, 10);
  }
}
