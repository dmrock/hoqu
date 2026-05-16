import { PageHolder } from "./base";

export class Sidebar extends PageHolder {
  readonly profileMenuButton = this.page.getByRole("button", { name: "Open profile menu" });
  readonly signOutItem = this.page.getByRole("menuitem", { name: "Sign out" });

  async signOut() {
    await this.profileMenuButton.click();
    await this.signOutItem.click();
  }
}
