# TASKS.md — Active Execution Queue

> Re-synced 2026-08-06 ~15:35 MST against the actual current git state (`main`,
> now at commit `91b23c4` — a third commit that landed live during this very
> re-sync pass, see `SESSION_LOG.md`). The previous version of this file was
> written against a stale, mid-flight snapshot from earlier the same day — every
> task below (T-001 through T-004 in the old version) has since been completed by
> the work that landed in commits `0a1de43`/`1d1eef9`/`91b23c4`. See "Recently
> completed" and `SESSION_LOG.md` for the full account.

## Current task

**T-005 — Documentation re-sync (this session).**
- **Description:** Bring the 17-file documentation system back in sync with the
  actual, now-committed code — the previous pass locked a snapshot before the
  concurrent build it was watching had finished and been committed.
- **Status:** Complete (this session).
- **Priority:** High (explicit user request).
- **Relevant files:** all 17 root `.md` files, `.env.example`.
- **Dependencies:** none.
- **Acceptance criteria:** every doc file matches verified current code (not the
  stale snapshot); `PROJECT_STATE.md`/`TASKS.md`/`HANDOFF.md`/`CLAUDE.md` describe
  the current task identically; no secrets in any doc file; no application code
  changed.
- **Validation steps:** re-ran `npm run typecheck && npm run lint && npm run test &&
  npm run build`; grepped all `.md` files for secret-shaped strings; confirmed
  `git status` stayed clean throughout (only `.md` files touched).
- **Blockers:** none.

## Next up

