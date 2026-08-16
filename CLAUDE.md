# HOQU — Development Guide

## Project Description

HOQU (hoqu.dev) is a hobby tracking web app where users log movies, TV shows, games, and books
they've consumed. Each completed item awards points (weighted per hobby — see below). Users unlock
achievements, join guilds, friend each other, and compare progress on guild- and friends-only
leaderboards. Dark-only UI with a "modern pixel" aesthetic — clean modern base with pixel-art
accents (badges, XP bars, icons, micro-animations). English only.

**Status:** Phase 1 (MVP) and Phase 2 (social) are shipped. Outstanding: polish (animations, pixel
sprites, responsive sweep) is intentionally deferred — see `MEMORY.md`.

## Tech Stack (do not change without explicit approval)

- **Framework**: Next.js 16 (App Router, Turbopack default)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 (dark theme only)
- **UI Base**: shadcn/ui (CLI-only — never installed as a runtime dep, use `pnpm dlx shadcn@latest add <name>`)
- **Animations**: Motion (npm package `motion`, imported from `motion/react`)
- **Database**: PostgreSQL via Neon (`@neondatabase/serverless`)
- **ORM**: Drizzle ORM
- **Auth**: Auth.js v5 (NextAuth) — Email+password + Google OAuth
- **Validation**: Zod
- **Cache + rate limiting**: Upstash Redis (`@upstash/redis`, `@upstash/ratelimit`)
- **External APIs**: TMDB (movies + TV), IGDB (games), Open Library (books)
- **Linting & Formatting**: Biome (no ESLint, no Prettier)
- **Deployment**: Vercel

## Architecture Rules

1. App Router only. All routes in `src/app/`.
2. Server Components by default. Add `"use client"` only when needed.
3. Server Actions for mutations; API routes only for search proxies and auth.
4. All DB queries go through Drizzle ORM. Never use raw SQL strings (parameter binding via
   `sql\`\`` template is fine when needed).
5. Validate all inputs with Zod schemas.
6. Use `next/image` for content images. External hosts must be added to `next.config.ts`
   `remotePatterns`. For tiny avatar URLs from arbitrary OAuth providers, the Radix
   `<AvatarImage>` (plain `<img>` underneath) is fine without whitelisting.
7. Mobile-first responsive. Sidebar collapses to drawer below `md`.
8. English only — no i18n.
9. Dark theme only — no light mode toggle.
10. **Next.js 16 specifics:**
    - Turbopack is default — never add `--turbopack` flags.
    - Use `proxy.ts` (not `middleware.ts`) for request interception. Export a `proxy` function.
    - `'use cache'` directive available for explicit RSC caching.
    - React 19.2 features available (View Transitions, useEffectEvent).
11. **Server-only modules**: any file that imports `db` or otherwise relies on `process.env.*`
    secrets must start with `import "server-only"` if a client component might import from it.
    Pure types/constants live in a sibling file with no DB imports — see
    `src/lib/leaderboards.ts` (pure) vs `src/lib/leaderboard-queries.ts` (DB).
12. **Public vs. authed routes** (`src/proxy.ts`): `/`, `/features`, `/privacy`, `/terms`,
    `/forgot-password`, `/reset-password`, `/confirm-email`, and `/verify-email` are public
    (the last four are token-authorized recovery pages reachable while signed out). Every other
    non-`/login`/`/register` path requires a session and bounces unauthed users to
    `/login?from=…`. Authed users on `/`, `/login`, or `/register` get redirected to
    `/explore` so the landing/auth screens never render once signed in.

## Workflow Rules

**The user handles all setup and installation themselves.** I (Claude) must NOT run install
commands, create accounts, generate API keys, or configure external services automatically.

1. When a step needs setup/install/config of any tool, service, or dependency — give the user a
   step-by-step instruction to follow manually.
2. Before writing instructions, verify against current docs (web search if needed).
3. Include exact commands, exact URLs, exact config values; the user runs them.
4. Flag any version-specific quirks explicitly.
5. After the user confirms a step is done, proceed.

