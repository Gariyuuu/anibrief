# TASKS.md — Active Execution Queue

> **2026-08-07 checkpoint (resolves the note directly below):** `main` is now at
> `d69e067` ("Add self-hosted goat-ai-platform as a 3rd AI provider option"),
> matching `origin/main`, working tree clean (verified via `git status`/`git log
> --oneline -5`/`git fetch origin` this pass). **T-109's code was committed** —
> `git show d69e067 --stat` includes exactly `src/lib/ai/goat-ai.ts`,
> `src/lib/ai/index.ts`, `src/lib/ai/types.ts` plus this file's/`PROJECT_STATE.md`'s/
> `SESSION_LOG.md`'s/`CLAUDE.md`'s/`.env.example`'s/`ENVIRONMENT_VARIABLES.md`'s/
> `CHANGELOG.md`'s own then-in-progress edits, swept in together — the same
> concurrent-landing pattern documented repeatedly below. T-109's "Not committed"
> line immediately below is now **stale**; treat it as "Committed as of `d69e067`."
> `AI_PROVIDER` still defaults to `"anthropic"` and no production env var changed, so
> `goat-ai` is still inert unless explicitly configured. Full re-verification this
> pass: `typecheck`/`lint`/`test` (24/24)/`build` (52 routes) all pass clean. No
> secrets found in tracked files.

> **2026-08-06 update:** `main` is at `a0696ef` as of this note (five commits ahead
> of the `91b23c4` this file's body below still describes — run `git log --oneline
> -5` before trusting any "current commit" reference below). This session's own
> work — see T-109 — is real code, not a documentation-only pass, and is
> **uncommitted** as of this note (not committed/pushed/deployed per explicit task
> instructions).

### T-109 — Add `goat-ai` as a third, opt-in AI provider

- **Description:** Added `GoatAIProvider` (`src/lib/ai/goat-ai.ts`), implementing
  the existing `AIProvider` interface, backed by a self-hosted OpenAI-compatible
  platform (official `openai` npm package, custom `baseURL`). Selectable via
  `AI_PROVIDER=goat-ai` + `AI_PLATFORM_API_KEY` (+ optional `AI_PLATFORM_BASE_URL`).
  The `anthropic`/`openai` providers and the null/template fallback are unchanged;
  `AI_PROVIDER` still defaults to `"anthropic"` — nothing activates this
  automatically.
- **Status:** Complete (code + verification). **Committed** as of `d69e067` (see the
  2026-08-07 checkpoint note at the top of this file) — the original "Not committed"
  line below is stale, kept for the historical record.
- **Priority:** N/A (explicit user request, out-of-band from the "Next up" gap list
  below).
- **Relevant files:** `src/lib/ai/types.ts`, `src/lib/ai/goat-ai.ts` (new),
  `src/lib/ai/index.ts`, `.env.example`, `CLAUDE.md`, `ENVIRONMENT_VARIABLES.md`,
  `CHANGELOG.md`.
- **Dependencies:** none — `openai` was already a `package.json` dependency
  (`^6.48.0`, added for `OpenAIProvider`).
- **Acceptance criteria:** `AIProvider.name` union widened to include `"goat-ai"`;
  new provider matches `AnthropicProvider`'s `complete()` signature and return shape;
  `getAIProvider()` gains one additional `else if` branch, existing branches and the
  null fallback untouched; `typecheck`/`lint`/`test`/`build` all pass; provider
  functionally tested against the real platform with real credentials.
- **Validation steps:** `npm run typecheck && npm run lint && npm run test && npm
  run build` — all pass (24/24 tests). Direct-import functional test (outside
  Next.js, via `node --experimental-strip-types --conditions=react-server` +
  this repo's existing `@/` alias loader) against the real self-hosted platform:
  real completion returned; `getAIProvider()` correctly selects `goat-ai` when both
  env vars are set and correctly falls back to `null` otherwise (3 scenarios).
- **Blockers:** none.
- **Deliberately not done:** did not start `npm run dev` / load an actual page —
  the direct-import test above already exercises the real network call and the
  fallback logic; standing up the dev server with a real key in-process wasn't
  judged to add meaningful additional confidence for this task's scope. Did not
  set `AI_PROVIDER=goat-ai` in any real env file — the task explicitly reserves
  that decision for the user.

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

### T-108 — Build the actual Spotify provider + UI on top of the new schema
- **Description:** Commit `d296f93` (landed live during this documentation pass,
  after an earlier uncommitted-work sighting — see `PROJECT_STATE.md`'s SECOND
  ADDENDUM) added `src/lib/db/schema/spotify.ts`'s `userSpotifyConnections` table
  and pushed it to the live database. No `src/lib/providers/spotify/` provider, no
  OAuth flow, no UI consumer exists yet — this is schema-only, same stage
  `MyAnimeListProvider` has been at since the initial release.
- **Status:** Schema committed and live; provider/OAuth/UI not started.
- **Priority:** Not this pass's to set — flagging only, since it wasn't started or
  scoped by this documentation session.
- **Relevant files:** `src/lib/db/schema/spotify.ts`, `drizzle/0001_*`.
- **Blockers:** needs a registered Spotify OAuth app (client id/secret), not
  present in this local environment's `.env.local` (re-verify before assuming).
- **Note:** whoever picks this up next should run `git log`/`git status` first —
  this repo has shipped 4 commits in roughly 20 minutes today; it may have moved
  further by the time you read this.

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

- **This session (2026-08-06, real code):** T-109 — added `goat-ai` as a third,
  opt-in AI provider. See `SESSION_LOG.md`'s newest entry.
- **Earlier session:** documentation re-sync (T-005) — see `SESSION_LOG.md`.
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
