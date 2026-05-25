import { config } from "dotenv";

// Locally, DATABASE_URL lives in .env.local; on Vercel it's already injected.
if (!process.env.DATABASE_URL) config({ path: ".env.local" });

// On Vercel Preview builds DATABASE_URL is intentionally unset. The build
// command runs `pnpm db:seed` before `pnpm build`, so we exit 0 here to let
// the build proceed instead of crashing inside ./seed → db/index.ts.
if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set — skipping seed.");
  process.exit(0);
}

// Dynamic import so DATABASE_URL is set before ./seed (and its `db` dependency) evaluates.
import("./seed")
  .then(({ runSeed }) => runSeed())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
