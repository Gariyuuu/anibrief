# HANDOFF.md — Start Here

> **Final-transfer checkpoint (2026-08-07):** re-verified from a cold read (no prior
> conversation history). `main` HEAD is `d69e067`, matching `origin/main`, working
> tree clean — 4 commits past the `d296f93` this file's body below treats as
> "latest": `65c44e9` (0.2.0 — real Spotify sync, live music charts, full People &
> Characters directory), `c526d86` (0.2.1 — Spotify playlist-search bugfix),
> `a0696ef` (docs refresh), `d69e067` (goat-ai third AI provider, opt-in, not
> activated by default). `npm run typecheck`/`lint` clean, `npm run test` 24/24,
> `npm run build` succeeds at **52 routes** (was 44 in older sections of this file —
> corrected). No secrets found in any tracked file (`.env.example` placeholder-only,
> `.env.local` gitignored and never committed). The "Prompt for the next Claude Code
> account" section at the bottom of this file has been refreshed to match this
> state — use that one, not any commit hashes cited in the body above it.

> Re-synced 2026-08-06 ~15:35 MST. The previous version of this file described a
> pre-commit, mid-flight snapshot ("no reachable pages," "concurrent modification
> in progress") that is now stale — that work has since been committed
> (`0a1de43`, `1d1eef9`) and the app is deployed. **A third commit, `91b23c4`,
> landed and was pushed to `origin/main` during this very re-sync pass** — direct,
> live proof that this repo's concurrent-development pattern (documented at length
> in the prior stale-snapshot episode) can recur. This version reflects the actual
> current, git-verified state as of `91b23c4`.

## Read this first: the repo may already have moved again

During the documentation pass that produced this version of `HANDOFF.md`, **four
commits landed on `main` in roughly 20 minutes**, two of them (`91b23c4`,
`d296f93`) live, mid-pass, from a separate process — each sweeping up this
session's then-unsaved documentation edits into itself along with its own real
application changes (a CSP/CAPTCHA fix, then a Spotify OAuth schema + a sidebar
nav link). **The actual latest commit is `d296f93`** — treat any "latest commit"
claim elsewhere in this file that says `91b23c4` as one step behind. See
`PROJECT_STATE.md`'s SECOND ADDENDUM and `SESSION_LOG.md`'s addenda for the full,
honest account. **Run `git status` and `git log --oneline -5` before trusting
anything below** — this repo has now demonstrated "changes without warning
mid-session" four times today.

## What is this project?

**AniBrief** — a Next.js 16 app, a daily briefing terminal for anime, manga,
Japanese music, voice-actor news, episode tracking, and discovery, aggregating
AniList, Jikan/MyAnimeList, Google News RSS, and YouTube data, with optional
AI-generated summaries (Anthropic or OpenAI). Auth via Clerk, persistence via Neon
Postgres + Drizzle ORM. **Live at https://anibrief.vercel.app.**

## What should I read first?

1. This file.
2. `CLAUDE.md` — full operating manual (stack, commands, conventions, env vars,
   "DO NOT CHANGE WITHOUT REVIEW," known issues).
