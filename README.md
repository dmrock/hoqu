# HOQU

A hobby tracker where you log movies, TV shows, games, and books, earn points, unlock achievements, and compare progress with friends or guildmates. Dark-only modern UI with pixel-art accents. English only.

Free to use at [hoqu.dev](https://hoqu.dev), open source under the [MIT license](LICENSE), and staying that way — no paid tiers, no ads.

## Support

Questions, bugs, and feature requests go through [GitHub Issues](https://github.com/dmrock/hoqu/issues) —
pick a form and it lands in the right lane. See [hoqu.dev/support](https://hoqu.dev/support) for
which is which.

Anything private — account trouble, a privacy request, a security report — goes to
**hello@hoqu.dev** instead. Security specifically: see [SECURITY.md](SECURITY.md).

Thinking about a pull request? Read [CONTRIBUTING.md](CONTRIBUTING.md) first — open an issue
before writing code.

## Tech stack

- **Framework**: Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 · shadcn/ui
- **Database**: PostgreSQL (Neon) · Drizzle ORM
- **Auth**: Auth.js v5 (email/password + Google OAuth)
- **Cache + rate limiting**: Upstash Redis
- **External catalogs**: TMDB (movies + TV) · IGDB (games) · Open Library (books)
- **Animations**: Motion · **Lint/format**: Biome · **Hosting**: Vercel

## Getting started

### Prerequisites

- Node.js 22 (see `.nvmrc` — run `nvm use`), pnpm 10+
- A Neon Postgres database
- An Upstash Redis instance
- API credentials: Google OAuth, TMDB, IGDB/Twitch

### Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Configure environment:**

   ```bash
   cp .env.example .env.local
   ```

   `.env.example` documents every variable and where its value comes from. Everything above
   the "Optional" divider is needed to boot the app.

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
    explore/
    movies/  tv/  games/  books/
    achievements/
    settings/
    profile/[username]/
    friends/                  friends/leaderboard/
    guilds/                   guilds/[id]/  guilds/[id]/settings/
                              guilds/[id]/leaderboard/  guilds/join/[code]/
  app/api/                   Search proxies + auth handlers
  app/support/               Public support page (no sidebar, no auth)
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

Always go through a PR, never push directly to `main`.

**Build command:** Vercel runs `pnpm db:migrate && pnpm db:seed && pnpm build`, so schema migrations and the hobby/achievement seed catalog stay in sync with each prod deploy.

**Environment split:**

- **Local dev** — `.env.local` (gitignored) points at the dev Neon branch, dev Upstash, and the `hoqu-dev` Google OAuth client.
- **Production** — env vars set in Vercel (Production scope) point at the prod Neon branch, prod Upstash, the `hoqu-prod` Google OAuth client, and a separate `AUTH_SECRET`.
- **Preview** — per-PR env vars intentionally left unconfigured. Previews still build (a useful signal that code compiles) but don't run at runtime. Revisit if we ever need to demo PRs at a real URL or share previews with collaborators.

## License

[MIT](LICENSE) © dmrock.

Catalog data and images come from [TMDB](https://www.themoviedb.org/),
[IGDB](https://www.igdb.com/), and [Open Library](https://openlibrary.org/), each under their
own terms — the MIT license covers this project's code, not their data. This product uses the
TMDB API but is not endorsed or certified by TMDB.