No open feature-development tasks exist in the repo (no prior `TASKS.md` entry, no
in-code `TODO`/`FIXME` backlog beyond what's listed below). The items below are gaps
identified by direct code inspection during this documentation pass, not a resumed
task list — treat each as a fresh candidate to prioritize, not a stale carryover.

### T-101 — Add `zod` runtime validation to server actions and `/api/search`
- **Description:** `zod` has been an installed, zero-usage dependency since the
  initial release. Every server action (`src/lib/actions/*.ts`) and `/api/search`
  trust their input's TypeScript type with no runtime check.
- **Status:** Not started.
- **Priority:** High (longest-standing, most-flagged gap — see `SECURITY.md`,
  `DECISIONS.md` DEC-009, `CLAUDE.md`).
- **Relevant files:** every file under `src/lib/actions/`, `src/app/api/search/route.ts`.
- **Dependencies:** none.
- **Acceptance criteria:** each action validates its input shape at the top of the
  function body before touching the DB; `/api/search` validates/clamps `q`.
- **Blockers:** none.

### T-102 — Add rate limiting to public-facing routes
- **Description:** No rate limiting exists anywhere — not `/api/search`, not
  `/api/calendar/ics`, not any server action. Low risk today at this traffic level,
  but worth closing before it matters.
- **Status:** Not started.
- **Priority:** Medium.
- **Relevant files:** `src/app/api/search/route.ts`, `src/app/api/calendar/ics/route.ts`,
  `src/proxy.ts` (a middleware-level limiter would cover the most surface at once).
- **Dependencies:** none technical; a decision on in-memory vs. edge/KV-backed
  limiting given the serverless deploy target.
- **Blockers:** none.

### T-103 — Decide on the caller-supplied-`userId` read functions
- **Description:** `getUserAnimeList`, `getUserMangaList`, `getUserFollows`,
  `getUserAlerts`, `getUserNotifications`, `getOrCreateProfile` all take a raw
  `userId` param instead of deriving it from `auth()` internally. Every current
  caller passes their own session's id correctly, so there's no active bug — but
  it's been flagged across two documentation passes without a decision.
- **Status:** Not started.
- **Priority:** Medium (defense-in-depth, not an active exploit).
- **Relevant files:** `src/lib/actions/{animeList,mangaList,follows,alerts,
  calendarReminders,profile}.ts`.
- **Dependencies:** none.
- **Acceptance criteria:** either each function internally asserts
  `(await auth()).userId === userId`, or a comment/decision in `DECISIONS.md`
  explicitly records why that's intentionally left to callers.
- **Blockers:** none.

### T-104 — Wire `JikanProvider.getRankingByMalId` into a real ranking display
- **Description:** `JikanProvider` now has exactly one caller — the admin
  provider-health check, which only reads `.configured`. Its actual data method
  (`getRankingByMalId`) still has zero consumers.
- **Status:** Not started.
- **Priority:** Low.
- **Relevant files:** `src/lib/providers/jikan/index.ts`, likely
  `src/app/anime/[id]/statistics/page.tsx` or similar.
- **Dependencies:** none.
- **Blockers:** none — purely a "hasn't been prioritized yet" gap.

### T-105 — Fix `package.json`'s version field
- **Description:** `"version": "0.1.0"` in `package.json` doesn't match `0.1.1` in
  `CHANGELOG.md` and both commit messages.
- **Status:** Not started.
- **Priority:** Low (cosmetic, but a real, confirmed inconsistency).
- **Relevant files:** `package.json`.
- **Dependencies:** none.
- **Blockers:** none — this is an application-file edit, intentionally **not** made
  by this documentation-only re-sync pass.

### T-108 — Finish (or evaluate) the in-progress, uncommitted Spotify integration
- **Description:** Near the end of this documentation pass, uncommitted changes
  appeared in the working tree: `src/lib/db/schema/spotify.ts` (a
  `userSpotifyConnections` OAuth-token table), a generated-but-unapplied migration
  (`drizzle/0001_brief_spencer_smythe.sql`), one new export in
  `src/lib/db/schema/index.ts`, and a small unrelated `AppShell.tsx` sidebar change
  (a "What's New" link). No provider file, no UI, no `package.json` dependency
  exists yet for Spotify — this is very early, schema-first work, not attributable
  to this documentation pass (which only edits `.md` files). See
  `PROJECT_STATE.md`'s ADDENDUM.
- **Status:** In progress (not by this session), uncommitted as of this pass's end.
- **Priority:** Not this pass's to set — flagging only.
- **Relevant files:** `src/lib/db/schema/spotify.ts`, `drizzle/0001_*`,
  `src/lib/db/schema/index.ts`, `src/components/layout/AppShell.tsx`.
- **Blockers:** none noted; simply incomplete as of this pass's end.
- **Note:** whoever picks this up next should run `git status`/`git diff` first —
  this may already be finished, committed, or further along by the time you read
  this.

### T-107 — Add a CSP/security-header regression check
- **Description:** The just-fixed sign-up CAPTCHA bug (commit `91b23c4`) shipped
  because nothing automated verifies the CSP in `next.config.ts` actually
  allowlists every host the app's own third-party scripts load from
  (`challenges.cloudflare.com` was missing). A manual visual check or a simple
  test that renders the sign-up page and asserts no CSP violation is logged would
  have caught this before it reached production.
- **Status:** Not started.
- **Priority:** Medium.
- **Relevant files:** `next.config.ts`, a new test or manual-checklist item.
- **Dependencies:** none.
- **Blockers:** none.

### T-106 — Real Spotify/MusicBrainz or MAL OAuth integration
- **Description:** `MusicProvider` is honest mock data (4 curated songs);
  `MyAnimeListProvider` is an honest, unconditional stub. Both degrade cleanly and
  are documented as such — this is future scope, not a bug.
- **Status:** Planned.
- **Priority:** Low.
- **Blockers:** needs a registered MAL OAuth client / a music metadata API key,
  neither of which exists in this environment.

## Blocked

None.

## High priority

- T-101 (zod validation)

## Medium priority

- T-102 (rate limiting)
- T-103 (userId ownership checks)
- T-107 (CSP/security-header regression check)

## Low priority

- T-104 (Jikan ranking UI)
- T-105 (package.json version bump)
- T-106 (real Music/MAL integrations)
- Add a CI workflow (`.github/workflows/`) running
  `typecheck && lint && test && build` on push — none exists today.

## Bugs

None currently known. The three real bugs found in production this project's life
(admin auth bypass, Daily Brief RSC crash — both commit `1d1eef9`; sign-up CAPTCHA
blocked by an incomplete CSP — commit `91b23c4`, which landed live during this very
documentation pass) are all fixed, re-verified by reading the current
`src/proxy.ts`/`DailyBriefView.tsx`/`next.config.ts` directly, not just trusting
the commit messages.

## Technical debt

- **`zod` and `resend` installed, unused** — see T-101 and `CLAUDE.md`'s "Known
  issues."
- **DB schema and TS types are independently maintained** (Drizzle `text()` enums vs.
  `src/lib/types/*`'s TS unions) — see `DECISIONS.md` DEC-008.
- **`src/lib/providers/types.ts`'s `ProviderResult`/`ok`/`fail` pattern is defined but
  still unadopted** — every provider does its own inline try/catch instead
  (re-verified this pass).
- **`supabase/migrations/` is still an empty leftover directory** from the abandoned
  earlier Supabase plan.
- **`package.json`'s version field is stale** — see T-105.

## Testing needed

- No E2E/browser-level smoke test has ever been run against a live `npm run dev` or
  the production deployment by an AI session (see `TESTING.md`'s manual checklist —
  still unexecuted).
- Server actions (`src/lib/actions/*.ts`) still have zero automated test coverage —
  the 24 existing tests all cover pure-function utilities/providers, not the
  DB-writing action layer.

## Documentation needed

None outstanding beyond this pass's own deliverables.

## Recently completed

- **This session:** documentation re-sync (T-005) — see `SESSION_LOG.md`.
- **Commit `91b23c4`** (landed live during this documentation session, authored by
  a separate process — see `SESSION_LOG.md`): fixed a CSP gap that silently broke
  sign-up's Cloudflare Turnstile CAPTCHA for every visitor.
- **Commit `1d1eef9`:** admin auth-bypass fix, Daily Brief RSC-crash fix,
  Hobby-plan-compatible cron schedule, Neon provisioning + schema push, Vercel
  deploy.
- **Commit `0a1de43`:** the entire initial build — every route in `nav.ts`, all 7
  cron routes, the full Drizzle schema + server actions, Clerk auth, the AI
  summary layer, the component library, real tests, `.env.example`, PWA support.
  (This is what the *previous* documentation pass's T-001/T-002/T-003/T-004 were
  asking for — all done as part of this commit, which is why those task IDs are
  retired rather than carried forward.)

## Deferred

- Real end-to-end verification against production credentials/traffic — deferred to
  whoever next has permission and reason to exercise the live deployment directly.

## Rejected ideas

None recorded — no evidence in the repo of any idea being explicitly considered and
rejected.
