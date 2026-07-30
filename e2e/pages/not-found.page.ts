import { PageHolder } from "./base";

export class NotFoundPage extends PageHolder {
  readonly heading = this.page.getByRole("heading", { name: "Quest not found" });
  readonly backToDashboard = this.page.getByRole("link", { name: "Back to dashboard" });
}
