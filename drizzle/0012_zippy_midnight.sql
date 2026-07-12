-- The check-then-insert race in sendFriendRequest may already have produced
-- duplicate rows for a pair; clear them so the unique index can build. Keep
-- accepted over pending, then the oldest row (false sorts before true, so
-- "status <> accepted" ranks accepted rows first).
DELETE FROM "friendships" AS f
USING "friendships" AS g
WHERE f."id" <> g."id"
  AND least(f."requester_id", f."addressee_id") = least(g."requester_id", g."addressee_id")
  AND greatest(f."requester_id", f."addressee_id") = greatest(g."requester_id", g."addressee_id")
  AND (g."status" <> 'accepted', g."created_at", g."id") < (f."status" <> 'accepted', f."created_at", f."id");--> statement-breakpoint
CREATE UNIQUE INDEX "friendships_pair_unique" ON "friendships" USING btree (least("requester_id", "addressee_id"),greatest("requester_id", "addressee_id"));
