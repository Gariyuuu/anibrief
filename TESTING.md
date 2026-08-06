# TESTING.md

> Snapshot: 2026-08-06 05:59:28 MST.

## Current test strategy

There isn't one yet. `package.json` declares a `test` script, but zero
test files exist anywhere in the repository.

## Test frameworks

- **Configured:** Node's built-in test runner, invoked via
  `node --experimental-strip-types --test src/**/__tests__/**/*.test.ts`
  (no Jest/Vitest/Playwright dependency installed).
- **Not configured:** no E2E framework, no component-testing framework,
  no visual-regression tooling.

## Test directory structure

None exists. The `test` script's glob (`src/**/__tests__/**/*.test.ts`)
implies the intended convention is a `__tests__/` folder colocated
within each `src/lib/**`/`src/components/**` directory, but no such
folder has been created anywhere.

## Existing tests

None. Running `npm run test` produces:
```
ℹ tests 0
ℹ suites 0
ℹ pass 0
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```
This is an empty pass, not a failure — the command exits 0.

## Missing test areas (highest-value first)

1. **`src/lib/dedup/{textSimilarity,clusterNews}.ts`** — pure functions,
   currently unverified by any means, and not exercised by any real
   page yet either (see `FILE_MAP.md`) — a unit test suite here would
   be the cheapest way to gain confidence before wiring it into a page.
2. **`src/lib/providers/news/reliability.ts`** (`classifyReliability`,
   `looksLikeRumor`) — pure functions, easy to test, directly affects
   what a user sees labeled "Reputable"/"Unconfirmed."
3. **`src/lib/providers/anilist/mappers.ts`** (`mapMedia`, `mapStaff`,
   `mapCharacterBirthday`) — pure transform functions with meaningful
   edge cases (missing fields, HTML-stripping regex, fuzzy dates) that
   are currently unverified.
4. **`src/lib/utils/{dates,retry}.ts`** — pure/near-pure utility
   functions, cheap to test.
5. **Server actions** (`src/lib/actions/*.ts`) — would need either a
   real (disposable/dev) Neon database or a mocked Drizzle client; higher
   setup cost, but this is where the auth/DB-degradation contract
   (`requireUser()`) most needs regression protection.

## Manual testing steps (smoke-test checklist)

No page exists to smoke-test yet (see `FEATURES.md`). Once `src/app/page.tsx`
lands (`TASKS.md` T-002), a minimal checklist would be:

### Setup
1. `npm install` (already done — `node_modules/` present).
2. Optionally set `DATABASE_URL`/`ANTHROPIC_API_KEY`/`YOUTUBE_API_KEY`
   in `.env.local` to exercise the non-degraded paths.
3. `npm run dev`.

### Core loop (once a home page exists)
1. Visit `/` — confirm no console error, hero section renders with
   either a template or AI-generated summary.
2. Confirm stat tiles show numbers (not `NaN`/`undefined`).
3. Confirm the episode timeline either lists today's airing episodes or
   shows its `EmptyState`.
4. Confirm the news list either shows articles or its `EmptyState`.
5. Press ⌘K (or `/`) — confirm the command palette opens, type 2+
   characters, confirm results appear (requires network access to
   AniList).
6. Toggle dark/light mode — confirm no FOUC and the toggle persists on
   reload.
7. Change the accent color — confirm it persists on reload.
8. Click "Sign in" — confirm Clerk's modal/page opens (requires real
   Clerk keys to fully complete).
9. Once signed in: click "Add to list" on an episode card — requires
   `DATABASE_URL` configured to actually persist; without it, confirm
   the thrown "not configured" error is shown inline rather than
   crashing the page.

### Regression check after any `src/lib/providers/**` change
Re-run the manual palette search (step 5) and confirm the shape of
results hasn't changed in a way that breaks `CommandPalette.tsx`'s
consumption of them.

### Regression check after any `src/lib/db/schema/**` change
Run `npm run db:generate` and review the generated SQL diff before
assuming the change is safe; do not run `npm run db:push` against any
database without explicit permission.

## Test data / fixtures / mocks

None exist. No `.json` fixture files, no MSW/mock-server setup for the
external APIs (AniList, Jikan, YouTube, Google News RSS) — any future
unit tests for the provider layer would need to introduce mocking from
scratch.

## Test environment variables

None documented (no `.env.test`, no test-specific config found).

## Coverage gaps

Effectively 100% — there is no test coverage of any kind in this
repository as of the snapshot.

## Critical untested flows

- Sign-in/sign-up (Clerk) — never exercised in a browser this session.
- Any DB write path — never exercised against a real database.
- The AI summary path — never exercised against real API keys.
- The dedup/clustering logic — implemented but never exercised by any
  real page, and has no unit tests.

## Known flaky tests

None — there are no tests to be flaky.

## Pre-release checklist

Given the current state, a realistic pre-release checklist (for
whenever this project nears its first real deploy) would include:

- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes (currently does not — 5 errors, 3 warnings,
      see `TASKS.md` T-001).
- [ ] `npm run build` succeeds.
- [ ] At least the manual smoke-test checklist above passes against a
      real `DATABASE_URL` and real Clerk keys.
- [ ] `vercel.json`'s cron targets either all exist or are removed from
      the config (currently none exist — see `TASKS.md` T-003).
- [ ] `.env.example` exists and matches `CLAUDE.md`'s env var table
      (currently no `.env.example` exists).
- [ ] Some minimum unit test coverage exists for the pure-function
      layers listed above (currently zero).
