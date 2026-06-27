import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env.test.local", override: true });

if (!process.env.E2E_DATABASE_URL) {
  throw new Error("E2E_DATABASE_URL must be set in .env.test.local before running e2e tests");
}
// Make the Playwright runner (and the global-setup it loads) talk to the e2e
// branch. The dev server spawned by webServer.env gets the same override.
process.env.DATABASE_URL = process.env.E2E_DATABASE_URL;

// Use a non-default port so a `pnpm dev` on :3000 (likely pointing at the
// shared dev branch) doesn't get reused by Playwright via `reuseExistingServer`.
// Overridable via E2E_PORT when :3000 is free and you want to reuse a server there.
const E2E_PORT = Number(process.env.E2E_PORT) || 3100;
const baseURL = `http://localhost:${E2E_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  globalSetup: path.resolve("./e2e/setup/global-setup.ts"),
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "auth-flow",
      testMatch: /auth\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // Runs every spec authenticated as userA, except auth.spec.ts, which drives
      // the login/register flow itself and runs unauthenticated (the auth-flow
      // project above). New specs are picked up automatically.
      name: "authed",
      testMatch: /\.spec\.ts$/,
      testIgnore: /auth\.spec\.ts$/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/userA.json",
      },
    },
  ],
  webServer: {
    command: `pnpm dev -p ${E2E_PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: process.env.E2E_DATABASE_URL,
      // Swap in deterministic new-releases data — TMDB/RAWG are server-side
      // fetches Playwright's page.route can't intercept.
      E2E_NEW_RELEASES_FIXTURES: "1",
      // Force the email client into its no-op path so e2e never sends a real
      // message, even if a real RESEND_API_KEY lives in .env.local. Empty is
      // already-defined, so Next won't override it from the .env file.
      RESEND_API_KEY: "",
    },
  },
});
