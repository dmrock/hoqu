# HOQU — Development Guide

## Project Description

HOQU (hoqu.dev) is a hobby tracking web app where users log movies, games, and books they've
consumed. Each completed item earns 1 point. Users unlock pixel-art achievements, join guilds,
and compete with friends. The UI is dark-only with a "modern pixel" aesthetic: clean modern
base with pixel-art accents (badges, XP bars, icons, micro-animations). English only.

## Tech Stack (do not change without explicit approval)

- **Framework**: Next.js 16 (App Router, Turbopack default)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 (dark theme only)
- **UI Base**: shadcn/ui
- **Animations**: Motion (npm package `motion`, imported from `motion/react` — successor to Framer Motion)
- **Database**: PostgreSQL via Neon (`@neondatabase/serverless`)
- **ORM**: Drizzle ORM
- **Auth**: Auth.js v5 (NextAuth) — Email+password + Google, GitHub, Discord OAuth
- **Validation**: Zod
- **Rate Limiting**: Upstash Redis (`@upstash/ratelimit`)
- **External APIs**: TMDB (movies), RAWG (games), Open Library (books)
- **Linting & Formatting**: Biome (replaces ESLint + Prettier)
- **Deployment**: Vercel

## Architecture Rules

1. Use App Router (not Pages Router). All routes in `src/app/`.
2. Server Components by default. Add `"use client"` only when needed (interactivity, hooks).
3. Server Actions for mutations where possible; API routes for search proxies and webhooks.
4. All DB queries go through Drizzle ORM. Never use raw SQL strings.
5. Validate all inputs with Zod schemas. Share schemas between client and server.
6. Use `next/image` for all images. External domains must be in `next.config.ts`.
7. Responsive design: mobile-first. Sidebar collapses to drawer on mobile.
8. All text in English only. No i18n needed.
9. Dark theme only — no light mode toggle needed.
10. **Next.js 16 specifics:**
    - Turbopack is the default bundler — do NOT add `--turbopack` flags, it's automatic.
    - Use `proxy.ts` (not `middleware.ts`) for request interception and auth route protection.
      Export a `proxy` function (not `middleware`).
    - Use `'use cache'` directive for explicit caching of components/functions where appropriate
      (guild pages, leaderboards, search results).
    - React 19.2 features available: View Transitions, useEffectEvent.

## Workflow Rules

**I handle all setup and installation myself.** Claude Code must NOT run install commands,
create accounts, generate API keys, or configure external services automatically. Instead:

1. When a step involves setup/installation/configuration of any tool, service, or dependency —
   provide a detailed step-by-step instruction that I can follow manually.
2. Before writing instructions, check the official documentation (using web search if available)
   to ensure the instructions reflect the latest versions, APIs, and best practices.
3. Include exact commands I should run, exact URLs I should visit, and exact config values
   I should set — but let ME execute them.
4. If a tool's setup process has changed recently, flag it explicitly
   (e.g., "Note: Auth.js v5 changed the config format from v4 — use the new `auth.ts` approach").
5. After I confirm a step is done, proceed to the next one.

This applies to: npm/pnpm installs, database setup, OAuth app creation, environment variables,
third-party API registration, Vercel deployment config, and any other external setup.

Use Drizzle ORM to define schema in `src/lib/db/schema.ts`.

### Tables:

**users**: id (uuid), email, name, username (unique), nickname (optional — fun display name for
profile & leaderboards), passwordHash?, avatarUrl, totalPoints (int — count of completed items),
moviesCompleted (int, default 0), gamesCompleted (int, default 0), booksCompleted (int, default 0),
itemsRated (int, default 0),
profileVisibility (enum: public/friends_only/guild_only/private), discordUsername?,
createdAt, updatedAt.

Note on denormalized counters: `totalPoints`, `moviesCompleted`, `gamesCompleted`,
`booksCompleted`, and `itemsRated` are denormalized for performance. They MUST be updated
atomically whenever an item's status or rating changes. These counters power leaderboards
and achievement checks without expensive COUNT queries. The source of truth is always
the `items` table — if counters drift, recalculate from items.