3. `PROJECT_STATE.md` — exact current snapshot (git state, what works, what's next).
4. `TASKS.md` — the current task queue.

## What is the current task?

**No task is in progress.** The most recent commit (`91b23c4`) fixed a sign-up
CAPTCHA bug (an incomplete CSP), landing live during this documentation session
from a separate process; before that, commit `1d1eef9` was a production
bug-fix + deploy. The most recent session before this handoff was a documentation
re-sync (this one), not feature work. `TASKS.md`'s "Next up" section lists real gaps
found by code inspection (T-101 `zod` validation, T-102 rate limiting, T-103
`userId`-ownership checks, T-107 CSP regression coverage) as candidates, but none
are started or assigned priority beyond what's recorded there — pick based on what
the next objective actually needs.

## What was the previous agent doing?

Two things happened, in order:
1. **A large concurrent build** (observed live by an earlier documentation-audit
   session, never attributed to a specific agent/process) added the entire app:
   every route, the DB schema, server actions, the AI layer, the component library,
   real tests, `.env.example`, PWA support — committed as `0a1de43` "Initial release:
   AniBrief v0.1.1".
2. **A follow-up session** found and fixed two real production bugs (an admin-page
   auth bypass and a Daily Brief crash), retuned the cron schedule for Vercel's
   Hobby plan, provisioned Neon, and deployed — committed as `1d1eef9`.
3. **This session** re-verified all 17 documentation files against that actual
   committed state (the prior documentation pass had locked its snapshot before
   step 1 finished landing, so it described an app with "no home page," "no tests,"
   "no cron routes" — all now false). No application code was changed by this
   session.
4. **A separate process, running concurrently with this very session**, found and
   fixed a real sign-up bug (Clerk's CAPTCHA silently failing because the CSP
   didn't allowlist Cloudflare Turnstile) — committed and pushed as `91b23c4`,
   landing partway through this session's own work. That commit's diff shows it
   also picked up this session's then-not-yet-git-saved edits to `CLAUDE.md`,
   `PROJECT_STATE.md`, and `TASKS.md` (which were sitting in the working tree,
   unstaged, when the other process committed) — this session never ran
   `git commit`/`git push` itself. This is a live repeat of the exact
   concurrent-development pattern the original stale-snapshot episode documented.

## What works right now?

- `npm run typecheck` — clean.
- `npm run lint` — clean, 0 errors, 0 warnings.
- `npm run test` — 24/24 pass.
- `npm run build` — succeeds, 52 routes.
- **Every route declared in `src/lib/nav.ts` (15 items) has a real page** — home,
  daily brief (+ archive), news, airing, seasonal, anime/manga (+ detail tab
  routes), music, people, calendar, discover, my-list, alerts, profile, settings
  (+ import).
- All 7 `/api/cron/*` routes are real and idempotency-locked via `sync_jobs`.
- The admin dashboard (`/admin`) is real: gated in both `proxy.ts` (middleware) and
  `layout.tsx`, with live provider-health checks, feature-flag toggles, an
  announcement-banner editor, a test-notification button, and an audit log.
- Follows, Profile, and Settings have real UI now (previously backend-only).
- News deduplication (`clusterNews`) is wired into `/news`.
- Deployed and live at https://anibrief.vercel.app, with Clerk + a real,
  schema-pushed Neon database.
- Locally, `.env.local` has Clerk + `DATABASE_URL` configured (confirmed by variable
  name only) — no AI key, no `YOUTUBE_API_KEY`, no `ADMIN_USER_IDS`, no `CRON_SECRET`
  set in this environment specifically.

## What is broken?

Nothing currently known. Both real bugs found in this project's life (admin auth
bypass, Daily Brief RSC crash) are fixed and re-verified this pass by reading the
actual current source, not just trusting the commit message.

## What should I do next?

Depends entirely on the next objective — there's no forced next step. If you need a
starting point, `TASKS.md`'s "Next up" section (T-101 `zod` validation, T-102 rate
limiting, T-103 `userId`-ownership decision) are the most-flagged, longest-standing
gaps, but none is urgent or blocking.

## Which files are most important?

- `src/proxy.ts` — the entire auth/admin-gate backbone.
- `src/lib/db/client.ts` + `src/lib/db/schema/*` — the persistence contract; the
  schema has been pushed to a real, live database, so treat changes as needing a
  real migration path, not a green-field `db:push`.
- `src/lib/nav.ts` — the app's information architecture; every route now resolves.
- `src/lib/cron/runCronJob.ts` — the shared pattern every `/api/cron/*` route uses.
- `src/components/briefing/DailyBriefView.tsx` / `BriefModeToggle.tsx` — the exact
  shape that crashed production once (a function prop crossing the RSC boundary);
  don't reintroduce that pattern without checking `1d1eef9`'s diff first.

## Which areas are dangerous to modify?

See `CLAUDE.md`'s "DO NOT CHANGE WITHOUT REVIEW" section in full. Headline:
`src/proxy.ts` (auth boundary + admin gate), the Drizzle schema (pushed to a real
live database now), `.env.local` (never print its contents — it now contains a real
`DATABASE_URL`), `vercel.json`'s cron schedules (Hobby-plan-compatible, deliberately
tuned), the `isDatabaseConfigured()`/`getAIProvider()` graceful-degradation
contracts, and the `DailyBriefView`/`BriefModeToggle` server/client prop boundary.

## Which commands should I run first?

```bash
cd /Users/gariyuu/Projects/anibrief
git log --oneline -5     # confirm you're looking at the commits this file describes
                          # (expect 91b23c4 latest; if there's a newer commit you
                          # don't recognize, this repo has a track record of real
                          # concurrent development landing without warning — don't
                          # assume it's an accident, investigate before reverting)
git status                # expect: clean, unless you're resuming mid-documentation-edit
npm run typecheck          # expect: clean
npm run lint                 # expect: 0 errors, 0 warnings
npm run test                  # expect: 24 pass, 0 fail
npm run build                  # expect: succeeds, ~52 routes
```
Do **not** run `npm run db:push` against any database without explicit permission —
`DATABASE_URL` in this environment points at a real, schema-pushed Neon database, not
a disposable scratch one.

## How do I verify the app still works?