This applies to: npm/pnpm installs, database setup, OAuth app creation, env vars, third-party API
registration, Vercel deployment config.

`pnpm db:migrate`, `pnpm db:seed`, and one-off scripts in `src/lib/db/*.ts` I CAN run when the
user has already configured the environment — these aren't external setup, they apply existing
migrations to the existing database.

## Testing

Three layers, three commands. `pnpm test:all` runs everything.

- **Unit tests** (Vitest): `pnpm test` / `pnpm test:watch`. Pure logic only — `src/lib/`
  helpers, no DB or Redis. Dummy env in `vitest.setup.ts`.
- **Integration tests** (Vitest, separate project): `pnpm test:integration`. Server actions
  end-to-end against the real e2e Neon branch (reuses `E2E_DATABASE_URL`). Setup at
  [tests/integration/setup.ts](tests/integration/setup.ts) loads env, stubs `@/lib/auth`
  (no Next bundler available outside Next) and `@/lib/rate-limit`, then truncates user-data
  per test. Tests use `setTestUserId(id)` to drive the auth gate.
  - **Files run in parallel, one database per worker.** `E2E_DATABASE_URL` names the
    *branch*; [tests/integration/global-setup.ts](tests/integration/global-setup.ts)
    creates `hoqu_test_w1…wN` on it (N = `INTEGRATION_WORKERS`, default 4), migrates each
    from `drizzle/`, and seeds hobbies + achievements once. The databases are reused across
    runs; the per-test truncate never touches hobbies/achievements.
  - Because the schema comes from `drizzle/`, a schema change needs a generated migration
    before integration tests see it — pushing to the branch alone is not enough (that
    still applies to the e2e suite, which uses `neondb` directly).
  - A worker picks its database by claiming a lock file under `node_modules/.cache/`, not
    by Vitest's worker ids — `VITEST_POOL_ID` collides across concurrent workers once the
    unit and integration projects share a run. See
    [tests/integration/helpers/worker-db.ts](tests/integration/helpers/worker-db.ts).
- **E2E tests** (Playwright): `pnpm e2e` / `pnpm e2e:headed` / `pnpm e2e:ui`. POM with
  `PageHolder` base ([e2e/pages/base.ts](e2e/pages/base.ts)) and `getByRole` preferred.
  Spawns its own Next dev server on **:3100** against the e2e Neon branch.
- **Dev server conflict**: Next 16 enforces a singleton dev server per project directory,
  so **stop `pnpm dev` before running `pnpm e2e`**. Integration tests don't need the dev
  server (they call server actions directly), so they can run while `pnpm dev` is up.

## Database Schema

Source of truth: `src/lib/db/schema.ts`. The shapes below are summaries.

- **users** — auth fields (email, name, username, image, passwordHash) plus denormalized
  per-user counters: `totalPoints`, `moviesCompleted`, `gamesCompleted`, `booksCompleted`,
  `showsCompleted` (TV), `itemsRated`. `profileVisibility` enum
  (public/friends_only/guild_only/private).
- **hobbies** — `slug` (unique), `name`, `icon`, `pointsPerItem`. Seeded with movies (1), tv (5
  per season), games (10), books (6).
- **items** — owned by user × hobby × `externalId` (unique together). Carries the user's
  status, rating, note, "again?" flag, plus a `pointsAwarded` snapshot (see Points System).
  TV multi-season shows use a self-referential `parentItemId` to link seasons under a parent
  show row; `seasonNumber` and `seasonCount` describe the structure. Status is nullable on
  show-parent rows. See TV Seasons.
- **friendships** — `requesterId`, `addresseeId`, `status` (pending/accepted/declined). We
  delete on decline/cancel/remove rather than write `declined`; the column exists for future
  semantics. A unique expression index (`friendships_pair_unique` on
  `least(requesterId, addresseeId), greatest(…)`) enforces one row per user pair regardless
  of direction; `sendFriendRequest` maps the unique violation from its check-then-insert
  race to the friendly "already pending" error.