**hobbies**: id (uuid), slug (unique), name, icon, pointsPerItem (default 1).
Seed with: movies, games, books.

**items**: id (uuid), userId (FK), hobbyId (FK), externalId, title, imageUrl, year?,
externalRating?, userRating (1-10)?, note (500 chars)?, wouldRevisit (bool),
status (enum: completed/in_progress/planned/dropped), completedAt?, createdAt, updatedAt.
Unique constraint on (userId, hobbyId, externalId).

**guilds**: id (uuid), name (unique), description (300 chars)?, iconUrl?, inviteCode (unique, 8 chars),
discordInviteUrl?, maxMembers (default 50), createdAt, updatedAt.

**guild_members**: composite PK (guildId, userId), role (enum: master/officer/member), joinedAt.

**friendships**: id (uuid), requesterId (FK), addresseeId (FK), status (enum: pending/accepted/declined), createdAt, updatedAt.

**achievements**: id (uuid), slug (unique), name, description, icon, category (enum: general/movies/games/books/social), requirement (jsonb), sortOrder (int).

**user_achievements**: composite PK (userId, achievementId), unlockedAt.

### Seed Data

Seed `hobbies` table with movies, games, books.
Seed `achievements` table with starter achievements (see Achievements section).

## Points & Counter System

- **1 point per completed item** — only items with `status = "completed"` count
- When item status changes: update `totalPoints` AND the relevant hobby counter
  (`moviesCompleted`, `gamesCompleted`, or `booksCompleted`) using atomic increment/decrement
- When item rating changes: update `itemsRated` (increment if rating added, decrement if removed)
- When item is deleted: update all affected counters
- All counter updates should happen in a single transaction with the item update
- No points for in_progress, planned, or dropped
- Display an honor system message in UI: "We trust our adventurers to log their quests honestly"
- **Recalculation endpoint**: build an admin/debug endpoint that recalculates all counters
  from the items table (source of truth) in case of drift

## Anti-Spam Protection

Use Upstash Redis for rate limiting (`@upstash/ratelimit`):
- **Hourly limit**: 50 items added per hour (generous for initial bulk import)
- **Daily limit**: 200 items added per day
- Friendly UI warning when approaching limit (e.g., "You're on a roll! {remaining} slots left today")
- No hard block for new users doing initial bulk import — show encouragement
- Server-side validation: items must originate from external API search (no freeform title entry)
- Duplicate prevention: unique constraint (userId, hobbyId, externalId)

## Achievements System

Achievement definitions are stored in the `achievements` DB table with a JSONB `requirement` field.
This allows adding new achievements without schema migrations.

### Requirement format:

```json
{ "type": "items_completed", "count": 1 }
{ "type": "items_completed", "count": 10, "hobby": "movies" }
{ "type": "items_completed", "count": 100 }
{ "type": "all_hobbies", "min_per_hobby": 5 }
{ "type": "items_rated", "count": 10 }
```

### Achievement checker (`src/lib/achievements.ts`):
- Run after every item status change (completed/uncompleted) or rating change
- **Use denormalized counters from users table** (`totalPoints`, `moviesCompleted`,
  `gamesCompleted`, `booksCompleted`, `itemsRated`) — do NOT run COUNT queries
- Compare counters against unearned achievements
- If criteria met → insert into `user_achievements`, trigger unlock animation
- Must be idempotent (safe to re-run)

### Starter achievements to seed:

| Slug | Name | Criteria |
|------|------|----------|
| first_step | First Step | 1 completed (any) |
| movie_buff_5 | Movie Buff | 5 completed (movies) |
| gamer_5 | Gamer | 5 completed (games) |
| bookworm_5 | Bookworm | 5 completed (books) |
| movie_buff_25 | Cinephile | 25 completed (movies) |
| gamer_25 | Hardcore Gamer | 25 completed (games) |
| bookworm_25 | Scholar | 25 completed (books) |
| well_rounded | Well Rounded | 5+ in each hobby |
| century | Century | 100 completed (any) |
| dedicated | Dedicated | 50 in any single hobby |
| explorer | Explorer | 1+ in all 3 hobbies |
| critic | Critic | 10 items rated |

