import { closeSync, mkdirSync, openSync, rmSync, unlinkSync } from "node:fs";
import { join } from "node:path";

// Each Vitest worker owns a private database on the e2e Neon branch. The suite
// truncates every user table between tests, so sharing one database would mean
// one file wiping another's fixtures the moment files run in parallel.
export const WORKER_COUNT = Number(process.env.INTEGRATION_WORKERS) || 4;

const SLOT_DIR = join("node_modules", ".cache", "hoqu-integration-slots");
const SLOT_ENV = "INTEGRATION_DB_SLOT";
const CLAIM_TIMEOUT_MS = 10_000;

export function workerDatabaseName(id: number): string {
  return `hoqu_test_w${id}`;
}

export function workerDatabaseUrl(baseUrl: string, id: number): string {
  const url = new URL(baseUrl);
  url.pathname = `/${workerDatabaseName(id)}`;
  return url.toString();
}

export function resetWorkerSlots(): void {
  rmSync(SLOT_DIR, { recursive: true, force: true });
  mkdirSync(SLOT_DIR, { recursive: true });
}

// Vitest's own worker ids can't drive this: VITEST_POOL_ID is only unique
// within one pool (concurrent workers collide once the unit and integration
// projects share a run) and VITEST_WORKER_ID grows without bound. So a slot is
// claimed by exclusively creating a lock file, held for one test file, and
// released in afterAll — Vitest keeps finished workers alive, so waiting for
// process exit would starve every file past the first WORKER_COUNT.
export async function claimWorkerSlot(): Promise<number> {
  const alreadyClaimed = process.env[SLOT_ENV];
  if (alreadyClaimed) return Number(alreadyClaimed);

  mkdirSync(SLOT_DIR, { recursive: true });
  const deadline = Date.now() + CLAIM_TIMEOUT_MS;

  while (true) {
    for (let id = 1; id <= WORKER_COUNT; id++) {
      const lock = join(SLOT_DIR, `${id}.lock`);
      try {
        closeSync(openSync(lock, "wx"));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "EEXIST") continue;
        throw error;
      }
      process.env[SLOT_ENV] = String(id);
      process.on("exit", releaseWorkerSlot);
      return id;
    }

    // Slots free up as files finish; the handoff leaves a brief window where
    // the next file starts before the previous one has released.
    if (Date.now() > deadline) {
      throw new Error(`No free integration database slot after ${CLAIM_TIMEOUT_MS}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

export function releaseWorkerSlot(): void {
  const id = process.env[SLOT_ENV];
  if (!id) return;
  delete process.env[SLOT_ENV];
  try {
    unlinkSync(join(SLOT_DIR, `${id}.lock`));
  } catch {
    // Already released, or the whole directory was reset — nothing to do.
  }
}