- **guilds** — `name` (unique), `description`, `inviteCode` (unique 8-char, ambiguous chars
  stripped), `discordInviteUrl`, `maxMembers` (default 50). **guild_members** with role
  (master/officer/member).
- **achievements** — definition rows with `requirement: jsonb`. **user_achievements** records
  unlocks. Categories: general / movies / tv / games / books / social.
- **auth_tokens** — single-use tokens for password reset, email change + signup email
  verification. Stores the **SHA-256 hash** of the token (never the raw value), `purpose`
  enum, optional `newEmail` (email_change only), `expiresAt`. Cascades on user delete. Helpers in
  `src/lib/auth/tokens.ts` (`issueToken`/`consumeToken`); pure hash/generate split into
  `tokens-crypto.ts` so they're unit-testable.

Seed: `pnpm db:seed` upserts hobbies and starter achievements. Edit `src/lib/db/seed.ts` to
extend.

## Points & Counter System

- **Weighted points per hobby** — movies 1, tv 5 (per season), games 10, books 6. Stored in
  `hobbies.points_per_item`.
- **Snapshot on the row** — when an item becomes `completed`, we write the current
  `hobby.points_per_item` into `items.points_awarded`. When it leaves `completed`, we reset
  the snapshot to 0. Total points = SUM(snapshots), so historical totals survive any future
  recalibration of `points_per_item`.
- **`computeCounterDelta`** in `src/lib/points.ts` takes both `oldPointsAwarded` and
  `newPointsAwarded` and returns the diff. Per-hobby completion counters
  (`moviesCompleted`, `showsCompleted`, etc.) stay raw counts.
- **Atomicity** — every item write must update the user's counters in the same `db.batch([])`
  call. Neon HTTP doesn't support interactive transactions; batches are atomic enough.
- **Recalc script** — `src/lib/db/recalc-points.ts` rewrites all `items.points_awarded` from
  current `hobbies.points_per_item` and recomputes `users.total_points`. Run it after
  changing weights or whenever counters drift.
- **Honor system** — UI message: "We trust our adventurers to log their quests honestly".

## TV Seasons

A TV add fetches `getTvShow` and, when TMDB both reports ≥2 seasons **and** lists them
(`resolveSeasons` in `src/app/(main)/items/actions.ts` — it reports one without the other
often enough to matter), splits the show into a non-counting parent row plus one row per
season. Anything else stays a flat row. Every season row counts on its own, so a completed
5-season show is 5 × 5 = 25 points and 5 `showsCompleted` — counters are always summed per
season row, never derived from S1 alone.

Two ways to set the same values across every season instead of one at a time:

- **At add time** — `addItem` takes `applyToAllSeasons`. Off (the default), only S1 inherits
  the user's status/rating/note/"again?" and S2..SN start `planned`; on, every season
  inherits them. The add dialog offers it only for multi-season shows, looking the count up
  through `getShowSeasonCount` — season counts live on TMDB's detail endpoint, so they can't
  ride along on search results.
- **Afterwards** — `updateShowSeasons`, behind the pencil on the show row
  (`components/items/edit-show-seasons.tsx`). Every field is optional and **absent means
  leave it alone**, so a rating can be applied across a show without flattening the statuses
  of seasons not watched yet; the dialog makes each field opt-in to match. Applying a status
  gives every season the same snapshot, so the write is a single UPDATE, and
  `coalesce(completed_at, now())` keeps each season's original completion date.

`updateItem` still refuses show-parent rows ("Edit individual seasons instead") — a parent
carries no status of its own. `refreshShow` inserts newly aired seasons as `planned`, and
migrates a flat row to multi-season once TMDB catches up, handing S1 the flat row's exact
`pointsAwarded` snapshot so the counters net to zero.

## Anti-Spam (Upstash Redis)

`src/lib/rate-limit.ts` — sliding windows on `addItem`:

