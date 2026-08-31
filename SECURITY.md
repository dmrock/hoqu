# Security Policy

## Reporting a vulnerability

Email **hello@hoqu.dev**. Please don't open a public issue for anything exploitable.

Include what you found, the steps to reproduce it, and what an attacker could do with it. If you
need to demonstrate it against the live site, use your own account and don't touch anyone else's
data.

HOQU is a hobby project maintained by one person, so there's no bounty and no guaranteed
response window — but reports are read and taken seriously. Please allow a reasonable window to
ship a fix before disclosing publicly.

## Scope

Only [hoqu.dev](https://hoqu.dev) and this repository. The upstream services HOQU depends on —
Neon, Upstash, Vercel, TMDB, IGDB, Open Library, Resend — have their own disclosure programs.

Out of scope: reports that boil down to the honor system (HOQU trusts people to log their own
items truthfully), missing rate limits on unauthenticated reads, and findings from automated
scanners with no demonstrated impact.
