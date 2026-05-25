import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

// On Vercel Preview builds DATABASE_URL is intentionally unset (preview env
// scope is blank). The Vercel build command runs `pnpm db:migrate` before
// `pnpm build`, so we exit 0 here to let the build proceed instead of throwing.
if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set — skipping drizzle-kit operation.");
  process.exit(0);
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
  strict: true,
  verbose: true,
});
