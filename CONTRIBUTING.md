# Contributing

HOQU is a personal project I build for fun and to have something real to point at. It's MIT
licensed and free, and it will stay that way — but it isn't looking for co-maintainers, and
the roadmap is whatever I feel like building next. Setting that expectation up front so
nobody sinks a weekend into a PR that gets a polite no.

## The most useful things you can do

**Report a bug.** [Open a bug report](https://github.com/dmrock/hoqu/issues/new?template=bug_report.yml).
If the app showed you an error screen, its "Report it" button carries the error code across.

**Ask a question.** [Ask here](https://github.com/dmrock/hoqu/issues/new?template=question.yml) —
the answer stays searchable for whoever hits the same thing.

**Suggest a feature.** [Open a request](https://github.com/dmrock/hoqu/issues/new?template=feature_request.yml).
One idea per issue, with the problem it solves.

Anything private — account trouble, a privacy request, a security report — goes to
hello@hoqu.dev instead. Security specifically: see [SECURITY.md](SECURITY.md).

## Pull requests

**Open an issue first** and wait for a reply. An unsolicited PR, however good, may be closed
simply because it goes somewhere I don't want the project to go.

If we've agreed on the change:

1. Branch off `main` using the type prefixes: `feat/`, `fix/`, `refactor/`, `chore/`,
   `docs/`, `ci/`, `test/`.
2. Commit with [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`,
   `fix:`, and so on, imperative subject, no trailing period.
3. Run `pnpm test:all` and `pnpm lint` before pushing. CI runs typecheck, lint, unit tests,
   and integration + E2E against an ephemeral database; the last two won't run on PRs from
   forks, since they need credentials a fork can't have.
4. Keep one logical change per PR. Split docs from code where both are touched.
5. Fill in the PR template — a short summary and what you actually verified.

Local setup lives in the [README](README.md); architecture notes and conventions live in
[CLAUDE.md](CLAUDE.md).

## Forking

Forking to build your own thing is explicitly fine — that's what the MIT license is for. You
don't need permission and you don't owe me attribution beyond the license text.
