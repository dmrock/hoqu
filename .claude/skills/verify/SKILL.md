---
name: verify
description: Build/launch/drive recipe for verifying HOQU changes end-to-end at the running app.
---

# Verifying HOQU changes

## Launch a production server (needed for rate limits)

Every rate limiter dev-skips (`NODE_ENV === "development"` in `src/lib/rate-limit.ts`), so
`pnpm dev` and the Playwright e2e server on :3100 can never show a limit tripping. Use a
production build pointed at the e2e Neon branch:

```bash
pnpm build
export DATABASE_URL="$(grep '^E2E_DATABASE_URL=' .env.local | cut -d= -f2- | tr -d '"')"
AUTH_TRUST_HOST=true node_modules/.bin/next start -p 3101   # trustHost isn't set in auth config
```

- `E2E_DATABASE_URL` lives in `.env.local` (there is no `.env.test.local`).
- Next won't override an exported `DATABASE_URL` with the `.env.local` value.
- Redis/Upstash creds come from `.env.local` — limits hit the real Redis; sliding-window
  keys expire on their own.
- Port 3101 avoids `pnpm dev` (:3000) and Playwright (:3100).

## Test users without sending email

Registering through the UI emails the address via Resend — don't register fake users through
the form. Insert users directly (bcryptjs, cost 10) into the e2e branch and log in through
`/login`; login sends nothing. The e2e DB is truncated at the start of every `playwright test`
and integration run, so leftover rows are fine.

## Driving

Plain `@playwright/test` chromium scripts work, but run them with `tsx` from the **repo root**
(pnpm's isolated `node_modules` doesn't resolve from outside the project, and scratchpad
scripts are CJS — no top-level await; wrap in `main()`). Selectors worth reusing live in
`e2e/pages/*.page.ts` (getByRole/getByLabel).

- Friend request feedback renders inline as `form p.text-xs` on `/friends`.
- Server-action errors surface in that paragraph; an unhandled action error would instead
  break the transition — friendly text appearing IS the pass signal.
- Upstash sliding-window `resetAt` is the window boundary, not now+window — "~41 min" for a
  1-hour limit is correct behavior, not a bug.
