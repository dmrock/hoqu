import { config } from "dotenv";

if (!process.env.DATABASE_URL) config({ path: ".env.local" });
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set — point it at the database you want to migrate.");
  process.exit(1);
}

/**
 * One-off backfill: game rows added while RAWG was the provider carry RAWG
 * external ids, which IGDB will never return. Left alone they break two things:
 * the "owned" badge stops matching, and `items_user_hobby_external_unique` stops
 * catching a re-add, so the same game can be logged twice and counted twice.
 *
 * Re-runnable: rows already carrying an IGDB cover are skipped, so a partial run
 * can simply be repeated. Dry-run by default; pass --apply to write.
 *
 *   node_modules/.bin/tsx src/lib/db/migrate-games-to-igdb.ts
 *   node_modules/.bin/tsx src/lib/db/migrate-games-to-igdb.ts --apply
 *
 * Point DATABASE_URL at production to migrate prod:
 *   DATABASE_URL="postgres://…" node_modules/.bin/tsx src/lib/db/migrate-games-to-igdb.ts
 */

const APPLY = process.argv.includes("--apply");
const IGDB_HOST = "images.igdb.com";
/** IGDB allows 4 req/s; stay well under it. */
const THROTTLE_MS = 300;

type Confidence = "exact" | "exact-multi" | "partial" | "weak" | "none";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function main() {
  const { and, eq, ne } = await import("drizzle-orm");
  const { searchGames } = await import("../api/igdb");
  const { db } = await import("./index");
  const { hobbies, items, users } = await import("./schema");

  const rows = await db
    .select({
      id: items.id,
      userId: items.userId,
      hobbyId: items.hobbyId,
      username: users.username,
      externalId: items.externalId,
      title: items.title,
      year: items.year,
      imageUrl: items.imageUrl,
    })
    .from(items)
    .innerJoin(hobbies, eq(hobbies.id, items.hobbyId))
    .innerJoin(users, eq(users.id, items.userId))
    .where(eq(hobbies.slug, "games"));

  const pending = rows.filter((r) => !r.imageUrl?.includes(IGDB_HOST));
  console.log(
    `${rows.length} game rows, ${rows.length - pending.length} already on IGDB, ` +
      `${pending.length} to migrate.${APPLY ? "" : "  (dry run — pass --apply to write)"}\n`,
  );
  if (pending.length === 0) return;

  let migrated = 0;
  let skipped = 0;

  for (const row of pending) {
    await new Promise((r) => setTimeout(r, THROTTLE_MS));

    let results: Awaited<ReturnType<typeof searchGames>>;
    try {
      results = await searchGames(row.title);
    } catch (err) {
      console.log(`  SKIP  ${row.title} — search failed: ${(err as Error).message}`);
      skipped++;
      continue;
    }

    const target = normalize(row.title);
    const exact = results.filter((r) => normalize(r.title) === target);
    const partial = results.filter(
      (r) => normalize(r.title).startsWith(target) || target.startsWith(normalize(r.title)),
    );

    let match = null as (typeof results)[number] | null;
    let confidence: Confidence = "none";
    if (exact.length === 1) {
      [match] = exact;
      confidence = "exact";
    } else if (exact.length > 1) {
      match = (row.year && exact.find((r) => r.year === row.year)) || exact[0];
      confidence = "exact-multi";
    } else if (partial.length > 0) {
      match = (row.year && partial.find((r) => r.year === row.year)) || partial[0];
      confidence = "partial";
    } else if (results.length > 0) {
      [match] = results;
      confidence = "weak";
    }

    if (!match) {
      console.log(`  MISS  "${row.title}" (${row.year ?? "?"}) — no IGDB result`);
      skipped++;
      continue;
    }

    // The unique index is (userId, hobbyId, externalId); rewriting into an id the
    // same user already holds would collide, so leave it for manual cleanup.
    const [clash] = await db
      .select({ id: items.id })
      .from(items)
      .where(
        and(
          eq(items.userId, row.userId),
          eq(items.hobbyId, row.hobbyId),
          eq(items.externalId, match.externalId),
          ne(items.id, row.id),
        ),
      );
    if (clash) {
      console.log(`  CLASH "${row.title}" → ${match.externalId} already held by @${row.username}`);
      skipped++;
      continue;
    }

    const rename = normalize(match.title) === target ? "" : `  (IGDB calls it "${match.title}")`;
    console.log(
      `  ${confidence.toUpperCase().padEnd(11)} @${row.username}  "${row.title}" ` +
        `${row.externalId} → ${match.externalId}${rename}`,
    );

    if (APPLY) {
      await db
        .update(items)
        .set({
          externalId: match.externalId,
          imageUrl: match.imageUrl,
          externalRating: match.externalRating,
          updatedAt: new Date(),
        })
        .where(eq(items.id, row.id));
    }
    migrated++;
  }

  // Only provider-sourced columns change — status, ratings, notes and
  // pointsAwarded are untouched, so no counter recalculation is needed.
  console.log(
    `\n${APPLY ? "Migrated" : "Would migrate"} ${migrated}, skipped ${skipped}.` +
      (APPLY ? "" : "\nRe-run with --apply once the matches above look right."),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