- **50 / hour** and **200 / day** per user (parallel checks).
- Friendly UI warning at <20 slots remaining ("You're on a roll! X slots left before a pause").
- Hard block when exhausted with a "back in ~X min" message.
- **Fails open** — Redis unreachable returns `{ ok: true }` with full quota; anti-spam, not
  security.

Friend requests: **20 / hour** per sender (`checkFriendRequestLimit`), checked before any DB
work in `sendFriendRequest` — the slot is spent even when the target username doesn't exist,
so bulk username probing costs quota too. Same fail-open + dev-skip posture as the auth
limits. `minutesUntilReset` (`src/lib/rate-limit-format.ts`, pure) turns a limiter `resetAt`
into the "~X min" copy everywhere.

## Search Cache (Upstash Redis)

`src/lib/api/cache.ts` — wraps each search fetcher (TMDB / IGDB / Open Library):

- Key pattern `search:{hobby}:{normalized_query}` (lowercase, trimmed).
- TTL 15 minutes.
- Cache reads and writes wrap `try/catch` and never block the actual search request.

## Hobby Page Pagination

Hobby pages render 50 top-level rows per page (`ITEMS_PAGE_SIZE` in `src/lib/items-filter.ts`),
driven by `?page=`, so payload/DOM stay flat as collections grow.

- Two cheap counts (filtered + unfiltered) pick the empty state ("no items yet" vs "no
  matches"), size the pager, and clamp out-of-range pages.
- Every sort order ends on a stable `id` tiebreaker so LIMIT/OFFSET pages never shuffle ties.
- A `?focus=` deep link (Cmd+K palette) resolves the row's page server-side (`row_number()`
  window) and redirects to `?page=N&focus=…`, so `RowFocus`'s focus-param cleanup keeps the
  user on that page.
- Filter/sort changes in `ItemsToolbar` drop `?page=` (back to page 1).
- Ownership of external items is never shipped wholesale: search proxies annotate each result
  with `owned` for the signed-in user, and Explore/feeds check only the displayed ids via
  `filterOwnedExternalIds` (`src/lib/owned-items.ts`). It's a UX badge only — `addItem`
  rejects duplicates server-side.

## Achievements

`src/lib/achievements.ts` — registry-style evaluator keyed by `requirement.type`:

```json
{ "type": "items_completed", "count": 5, "hobby": "movies" }
{ "type": "all_hobbies", "min_per_hobby": 1, "mode": "logged" }
{ "type": "items_rated", "count": 10 }
```

- Adding a new requirement type = add to the union in `schema.ts` and register in the
  `evaluators` map. No DB migration.
- Adding new achievements = add a row to the seed array; the seed script upserts.
- `checkAchievements(userId)` is called after every counter-changing action (`addItem`,
  `updateItem`, `deleteItem`, `refreshShow`) and on `/achievements` and `/explore` page
  visits (idempotent — only inserts unearned).
- Server actions return `unlocks: AchievementUnlock[]`. Client components dispatch
  `notifyUnlocks(res.unlocks)` on success; the `<UnlockToaster>` mounted in the (main)
  layout shows the Motion toast.

## Guilds

- Roles: **master** (creator; promote / demote / kick / transfer / delete), **officer**
  (kick members, edit description), **member**.
- Master cannot leave a non-empty guild — UI forces transfer first. Master deleting a
  one-member guild is the only "leave that becomes a delete".
- Invite codes generated with `randomBytes` (8 chars, ambiguous letters stripped). Master
  can rotate; old code stops working immediately.
- Max 50 members default, configurable per guild.
- Guild detail page: member list with role badges, invite code, Discord button, leaderboard
  link, settings link (master/officer).
- No global leaderboard, ever. Both `/friends/leaderboard` and `/guilds/[id]/leaderboard`
  require the relevant relationship.
- Guild communication is Discord-linked, not in-app.

## Profile Privacy

Visibility tiers (`users.profileVisibility`), enforced on `/profile/[username]`:

