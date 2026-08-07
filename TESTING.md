# TESTING.md

> Re-synced 2026-08-06 ~15:35 MST against the actual current git state (commit
> `1d1eef9`). The previous version of this file described zero tests and zero
> reachable pages; both have changed. All numbers below were re-produced by
> actually running the commands this pass, not copied from a prior report.

## Current test strategy

Unit tests for pure-function logic (dedup, mapping, reliability classification,
date/season utilities), run via Node's built-in test runner. **No integration,
E2E, or component-testing layer exists** — this hasn't changed since the previous
pass, only the unit-test layer has (from zero to 24 passing tests).

## Test frameworks

- **Configured:** Node's built-in test runner, invoked via
  `node --experimental-strip-types --import ./scripts/register-loader.mjs --test
  src/**/__tests__/**/*.test.ts`. `scripts/register-loader.mjs` and
  `scripts/resolve-aliases.mjs` (both new since the previous pass) support running
  TypeScript test files directly with the `@/*` path alias resolved, without a
  separate build step.
- **Not configured:** no Jest/Vitest, no E2E framework (Playwright/Cypress), no
  component-testing framework, no visual-regression tooling, no CI workflow
  (`.github/workflows/` doesn't exist).

## Existing tests — re-run this pass, all passing

```
npm run test
...
ℹ tests 24
ℹ suites 0
ℹ pass 24
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Five test files, all under `__tests__/` directories colocated with the code they
test:

| File | Tests | Covers |
|---|---|---|
| `src/lib/dedup/__tests__/clusterNews.test.ts` | 3 | Grouping near-identical headlines across sources; exact-URL-duplicate handling; canonical-source preference in a cluster |
| `src/lib/dedup/__tests__/textSimilarity.test.ts` | 5 | `normalizeText`, `jaccardSimilarity` (identical/near-duplicate/unrelated/empty-string cases) |
| `src/lib/providers/anilist/__tests__/mappers.test.ts` | 6 | `mapMedia`'s title fallback chain, HTML-stripping, spoiler-tag filtering, id-namespacing, MAL-id carry-through |
| `src/lib/providers/news/__tests__/reliability.test.ts` | 3 | `classifyReliability` (known/unknown outlets), `looksLikeRumor` |
| `src/lib/utils/__tests__/dates.test.ts` | 3 | `formatCountdown` (past/near-term/far-out) |
| `src/lib/utils/__tests__/season.test.ts` | 4 | `currentSeason`, year-rollover, `adjacentSeason`, `seasonLabel` |

(Table has 6 rows for 5 files — `dates.test.ts`/`season.test.ts` are both under
`src/lib/utils/__tests__/`, counted separately above for clarity.)

This directly resolves the previous documentation pass's top-listed testing gap
("Missing test areas (highest-value first)" #1–#4 below are now built).

## Node runtime warnings (non-fatal, observed this run)

Each test file emits a `MODULE_TYPELESS_PACKAGE_JSON` warning
("Module type... is not specified... Reparsing as ES module... this incurs a
performance overhead") because `package.json` has no `"type": "module"` field, plus
a `DEP0205` deprecation warning for `module.register()`. Both are cosmetic/
performance-only, not failures — all 24 tests still pass. Fixable by adding
`"type": "module"` to `package.json`, not done by this pass (application-file
change, out of scope for a documentation-only re-sync).

## Missing test areas (highest-value first, updated)

1. **Server actions** (`src/lib/actions/*.ts`) — still zero automated coverage.
   This is now the single highest-value gap, since these are the write paths for
   every real, deployed feature (lists, follows, alerts, admin actions). Would need
   either a real (disposable/dev) Neon database or a mocked Drizzle client.
2. **Cron routes** (`src/app/api/cron/*`) and `src/lib/cron/runCronJob.ts`'s
   idempotency-lock logic — no tests; this is genuinely tricky/valuable logic
   (lock-key bucketing, skip-if-already-succeeded) that would benefit from unit
   coverage independent of a real cron trigger.
3. **`src/lib/utils/calendarEvents.ts`** (`episodeToEvent`/`reminderToEvent`) and
   the `.ics`-building helpers in `src/app/api/calendar/ics/route.ts` — pure-ish
   functions, currently unverified.
4. **`src/lib/actions/listImport.ts`**'s CSV-parsing/mapping-preview logic — not
   independently re-read line-by-line this pass; likely has meaningful edge cases
   (malformed rows, duplicate titles) worth covering.
5. Previously listed here and now resolved: dedup/reliability/mapper/date/season
   pure-function coverage — all built (see table above).

## Manual testing steps (smoke-test checklist) — not executed this pass

The app is deployed and buildable, but **no AI session has run a real browser
smoke test** against either `npm run dev` or the live
https://anibrief.vercel.app deployment. This checklist (updated from the previous
pass to reflect that pages now exist) is still the recommended first real
verification step for whoever picks this up next:

### Setup
1. `npm install` (already done — `node_modules/` present).
2. This local environment already has `DATABASE_URL` + Clerk keys configured (see
   `CLAUDE.md`'s "Environment setup"). No AI key/`YOUTUBE_API_KEY`/`ADMIN_USER_IDS`
   set locally.
3. `npm run dev`.

### Core loop
1. Visit `/` — confirm no console error, hero section renders with the template
   summary (no AI key configured locally).
2. Confirm stat tiles show numbers.
3. Confirm the episode timeline lists today's airing episodes or its `EmptyState`.
4. Confirm the news list shows articles or its `EmptyState`; confirm duplicate
   stories from multiple outlets are clustered (new since the previous checklist —
   `clusterNews` is now wired in).
5. Press ⌘K, type 2+ characters, confirm results appear and clicking one navigates
   to a real `/anime/[id]` or `/manga/[id]` page (previously 404ed — now should
   resolve).
6. Toggle dark/light mode and accent color — confirm persistence on reload.
7. Sign in (real Clerk flow) — confirm redirect back per the configured fallback
   URL.
8. Once signed in: add a title to My List at `/my-list`, follow a person at
   `/people/[id]`, create an alert at `/alerts`, edit a setting at `/settings` —
   confirm each persists (this environment has a real `DATABASE_URL`, so these
   should actually write, not show a "not configured" error).
9. Visit `/admin` while signed in — confirm redirect to `/` (since
   `ADMIN_USER_IDS` is unset locally and no `profiles.isAdmin` row is expected to
   exist yet); this is the correct behavior to confirm the auth-bypass fix holds,
   not a bug.
10. Download `/api/calendar/ics` and confirm a valid, openable `.ics` file.

### Regression check after any `src/proxy.ts` change
Re-run step 9 specifically — this is the exact route the production auth-bypass
bug lived in.

### Regression check after any `src/components/briefing/**` change
Re-run step 1 and check the browser console for a serialization error — this is
the exact area the production RSC-crash bug lived in (a function prop crossing the
server/client boundary).

### Regression check after any `src/lib/providers/**` change
Re-run the command-palette search (step 5).

### Regression check after any `src/lib/db/schema/**` change
Run `npm run db:generate` and review the generated SQL diff. **Do not run
`npm run db:push`** against this environment's `DATABASE_URL` without explicit
permission — it now points at a real, already-schema-pushed database, not a
disposable one.

## Test data / fixtures / mocks

None exist beyond what's inline in the 5 test files (hand-written literal
fixtures per test, no shared `.json` fixture files, no MSW/mock-server setup) —
unchanged from the previous pass.

## Test environment variables

None documented (no `.env.test`) — unchanged.

## Coverage gaps

Pure-function logic in dedup/mapping/reliability/date-utils: well covered (new
this pass). Everything else — server actions, cron idempotency logic, route
handlers, all UI components, the AI/DB integration layers, the admin surface —
**zero automated coverage**, only build-time typecheck + successful static
generation as an indirect signal.

## Critical untested flows

- Sign-in/sign-up (Clerk) — never exercised in a browser by an AI session.
- Any DB write path — never exercised against a real database by an AI session
  (though this environment now has a real `DATABASE_URL`, no writes were performed
  this pass).
- The AI summary path — no AI key configured in this environment; never exercised.
- Admin actions (`toggleFeatureFlag`, `updateAnnouncementBanner`, etc.) — no
  automated or manual test performed this pass.
- The 7 cron routes — never triggered (manually or via Vercel Cron) during any
  documentation pass; their idempotency-lock logic is unverified beyond reading
  the source.

## Known flaky tests

None — all 24 current tests are deterministic pure-function tests with no
network/timing dependency, and passed cleanly on this run.

## Pre-release checklist — status updated

The app **has already had its first real release and production deploy**
(`0a1de43`, `1d1eef9`, live at https://anibrief.vercel.app), so this checklist is
now a "before the next release" list rather than a pre-first-release one:

- [x] `npm run typecheck` passes (re-verified this pass).
- [x] `npm run lint` passes (re-verified this pass: 0 errors, 0 warnings).
- [x] `npm run build` succeeds (re-verified this pass: 52 routes).
- [x] `.env.example` exists and matches `CLAUDE.md`'s env var table (re-verified).
- [x] `vercel.json`'s cron targets all exist (re-verified: all 7 routes present).
- [x] Some minimum unit test coverage exists for the pure-function layers
      (re-verified: 24 tests, 5 files).
- [ ] The manual smoke-test checklist above has **not** been run against a real
      browser session by any AI session yet — still open.
- [ ] Server-action / cron-route automated test coverage — still zero, see
      "Missing test areas" above.
- [ ] Rate limiting / `zod` validation — still open, see `SECURITY.md`.
