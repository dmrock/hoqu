import { expect } from "@playwright/test";
import { PageHolder } from "./base";

export class LoginPage extends PageHolder {
  readonly emailInput = this.page.getByRole("textbox", { name: "Email" });
  readonly passwordInput = this.page.getByLabel("Password", { exact: true });
  readonly submitButton = this.page.getByRole("button", { name: "Sign in", exact: true });
  readonly registerLink = this.page.getByRole("link", { name: "Create an account" });

  async goto() {
    await this.page.goto("/login");
    await expect(this.submitButton).toBeVisible();
  }

  async signIn(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
