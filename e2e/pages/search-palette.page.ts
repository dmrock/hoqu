import { expect } from "@playwright/test";
import { PageHolder } from "./base";

export class SearchPalettePage extends PageHolder {
  readonly trigger = this.page.getByRole("button", { name: "Search your collection" });
  readonly dialog = this.page.getByRole("dialog", { name: "Search your collection" });
  readonly input = this.dialog.getByPlaceholder("Search your collection...");
  readonly hint = this.dialog.getByText("Start typing to search");

  async openWithShortcut() {
    // Headless Chromium honors the platform meta key; use Control on Linux/Windows
    // runners. Playwright maps "Meta" to Cmd on macOS. We use Control here because
    // CI runs on Linux; the production listener accepts both.
    await this.page.keyboard.press("Control+KeyK");
    await expect(this.dialog).toBeVisible();
  }

  async openWithClick() {
    await this.trigger.click();
    await expect(this.dialog).toBeVisible();
  }

  async closeWithEscape() {
    await this.page.keyboard.press("Escape");
    await expect(this.dialog).toBeHidden();
  }

  async type(query: string) {
    await this.input.fill(query);
  }

  result(title: string) {
    return this.dialog.getByRole("option", { name: new RegExp(title) });
  }

  async pickResult(title: string) {
    await this.result(title).click();
    await expect(this.dialog).toBeHidden();
  }
}
