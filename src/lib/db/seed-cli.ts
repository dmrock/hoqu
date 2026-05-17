import { config } from "dotenv";

// Locally, DATABASE_URL lives in .env.local; on Vercel it's already injected.
if (!process.env.DATABASE_URL) config({ path: ".env.local" });

// Dynamic import so DATABASE_URL is set before ./seed (and its `db` dependency) evaluates.
import("./seed")
  .then(({ runSeed }) => runSeed())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