- **public** — anyone signed in
- **friends_only** — owner + accepted friends only (`getFriendshipStatus` from
  `src/lib/friendships.ts`)
- **guild_only** — owner + anyone sharing at least one guild (`shareGuild` from
  `src/lib/guilds.ts`)
- **private** — owner only

Non-permitted viewers get a 404 (not a 403, to avoid leaking existence).

## Account & Auth Recovery

Self-service auth lives in `src/app/(main)/settings/` (authed) and the recovery pages under
`src/app/(auth)/` (public). All flows use single-use `auth_tokens` (SHA-256 hashed, 1-hour TTL).

- **Forgot/reset password** — `requestPasswordResetAction` (generic success regardless of
  whether the email exists, so it can't enumerate accounts; rate-limited per-IP **and**
  per-email) emails a `/reset-password?token=` link; `resetPasswordAction` consumes it and
  rewrites `passwordHash`. JWT sessions can't be server-revoked, so other live sessions
  survive a reset.
- **Change password** — credentials users verify their current password; Google-only users
  (no `passwordHash`) can *set* one to enable email sign-in.
- **Change email** — verify-new-address flow: `requestEmailChangeAction` (credentials users
  only) emails a `/confirm-email?token=` link to the **new** address; the switch happens in
  `confirmEmailChangeAction` (token-authorized, not session-gated, with a uniqueness re-check).
- **Verify email (signup)** — `registerAction` sends a 24-hour `/verify-email?token=` link
  (best-effort — never blocks signup, and login is never gated on verification). Signed-in
  users with `emailVerified` null get a dismissable-per-session banner in the (main) layout
  with a resend action (3/hour per user, fail-open, `checkVerifyResendLimit`). Google
  sign-ins get `emailVerified` stamped by the Auth.js `signIn` event — the adapter leaves it
  null even for OAuth. Existing credentials users were left null on purpose (no backfill);
  they verify via the banner.
- **Delete account** — confirmed by typing the exact username. Resolves guild mastership
  first (promote senior member, or delete a sole-member guild) so no guild is orphaned, then
  deletes the user row — FK cascades clear items, friendships, memberships, achievements,
  accounts and auth_tokens.

Email goes through `src/lib/email/` (Resend). The client **fails soft**: with no
`RESEND_API_KEY` it logs and returns false instead of throwing, so builds, blank-env previews
and tests don't break.

## External APIs

All external calls go through server-side proxies that protect API keys.

- **TMDB movies**: `GET /api/search/movies?q={query}` → `/3/search/movie`.
  Map: `{ externalId, title, year (release_date), imageUrl (poster), externalRating (vote_average) }`.
- **TMDB TV**: `GET /api/search/tv?q={query}` → `/3/search/tv`. Same shape, `name` →
  `title`, `first_air_date` → `year`. Multi-season shows use `getTvShow(externalId)` to
  fetch the full season list at add time, when the add dialog needs a season count, and on
  demand via the row's "refresh" button. See TV Seasons.
- **IGDB**: `GET /api/search/games?q={query}` → `POST /v4/games` with an Apicalypse body.
  Map: `{ id, name, first_release_date (unix seconds), cover.image_id, total_rating }`.
  Covers are built as `images.igdb.com/igdb/image/upload/t_cover_big/{image_id}.jpg` (portrait,
  like TMDB posters). Auth is a Twitch client-credentials bearer token cached in Redis for its
  reported `expires_in` (`src/lib/api/igdb-token.ts`) — never hardcode the lifetime, it differs
  from IGDB's documented example. Queries filter `version_parent = null` to drop editions.
  **Rate limit: 4 req/s, 8 concurrent.** IGDB is mid-migration from enums to tables; the fields
  used here are unaffected, but check the rename list before adding genres or platforms.
- **Open Library**: `GET /api/search/books?q={query}`. Map:
  `{ key, title, first_publish_year, cover_i }`. `externalRating` is null.

