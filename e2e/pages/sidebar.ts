import { PageHolder } from "./base";

export class Sidebar extends PageHolder {
  readonly profileMenuButton = this.page.getByRole("button", { name: "Open profile menu" });
  readonly signOutItem = this.page.getByRole("menuitem", { name: "Sign out" });
  // The numeric pending-request badge on the Friends nav item, scoped to the
  // desktop sidebar (<aside> = complementary landmark) so it stays unique.
  readonly friendRequestBadge = this.page.getByRole("complementary").getByText(/^\d+$/);

  async signOut() {
    await this.profileMenuButton.click();
    await this.signOutItem.click();
  }
}
