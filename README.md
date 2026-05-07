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

- Node.js 20+, pnpm 10+
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
  components/                UI primitives + per-feature components
  lib/                       Db, auth, points, achievements, leaderboards,
                             friendships, guilds, rate-limit, redis, api clients
drizzle/                     Generated SQL migrations
```

## Deployment

Deploys on Vercel. Set the environment variables in the Vercel project settings; database migrations are part of the release process (`pnpm db:migrate`).
