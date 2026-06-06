import { test as base } from "@playwright/test";
import { App } from "../app";

/**
 * Extends the base test with an `app` fixture bound to the default `page`.
 * For secondary browser contexts, construct `new App(otherPage)` directly.
 */
export const test = base.extend<{ app: App }>({
  app: async ({ page }, use) => {
    await use(new App(page));
  },
});

export { expect } from "@playwright/test";
