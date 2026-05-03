/**
 * One-shot script to seed the new `items.points_awarded` snapshot column for
 * existing data:
 *
 * 1. For every completed item, copy the current `hobby.points_per_item` into
 *    `items.points_awarded`. Non-completed items stay at 0 (default).
 * 2. Recalculate each user's `total_points` as the SUM of `items.points_awarded`
 *    across their items, so the denormalized counter aligns with the snapshots.
 *
 * Safe to run more than once — both steps are deterministic given the current
 * DB state.
 */
import { config } from "dotenv";
import { sql } from "drizzle-orm";

config({ path: ".env.local" });

async function main() {
  const { db } = await import("./index");

  console.log("Backfilling items.points_awarded for completed rows…");
  const updated = await db.execute(sql`
    UPDATE items
    SET points_awarded = hobbies.points_per_item
    FROM hobbies
    WHERE items.hobby_id = hobbies.id
      AND items.status = 'completed'
      AND items.points_awarded <> hobbies.points_per_item
    RETURNING items.id
  `);
  console.log(`  rewrote ${updated.rows.length} item snapshots`);

  console.log("Recalculating users.total_points from item snapshots…");
  await db.execute(sql`
    UPDATE users
    SET total_points = COALESCE((
      SELECT SUM(points_awarded)::int
      FROM items
      WHERE items.user_id = users.id
    ), 0)
  `);
  console.log("  done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
