# HOQU

A hobby tracker where you log movies, TV shows, games, and books, earn points, unlock achievements, and compare progress with friends or guildmates. Dark-only modern UI with pixel-art accents. English only.

## Tech stack

- **Framework**: Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 · shadcn/ui
- **Database**: PostgreSQL (Neon) · Drizzle ORM
- **Auth**: Auth.js v5 (email/password + Google OAuth)
- **Cache + rate limiting**: Upstash Redis
- **External catalogs**: TMDB (movies + TV) · RAWG (games) · Open Library (books)
- **Animations**: Motion · **Lint/format**: Biome · **Hosting**: Vercel

## Getting started

### Prerequisites

- Node.js 22 (see `.nvmrc` — run `nvm use`), pnpm 10+
- A Neon Postgres database
- An Upstash Redis instance
- API credentials: Google OAuth, TMDB, RAWG

### Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Configure environment** — copy `.env.example` to `.env.local` and fill in:

   ```
   DATABASE_URL=
   AUTH_SECRET=                  # openssl rand -base64 32
   AUTH_GOOGLE_ID=
   AUTH_GOOGLE_SECRET=
   TMDB_API_KEY=
   RAWG_API_KEY=
   UPSTASH_REDIS_REST_URL=
   UPSTASH_REDIS_REST_TOKEN=
   ```

3. **Initialize the database:**

   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

4. **Run the dev server:**

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Common commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server |
| `pnpm build` / `pnpm start` | Production build / run |
| `pnpm exec biome check --write` | Lint + format |
| `pnpm tsc --noEmit` | Typecheck |
| `pnpm db:generate` | Generate a Drizzle migration from schema changes |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:seed` | Upsert hobbies + starter achievements |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm tsx src/lib/db/recalc-points.ts` | One-off backfill of `items.points_awarded` + `users.total_points` |

To scaffold a new shadcn/ui component, use `pnpm dlx shadcn@latest add <component>` — never `pnpm add shadcn`.

## Project structure

```
src/
  app/(auth)/                Login, register
  app/(main)/                Authenticated routes (sidebar layout)
    dashboard/
    movies/  tv/  games/  books/
    achievements/
    profile/[username]/
    friends/                  friends/leaderboard/
    guilds/                   guilds/[id]/  guilds/[id]/settings/
                              guilds/[id]/leaderboard/  guilds/join/[code]/
  app/api/                   Search proxies + auth handlers
  app/privacy/  app/terms/   Public legal pages (no sidebar, no auth)
  components/                UI primitives + per-feature components
  lib/                       Db, auth, points, achievements, leaderboards,
                             friendships, guilds, rate-limit, redis, api clients
drizzle/                     Generated SQL migrations
.github/workflows/           CI workflow (typecheck, lint, unit, integration, e2e)
```

## Deployment

Hosted on Vercel at [hoqu.dev](https://hoqu.dev) and auto-deployed on every push to `main`.

**PR workflow:**

1. Create a feature branch and open a PR.
2. GitHub Actions runs typecheck, lint, unit tests, and integration + E2E against an ephemeral Neon branch — see [.github/workflows/ci.yml](.github/workflows/ci.yml).
3. Vercel creates a per-PR preview deploy.
4. When CI is green, merge the PR. Vercel deploys to production.

Branch protection isn't enforceable on GitHub Free private repos, so the workflow is by convention: always go through a PR, never push directly to `main`.

**Build command:** Vercel runs `pnpm db:migrate && pnpm db:seed && pnpm build`, so schema migrations and the hobby/achievement seed catalog stay in sync with each prod deploy.

**Environment split:**

- **Local dev** — `.env.local` (gitignored) points at the dev Neon branch, dev Upstash, and the `hoqu-dev` Google OAuth client.
- **Production** — env vars set in Vercel (Production scope) point at the prod Neon branch, prod Upstash, the `hoqu-prod` Google OAuth client, and a separate `AUTH_SECRET`.
- **Preview** — per-PR env vars intentionally left unconfigured. Previews still build (a useful signal that code compiles) but don't run at runtime. Revisit if we ever need to demo PRs at a real URL or share previews with collaborators.
