import dotenv from "dotenv";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import {
  resetWorkerSlots,
  WORKER_COUNT,
  workerDatabaseName,
  workerDatabaseUrl,
} from "./helpers/worker-db";

export default async function setup() {
  dotenv.config({ path: ".env.local", quiet: true });
  dotenv.config({ path: ".env.test.local", override: true, quiet: true });

  const baseUrl = process.env.E2E_DATABASE_URL;
  if (!baseUrl) throw new Error("E2E_DATABASE_URL must be set in .env.test.local");
  process.env.DATABASE_URL = baseUrl;

  // Clear slot locks left behind by a crashed run.
  resetWorkerSlots();

  // Imported late: both modules bind the connection URL at module load.
  const schema = await import("@/lib/db/schema");
  const { runSeed } = await import("@/lib/db/seed");

  const admin = drizzle(baseUrl, { schema });
  const ids = Array.from({ length: WORKER_COUNT }, (_, i) => i + 1);

  // The worker databases outlive a run and are reused, so create only what is
  // missing — CREATE DATABASE has no IF NOT EXISTS to lean on.
  const existing = await admin.execute<{ datname: string }>(sql`SELECT datname FROM pg_database`);
  const present = new Set(existing.rows.map((row) => row.datname));

  for (const id of ids) {
    const name = workerDatabaseName(id);
    if (present.has(name)) continue;
    await admin.execute(sql.raw(`CREATE DATABASE ${name}`));
  }

  await Promise.all(
    ids.map(async (id) => {
      const workerDb = drizzle(workerDatabaseUrl(baseUrl, id), { schema });
      await migrate(workerDb, { migrationsFolder: "./drizzle" });
      await runSeed(workerDb);
    }),
  );
}
