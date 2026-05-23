-- Revoke wrongly-unlocked Century / Dedicated achievements.
--
-- Why: The items_completed evaluator used to fall back to
-- users.total_points (weighted) when no hobby was specified.
-- That meant Century (100 items) could unlock at totalPoints >= 100
-- — reachable by ~10 games or ~17 books — and Dedicated (50 in any
-- single hobby) likewise. Fixed in commit 446e8b9, but existing
-- unlocks linger in user_achievements.
--
-- How to run: paste into Neon SQL Editor (production branch) or
-- psql against the prod connection string. Run AFTER the evaluator
-- fix is deployed, so checkAchievements re-inserts legitimate unlocks
-- on next dashboard / achievements page visit for qualifying users.
--
-- Idempotent: re-running is a no-op once rows are gone.
-- Safe: only deletes user_achievements rows that fail the new check;
-- legitimate unlocks (users who actually qualify) are kept.

-- Century: requires 100 total completed items across all hobbies.
DELETE FROM user_achievements ua
USING achievements a, users u
WHERE ua.achievement_id = a.id
  AND ua.user_id = u.id
  AND a.slug = 'century'
  AND (u.movies_completed + u.shows_completed + u.games_completed + u.books_completed) < 100;

-- Dedicated: requires 50 completions in any single hobby (max across hobbies).
DELETE FROM user_achievements ua
USING achievements a, users u
WHERE ua.achievement_id = a.id
  AND ua.user_id = u.id
  AND a.slug = 'dedicated'
  AND GREATEST(
    u.movies_completed,
    u.shows_completed,
    u.games_completed,
    u.books_completed
  ) < 50;