Search behavior: client debounces 300ms, hits the proxy, the proxy `cachedSearch`-wraps the
fetcher (15-min Redis TTL), then annotates each result with `owned` for the signed-in user
(after the cache — results are shared across users; fails open).

Cross-tab safety: each hobby tab's add dialog calls only its own `/api/search/{hobby}` route,
and the server action validates `hobbySlug` against the enum, so cross-adding is impossible.

## UI/UX Design Specification

CSS variables (current state in `src/app/globals.css`):

```
--background           dark base
--card / --card-foreground
--primary  #7c5cff     button + accents
--accent   #00e5a0     "in progress" badge, "yes" feedback, achievement icon backgrounds
--warning  #ffa726     notes, slot-warning banners
--destructive          delete buttons + confirm dialogs
--border  #2a2a3a
--muted-foreground / --muted
```

Fonts (`src/app/layout.tsx`, `next/font`):
- **Press Start 2P** (`font-pixel`) — page titles, stat values, achievement section labels.
- **Inter** — body text (default).
- **JetBrains Mono** (`font-mono`) — usernames, point values, invite codes, IDs.

Components:
- Cards: `rounded-xl border border-border bg-card`.
- Status badges: default for completed, accent green for in_progress, outline for planned,
  ghost for dropped.
- "Again?" indicator: `RotateCw` icon (the lucide `Sparkles` icon is BANNED project-wide —
  see memory).
- Sidebar: 240px expanded, 56px collapsed (`w-14`). User avatar + dropdown lives at the
  bottom of the sidebar, not the top header.
- Global search: a Cmd/Ctrl+K command palette, triggered by a compact right-aligned
  button in the header (icon-only below `sm`). The trigger is intentionally NOT a wide
  input-shaped bar — pages pick their own `max-w-*` (e.g. `max-w-7xl` on hobby pages,
  `max-w-3xl` on guilds/friends), so a wide trigger fails to line up with one or the
  other. Right-aligning decouples it. Don't move it to the sidebar or center it
  without re-considering this trade-off.

Animations (Motion) — only `<UnlockToaster>` is wired up so far; the rest of the polish
specced in earlier drafts is deferred.

## File Structure

Source of truth is the actual repo. High-level shape:

```
src/
├── app/page.tsx                        Public landing (`/`); authed users get bounced to /explore
├── app/(auth)/                         Login, register, forgot/reset password, confirm-email,
│   │                                   verify-email
│   │                                   (public; group layout sets robots noindex)
├── app/(main)/                         Authenticated routes (sidebar layout)
│   ├── explore/                        Post-login home: stats, continue-watching, new releases
│   ├── settings/                       Account: change password, change email, delete account
│   ├── movies/  tv/  games/  books/    Hobby pages (use HobbyPage from components/items)
│   ├── achievements/                   Locked + unlocked grid
│   ├── profile/[username]/             Identity card + stats + recent items + edit form
│   ├── friends/                        List + add form + incoming/outgoing requests
│   │   └── leaderboard/                Friends scope ranked
│   ├── guilds/                         List + create + join-by-code
│   │   ├── [id]/                       Detail with members + role-aware actions
│   │   │   ├── settings/               Master/officer edit; master rotate code + delete
│   │   │   └── leaderboard/            Guild scope ranked
│   │   └── join/[code]/                Confirm-and-join landing
│   ├── items/                          Server actions (add/update/delete/refresh) co-located
│   │                                   with the components that call them
│   └── search/                         searchCollection server action for the Cmd+K palette
├── app/api/                            Search proxies + Auth.js handlers
├── app/privacy/                        Public privacy policy (no auth, no sidebar)
├── app/terms/                          Public terms of service (no auth, no sidebar)
├── components/
│   ├── ui/                             shadcn primitives (button, dialog, dropdown, etc.)
│   ├── layout/                         Sidebar, Header, MobileDrawer, SidebarUserMenu
│   ├── items/                          Hobby table, toolbar, add dialog, row actions,
│   │                                   all-seasons bulk editor, row-focus (scroll + pulse
│   │                                   for ?focus= deep links)
│   ├── explore/                        Continue row + new-releases section/rows
│   ├── activity/                       Friend/guild activity feed + skeleton
│   ├── achievements/                   Achievement card + UnlockToaster
│   ├── settings/                       Change-password / change-email / delete-account cards
│   ├── search/                         Cmd+K command palette (header trigger + dialog)
│   └── leaderboard/                    ScopeTabs + Table
├── lib/
│   ├── db/                             Drizzle schema, connection, seed, recalc-points
│   ├── auth/                           Auth.js config, password hashing, username slugify,
│   │                                   tokens (reset/email-change) + pure tokens-crypto
│   ├── email/                          Resend client (fails soft) + transactional templates
│   ├── api/                            tmdb, igdb (+token), openlibrary clients + search-handler + cache
│   ├── points.ts                       Counter delta + snapshotPoints
│   ├── achievements.ts                 Evaluator registry + checker
│   ├── achievement-icons.ts            Slug → lucide icon map
│   ├── friendships.ts                  Friend status helpers
│   ├── guilds.ts                       Guild helpers + invite-code generator
│   ├── leaderboards.ts                 Pure types + sort helpers (client-safe)
│   ├── leaderboard-queries.ts          DB loaders (server-only)
│   ├── rate-limit.ts                   Upstash sliding windows
│   ├── redis.ts                        Shared Upstash client
│   └── notify-unlocks.ts               Window-event dispatcher for achievement toasts
└── types/                              Cross-feature TS types (e.g. ItemRow)
```