`npm run typecheck && npm run lint && npm run test && npm run build` all passing is
the baseline this handoff verified. Beyond that, a real browser smoke test
(`npm run dev`, or visiting https://anibrief.vercel.app) has **not** been run by any
AI session yet — see `TESTING.md`'s manual checklist for what that would cover
(sign-in, add-to-list, daily brief rendering, admin gating, etc.).

---

## Prompt for the next Claude Code account

Copy-paste this verbatim to start a new session on this project:

```
Read CLAUDE.md, PROJECT_STATE.md, TASKS.md, and HANDOFF.md in this repository
(/Users/gariyuu/Projects/anibrief) in full before doing anything else. This is
AniBrief, a Next.js 16 daily-briefing app for anime/manga/Japanese music/news, with
Clerk auth and a Neon+Drizzle database layer. It is deployed and live at
https://anibrief.vercel.app.

State as of the last verified checkpoint (2026-08-07): `main` HEAD is `d69e067`
("Add self-hosted goat-ai-platform as a 3rd AI provider option"), matching
`origin/main`, working tree clean. Real shipped features as of that commit: full
daily-briefing/news/episode-tracking core; Clerk auth; Neon+Drizzle persistence;
admin dashboard; a real Spotify integration (OAuth connect + Client-Credentials
search, save-to-playlist) alongside YouTube and hand-curated-mock music feeds; a
full paginated staff+characters People/Characters directory; three AI providers for
the daily-brief summary (`anthropic` default, `openai`, `goat-ai` — all optional,
template-fallback if none configured). `npm run typecheck`/`lint` clean, `npm run
test` 24/24 pass, `npm run build` succeeds at 52 routes — re-run all four yourself,
don't trust this number without verifying.

Important context before you start: this repo has a real, demonstrated history of
documentation drifting behind fast-shipped code — most recently, `FEATURES.md`'s
"People directory" and "Music" sections were found stale during the 2026-08-07
checkpoint (still described pre-0.2.0 mock-only state) *despite* an earlier commit
(`a0696ef`) claiming in its own message to have refreshed "Spotify, People/
Characters" docs — it had only touched README/ARCHITECTURE/DATABASE/DATA_SOURCES/
DEPLOYMENT, not FEATURES.md. Lesson: a commit message claiming a docs refresh is not
proof every doc file was actually touched — check `git show <commit> --stat` before
trusting a docs-refresh claim. This repo's earlier history (see PROJECT_STATE.md's
first three addendums, SESSION_LOG.md) also documents several real instances of
concurrent development landing mid-documentation-pass — if you find a commit you
don't recognize, investigate before assuming it's safe to build on or reverting it.

After reading those files:
1. Run `git log --oneline -10` and `git status` — confirm the repo matches what
   PROJECT_STATE.md's newest addendum describes (branch, latest commit, clean/dirty
   tree). Flag any difference immediately.
2. Re-run `npm run typecheck && npm run lint && npm run test && npm run build` and
   confirm they match what CLAUDE.md/TESTING.md/PROJECT_STATE.md report — don't just
   cite the numbers above, verify them yourself.
3. Read whichever of ARCHITECTURE.md / FEATURES.md / API_REFERENCE.md / DATABASE.md /
   SECURITY.md / UI_SYSTEM.md / DECISIONS.md is relevant to what you're about to do,
   and cross-check its claims against the actual current source for anything you're
   about to touch or rely on — don't assume a status label is still accurate.
4. Summarize your understanding of the current state back to me in a few sentences
   before making any changes, and explicitly flag anything in the documentation that
   looks stale or contradicts what you find in the actual code.
5. Continue from TASKS.md's "Next up" section (as of this checkpoint: T-101 `zod`
   runtime validation, T-102 rate limiting, T-103 the caller-supplied-`userId`
   ownership-check decision — none urgent, none started), or from whatever the user
   actually asks for.
6. Preserve the existing architecture (Clerk for auth, Neon+Drizzle for persistence,
   the provider-never-throws / server-action-throws pattern, the
   isDatabaseConfigured()/getAIProvider() graceful-degradation contracts, the
   runCronJob() idempotency-lock pattern) unless you find a strong, specific reason
   to change it — and if you do change something architectural, record it in
   DECISIONS.md.
7. Remember `DATABASE_URL` in this environment points at a real, schema-pushed Neon
   database (not a disposable scratch one) — never run `db:push`/destructive
   operations against it without explicit permission. Never print, log, or copy
   `.env.local`'s actual values into any output.
8. After completing any meaningful work, update PROJECT_STATE.md, TASKS.md, and
   append to SESSION_LOG.md (append — never overwrite prior entries), plus whichever
   other documentation file(s) your change affects — and actually verify each file
   you touch or cite against the real code, the same discipline this checkpoint used.
```
