import path from "node:path";
import { defineConfig } from "vitest/config";
import { WORKER_COUNT } from "./tests/integration/helpers/worker-db";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./tests/stubs/server-only.ts"),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          environment: "node",
          setupFiles: ["./vitest.setup.ts"],
          // Distinct group orders are required once projects differ in
          // maxWorkers; running unit first also fails fast on pure logic.
          sequence: { groupOrder: 0 },
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
          globalSetup: ["./tests/integration/global-setup.ts"],
          setupFiles: ["./tests/integration/setup.ts"],
          // Files run in parallel, one private database per worker (see
          // helpers/worker-db.ts). Forks, not threads: setup.ts rewrites
          // DATABASE_URL per worker and threads would share that env. The
          // worker count is pinned because global-setup provisions exactly
          // that many databases.
          pool: "forks",
          maxWorkers: WORKER_COUNT,
          sequence: { groupOrder: 1 },
          testTimeout: 15_000,
        },
      },
    ],
  },
});
