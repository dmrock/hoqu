import type { Page } from "@playwright/test";

export abstract class PageHolder {
  constructor(protected page: Page) {}
}