### Extending achievements:
Add new rows to `achievements` table. Add new `type` handlers in `achievements.ts`.
No schema changes needed. Future types: streaks, social, seasonal.

## Guild System

Guilds are social groups where members compare progress in a friendly, self-moderated environment.
No in-app chat — guilds link to Discord for communication.

**Leaderboard philosophy:** There is NO global leaderboard. Competition exists only within
guilds and among friends. This is intentional — small-group accountability prevents cheating
better than any algorithm. Guild masters can kick dishonest members. Friends call each other
out. Points and achievements are primarily for personal motivation.

### Roles:
- **Guild Master** (creator): full control — edit guild, manage roles, kick, delete, transfer ownership
- **Officer** (promoted by Master): can kick members, edit guild description
- **Member** (default on join): view guild content, leave

### Features:
- Guild page: member list with role badges, guild leaderboard, guild stats
- "Join Guild Discord" button → opens `discordInviteUrl` in new tab
- Max 50 members (configurable per guild)
- Users can join multiple guilds
- Invite via shareable code/link

## Profile Privacy

Users choose their visibility in settings:
- **Public**: anyone can view profile, dashboard, items, achievements
- **Friends only**: only accepted friends see full profile
- **Guild only**: only members of shared guilds see full profile
- **Private**: only the user sees their own profile

All API endpoints that return user data MUST check `profileVisibility` and the
requesting user's relationship (friend? same guild?) before returning data.

## External API Integration

All external API calls go through server-side proxy routes to protect API keys.

### TMDB (Movies/TV)
- Search: `GET /api/search/movies?q={query}`
- Proxy to: `https://api.themoviedb.org/3/search/movie`
- Map to: { externalId, title, year, imageUrl (poster), externalRating (vote_average) }

### RAWG (Games)
- Search: `GET /api/search/games?q={query}`
- Proxy to: `https://api.rawg.io/api/games?search={query}`
- Map to: { externalId, title, year (released), imageUrl (background_image), externalRating (metacritic) }

### Open Library (Books)
- Search: `GET /api/search/books?q={query}`
- Proxy to: `https://openlibrary.org/search.json?q={query}`
- Map to: { externalId (key), title, year (first_publish_year), imageUrl (covers), externalRating: null }

### Search Behavior
- Client sends debounced query (300ms) to our proxy
- Show autocomplete dropdown with results (max 8)
- On select: auto-fill item form with external data
- Client-side: cache search results in React state during session
- **Server-side: cache search results in Upstash Redis (TTL 15 minutes)**
  - Cache key pattern: `search:{hobby}:{normalized_query}` (lowercase, trimmed)
  - On search request: check Redis first → if hit, return cached → if miss, call external API, cache response, return
  - This protects external API rate limits and dramatically speeds up repeated/popular queries
  - Use the same Upstash Redis instance as rate limiting

## UI/UX Design Specification

### Color Tokens (CSS variables in globals.css)

```css
:root {
  --bg-primary: #0a0a0f;
  --bg-surface: #14141f;
  --bg-surface-hover: #1e1e2e;
  --border: #2a2a3a;
  --color-primary: #7c5cff;
  --color-primary-hover: #9d82ff;
  --color-accent: #00e5a0;
  --color-warning: #ffa726;
  --color-error: #ff5252;
  --text-primary: #e8e8f0;
  --text-secondary: #8888a0;
  --guild-gold: #ffd700;
  --officer-silver: #c0c0c0;
}
```

### Fonts
- Headings, badges, points: "Press Start 2P" (Google Fonts)
- Body text: "Inter"
- Stats/numbers: "JetBrains Mono"
Load via `next/font`.

### Component Style Guide
- Cards: `bg-surface`, `border border-border`, `rounded-xl`, subtle hover glow
- Buttons primary: `bg-primary hover:bg-primary-hover`, pixel-style border
- Inputs: `bg-surface`, `border-border`, `focus:ring-primary`
- Pixel elements: use SVG or small PNG sprites, `image-rendering: pixelated`
- XP bar: segmented fill, animated with Motion
- Rating stars: 10 pixel-art stars, fill sequentially with sparkle animation
- Achievement badges: pixel-art icons, grayscale when locked, colorful when unlocked
- Guild role badges: gold (Master), silver (Officer), none (Member)

