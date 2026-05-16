import { expect } from "@playwright/test";
import { PageHolder } from "./base";

export class RegisterPage extends PageHolder {
  readonly emailInput = this.page.getByRole("textbox", { name: "Email" });
  readonly passwordInput = this.page.getByLabel("Password", { exact: true });
  readonly submitButton = this.page.getByRole("button", { name: "Create account" });

  async goto() {
    await this.page.goto("/register");
    await expect(this.submitButton).toBeVisible();
  }

  async register(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