## Code Style

- Biome only (single `biome.json`).
- Named exports for components.
- `function` for components, arrow functions for utilities.
- `cn()` helper for conditional classnames.
- Server actions return `{ ok: true, ... } | { ok: false; error: string }`.
- Component file = one component, filename matches the export.
- Don't write JSDoc for trivial functions; do write a short note when a function has subtle
  semantics (snapshot logic, role enforcement, etc.).
- Avoid backwards-compat shims; if something is unused, delete it.

## Git Conventions

**Branches** (kebab-case):
- `feat/<slug>` — new feature
- `fix/<slug>` — bug fix
- `refactor/<slug>` — restructure without behavior change
- `chore/<slug>` — tooling, deps, build
- `docs/<slug>` — docs only
- `ci/<slug>` — CI/workflow changes
- `test/<slug>` — test-only changes

**Commits** — Conventional Commits with the same type prefix (`feat:`, `fix:`, `refactor:`,
`chore:`, `docs:`, `ci:`, `test:`). Optional scope in parens, e.g. `feat(achievements): add
streak tiers`. Subject in the imperative, no trailing period, ≤72 chars.

**Pull requests** — title mirrors the commit style. Body has `## Summary` (1-3 bullets, why
over what) and `## Test plan` (markdown checklist of what was verified).

**Rules**:
- **Always create a new feature branch off `main` before starting any work** (`feat/…`,
  `fix/…`, `refactor/…`, etc. per the prefixes above). Never commit directly to `main`.
- Create new commits rather than amending pushed ones.
- Never `--no-verify`; fix the hook failure instead.
- One logical change per commit when feasible (split docs/code if both touched).

## Environment Variables

```
DATABASE_URL=                 Neon Postgres
AUTH_SECRET=                  openssl rand -base64 32
AUTH_GOOGLE_ID=               Google Cloud Console OAuth client
AUTH_GOOGLE_SECRET=
TMDB_API_KEY=                 themoviedb.org
IGDB_CLIENT_ID=               dev.twitch.tv — IGDB via Twitch OAuth
IGDB_CLIENT_SECRET=
UPSTASH_REDIS_REST_URL=       upstash.com
UPSTASH_REDIS_REST_TOKEN=
RESEND_API_KEY=               resend.com — transactional email (password reset, email change)
```

`RESEND_API_KEY` is optional: without it, email sending fails soft (logs + no-op), so local
dev and previews still run — recovery emails just won't be delivered.