### Layout
- Sidebar: 72px collapsed / 240px expanded, fixed left
- Header: 64px height, search bar + user menu
- Content: max-w-7xl, centered, responsive grid
- Mobile: sidebar becomes full-width drawer

### Animations (Motion — `import { motion } from "motion/react"`)
- Page transitions: `x: -20, opacity: 0` → `x: 0, opacity: 1` (200ms ease-out)
- Cards: `whileHover={{ y: -4, boxShadow: "..." }}`
- Item add: scale pop (0.8 → 1.0) + optional confetti
- Points: `animate={{ value }}` with counting effect
- Achievement unlock: toast notification with pixel fanfare + badge reveal
- Staggered lists: `staggerChildren: 0.05`
- Skeleton: shimmer gradient animation

## File Structure

Follow the structure below. Do NOT create files outside this pattern without asking.

```
src/
├── app/(auth)/          # Login, register (no sidebar)
├── app/(main)/          # All authenticated pages (with sidebar layout)
│   ├── dashboard/
│   ├── movies/ games/ books/
│   ├── profile/[username]/
│   ├── settings/
│   ├── achievements/
│   ├── guilds/
│   │   ├── [id]/
│   │   │   └── settings/
│   └── friends/
├── app/api/             # API routes
├── components/ui/       # shadcn/ui
├── components/layout/   # Sidebar, Header, MobileDrawer
├── components/items/    # Item-related components
├── components/guilds/   # Guild components
├── components/achievements/ # Achievement components
├── components/pixel/    # Pixel-art themed components
├── lib/db/              # Drizzle schema, connection, migrations, seed
├── lib/auth/            # Auth.js configuration
├── lib/api/             # External API clients (TMDB, RAWG, OpenLibrary)
├── lib/achievements.ts  # Achievement checker
├── lib/points.ts        # Points calculation
├── lib/rate-limit.ts    # Anti-spam (Upstash)
├── hooks/               # Custom React hooks
├── types/               # Shared TypeScript types
└── styles/              # Global CSS
```

## Development Phases

### Phase 1 (MVP — build this first):
1. Project setup (Next.js, Tailwind, Drizzle, Neon, Auth.js)
2. Database schema + migrations + seed (hobbies + achievements)
3. Auth (register, login, OAuth, username/nickname setup)
4. Sidebar layout + routing
5. External API search proxies
6. Item CRUD (add via search, rate, note, status with dropped, delete)
7. Points system (1 per completed)
8. Anti-spam rate limiting
9. Achievement system + unlock animations
10. Dashboard with stats + achievement showcase
11. Settings page (profile, privacy, Discord username)
12. Polish: animations, pixel components, responsive

### Phase 2 (Social — build after Phase 1 is complete):
1. User profiles with privacy enforcement
2. Friend requests
3. Guilds (create, invite, join, roles, Discord link)
4. Leaderboards (guild-only and friends-only, per-hobby filters — NO global leaderboard, ever)

## Code Style

- Use Biome for linting and formatting (single `biome.json` config). Do NOT install ESLint or Prettier.
- Use named exports (not default) for components
- Prefer `function` keyword for components, arrow functions for utilities
- Use `cn()` helper (from shadcn) for conditional classnames
- Error handling: try/catch with meaningful error messages, never silent fails
- API responses: always return `{ data, error }` shape
- Prefer composition over prop drilling — use React Context sparingly
- Write JSDoc comments for complex functions
- Component files: one component per file, filename matches component name
- Pre-commit hook: use Husky + lint-staged with `biome check --write` (not eslint/prettier)

## Environment Variables

```
DATABASE_URL=              # Neon Postgres connection string
NEXTAUTH_SECRET=           # Random secret for Auth.js
NEXTAUTH_URL=              # http://localhost:3000 (dev)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
TMDB_API_KEY=              # From themoviedb.org
RAWG_API_KEY=              # From rawg.io
UPSTASH_REDIS_REST_URL=    # From upstash.com
UPSTASH_REDIS_REST_TOKEN=
```
