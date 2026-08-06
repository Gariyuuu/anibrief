# PROJECT_STATE.md — Exact Handoff Snapshot

## ADDENDUM (2026-08-06, written ~06:15 MST, while finishing this
## documentation pass)

The rest of this file describes a snapshot locked at **05:59:28 MST**.
While the 17 documentation files were being written (05:59–06:15 MST),
the concurrent build process described below **continued and
accelerated dramatically**. A file-count check at ~06:15 MST found
**176 files** under `src/` + root config (vs. ~90 at the 05:59:28
snapshot) — roughly double. Observed additions include, at minimum:

- `src/app/page.tsx` (home page — finally exists) and `error.tsx`,
  `loading.tsx`, `not-found.tsx` (App Router boundaries).
- Real pages for nearly every `nav.ts` route: `airing/page.tsx`,
  `anime/page.tsx` + `anime/[id]/{page,characters,music,news,relations,
  staff,statistics}/page.tsx`, `manga/page.tsx` + `manga/[id]/{page,
  characters,news,relations}/page.tsx`, `music/page.tsx`,
  `news/page.tsx`, `seasonal/page.tsx`, `daily-brief/page.tsx` +
  `daily-brief/archive/{page,[date]/page}.tsx`, `admin/layout.tsx`.
- **All (or nearly all) of the previously-missing `/api/cron/*` routes**
  (`birthdays`, `daily-brief`, `refresh-airing`, `refresh-news`,
  `refresh-seasonal`, `trend-snapshot` observed; `notifications` not
  confirmed) plus `src/lib/cron/runCronJob.ts`.
- **Tests now exist**: `src/lib/dedup/__tests__/{clusterNews,
  textSimilarity}.test.ts`, `src/lib/providers/anilist/__tests__/
  mappers.test.ts`, `src/lib/providers/news/__tests__/reliability.test.ts`,
  `src/lib/utils/__tests__/{dates,season}.test.ts` — this directly
  contradicts this file's (and `TESTING.md`'s) "zero tests exist" claim
  as of the original snapshot.
- **`.env.example` now exists** — contradicts this file's and
  `CLAUDE.md`'s "no `.env.example` exists" claim as of the original
  snapshot.
- PWA additions: `public/sw.js`, `src/components/pwa/{OfflineBanner,
  ServiceWorkerRegister}.tsx`.
- Admin-adjacent code: `src/lib/actions/admin.ts`,
  `src/lib/admin/providerHealth.ts`, `src/lib/utils/adminAccess.ts`,
  `src/components/admin/DataSourceToggle.tsx` — suggesting the
  previously-schema-only admin surface may now be partially wired.
- New utils: `src/lib/utils/{birthdays,mediaId,season}.ts`.
- `src/lib/providers/anilist/index.ts` and `queries.ts` were modified
  again (not just added-to) — their documented shape in this audit's
  `FILE_MAP.md`/`API_REFERENCE.md` may already be incomplete (e.g. a
  new `getAnimeDetail.ts` file appeared alongside them).

**This was not investigated further or written up in full** — doing so
would mean re-running this entire audit against a target that, based on
the evidence of two consecutive large waves of change, may keep moving
indefinitely. The pragmatic call made here: leave the body of this
audit's 17 files as an accurate, clearly-timestamped record of the
**05:59:28 MST** state (still valuable as a structural/architectural
reference — the patterns described, e.g. the provider
graceful-degradation convention, the server-action `requireUser()`
convention, the DB schema, almost certainly still hold), while flagging
loudly, here and in `SESSION_LOG.md`, that **a fresh audit pass is
needed before this documentation should be treated as current** —
several specific claims (no tests, no `.env.example`, no home page, no
cron routes) are now very likely **false** as of ~06:15 MST and later.

**Recommended immediate next action for whoever reads this:** run
`find src -type f | wc -l` and compare against 176; if higher, the
build is still ongoing — consider whether it makes sense to wait for it
to genuinely finish before investing in another documentation pass, or
to check with the user about what process is producing this.

---

## Audit timestamp

Documentation audit performed **2026-08-06**, snapshot locked at
**05:59:28 MST**. See the "Concurrent modification" section below before
trusting any specific file count or line number — this snapshot was
taken mid-flight against a repository under active outside modification.

## Git state

- **`anibrief/` has no `.git` directory of its own.** It is a plain
  folder inside `/Users/gariyuu/Projects`, which is itself a git
  repository (`git rev-parse --is-inside-work-tree` → true from within
  `anibrief/`, resolving to the parent repo).
- That parent repo (`~/Projects`) is on branch `main` with **zero
  commits** (`git log` → "your current branch 'main' does not have any
  commits yet").
- `git status` from within `anibrief/` therefore reports the entire
  `anibrief/` directory as a single untracked entry, alongside every
  other sibling project folder in `~/Projects` (chamber-seven,
  buildstrike-arena, etc. — those are separate repos nested inside the
  same untracked listing from the parent's point of view; they have
  their own internal `.git` directories and real history, `anibrief`
  does not).
- **There is no way to diff, blame, or revert anything in this repo
  using git.** Every file is simply "current state" with no prior
  version to compare against.

## Concurrent modification (read this first)

During this audit session, starting immediately after `npm run build`
was run (~05:49 MST) and continuing until at least ~05:59 MST, a large
number of files were added/changed in this repository **without any
action by the auditing session** (no `Write`/`Edit` tool calls were made
by the audit until after this point-in-time snapshot was locked and
documentation-writing began). Observed additions, in rough chronological
order:

1. `package.json` gained `@clerk/nextjs`, `@neondatabase/serverless`,
   `drizzle-orm`, `drizzle-kit`; lost `@supabase/ssr`,
   `@supabase/supabase-js`.
2. `.env.local` appeared (6 Clerk env vars).
3. `src/proxy.ts`, `src/app/sign-in/[[...sign-in]]/page.tsx`,
   `src/app/sign-up/[[...sign-up]]/page.tsx` appeared (Clerk auth
   wiring).
4. A full Drizzle schema appeared under `src/lib/db/` (18 tables, 5
   files) plus `drizzle.config.ts` and a generated migration under
   `drizzle/`.
5. `src/app/layout.tsx` and a full `src/components/layout/*` set
   appeared (AppShell, nav, command palette, theme/accent pickers).
6. `src/app/api/search/route.ts` appeared.
7. `src/lib/ai/*` (Anthropic + OpenAI provider implementations) appeared.
8. `src/components/anime/*`, `src/components/news/*`,
   `src/components/ui/*` (8 primitives) appeared.
9. `src/lib/briefing/*` (buildBriefing, getTodaysBriefing, store)
   appeared.
10. `src/lib/actions/*` (5 Clerk-gated Drizzle server actions) and
    `src/components/actions/*` (2 client wrapper buttons) appeared.
11. `src/components/home/*` (HeroBrief, StatTile, EpisodeTimeline,
    TrendingList, BirthdayStrip) appeared.

The audit's working theory, formed by watching file-modification
timestamps advance in real time across roughly 10 minutes with no tool
call of its own in flight, is that **a separate process/agent was
actively building this app concurrently with the audit**. This was never
conclusively attributed (no OS-level process inspection was performed).
**No files were deleted or reverted by the audit** — the decision was
made to treat the observed content as legitimate in-progress work rather
than an accident to undo, given the instruction to never discard work
without explicit permission. Two background `Monitor` polling loops were
used to watch for the activity to settle; it never fully settled within
~10 minutes of observation, so the snapshot below was locked at
05:59:28 MST as a pragmatic cutoff. **Assume more has changed since.**

## Uncommitted / untracked files

Every file in the repository (there being no git history to compare
against). Full inventory as of the snapshot — see `FILE_MAP.md` for the
annotated version. Raw count: **~90 files** under `src/` + root config,
excluding `node_modules/` and `.next/`.

## Active objective

This session's objective (from the user): bring `anibrief/`'s
documentation up to the same standard as `chamber-seven` and
`buildstrike-arena` — 17 memory files (CLAUDE.md + 16 others), built
purely from inspecting this repo, no invented facts, no product
behavior changed. **No prior AI session's objective exists to resume** —
this is the first documentation audit of this repo, and (per the git
state above) there is no evidence of what the concurrent
process's objective was, either.

## Last completed task

None recorded prior to this session — this is the first `SESSION_LOG.md`
entry for this repository.

## Current unfinished task

**Documentation audit (this session).** By the time you read this, the
17 memory files listed in `CLAUDE.md`'s repository structure should all
exist in the repo root. If any are missing, the audit was interrupted —
check `SESSION_LOG.md`'s most recent entry for exactly how far it got.

Related files: all 17 root `.md` files.

## What has been attempted (this session)

1. Read the pre-existing `CLAUDE.md` (a one-line `@AGENTS.md` include)
   and `AGENTS.md` in full.
2. Inventoried the original repo (~37 files under `src/`) before any
   concurrent activity began.
3. Read every provider, type, util, theme, and branding file that
   existed at that point.
4. Ran `npm run typecheck` (clean) and `npm run lint` (clean) against
   the original ~37-file scaffold.
5. Ran `npm run test` (0 tests found — no test files exist).
6. Ran `npm run build` — succeeded, but was immediately followed by the
   concurrent-modification episode described above.
7. Observed and read the newly-appearing files as they landed (Clerk
   auth, Drizzle schema, AI providers, UI components, server actions,
   home-page components) rather than trying to stop or revert them.
8. Re-ran `npm run typecheck` (still clean) and `npm run lint` (now 5
   errors + 3 warnings, all in the newly-added files) against the final
   snapshot.
9. Locked a final file inventory at 05:59:28 MST and began writing the
   17 documentation files against that snapshot.

## What currently works (verified this audit)

- `npm run typecheck` passes with zero errors, both against the original
  scaffold and the final snapshot.
- `npm run build` completed successfully once (produced a working
  production build with 9 routes — mostly icon/manifest routes plus the
  2 Clerk auth pages).
- The provider layer's graceful-degradation pattern is real and
  consistent: every provider returns an empty/null value and logs
  rather than throwing when unconfigured.
- The Clerk auth wiring (`proxy.ts`, `ClerkProvider`, `SignedIn`/
  `SignedOut`) is internally consistent with itself, and the layout/
  AppShell that consumes it typechecks.

## What currently fails / is unverified

- **`npm run lint` fails** against the final snapshot: 5
  `react-hooks/set-state-in-effect` errors, 3 unused-import warnings.
  See `TESTING.md` for the exact list.
- **No page renders any of the built components.** There is no way to
  verify any user-facing flow (sign-in, browsing, adding to a list,
  viewing the daily brief) actually works end-to-end in a browser,
  because there is no home page or content route to load. `npm run dev`
  was never started (per the task's instruction not to start long-running
  dev servers).
- **The DB layer is entirely unverified against a real database** — no
  `DATABASE_URL` is configured, `db:push` was never run, so it's unknown
  whether the generated migration (`drizzle/0000_silly_captain_stacy.sql`)
  actually applies cleanly to a real Neon instance.
- **The AI layer is entirely unverified against real API keys** — no
  `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` configured, so it's unknown
  whether `AnthropicProvider`/`OpenAIProvider` actually produce a valid
  completion (the code shape is plausible but untested).
- **Whether `npm run build` has side effects is unresolved** — see the
  "Concurrent modification" section. It was not re-run after the final
  snapshot to avoid disturbing the tree further.

## Errors observed this session

```
/Users/gariyuu/Projects/anibrief/src/components/home/EpisodeTimeline.tsx
  20:5  error  react-hooks/set-state-in-effect

/Users/gariyuu/Projects/anibrief/src/components/layout/AccentPicker.tsx
  14:5  error  react-hooks/set-state-in-effect

/Users/gariyuu/Projects/anibrief/src/components/layout/CommandPalette.tsx
  5:8   warning  'Image' is defined but never used
  68:10 error    react-hooks/set-state-in-effect
  73:7  error    react-hooks/set-state-in-effect

/Users/gariyuu/Projects/anibrief/src/components/layout/ThemeToggle.tsx
  12:5  error  react-hooks/set-state-in-effect

/Users/gariyuu/Projects/anibrief/src/lib/db/schema/lists.ts
  1:44  warning  'primaryKey' is defined but never used

/Users/gariyuu/Projects/anibrief/src/lib/db/schema/profiles.ts
  1:19  warning  'integer' is defined but never used

✖ 8 problems (5 errors, 3 warnings)
```

## Blockers

- No `DATABASE_URL` → cannot verify the DB layer without provisioning a
  real (or disposable dev) Neon database, which is out of scope for a
  documentation-only audit.
- No AI API keys → cannot verify the AI summary layer.
- No home page → cannot smoke-test any user flow in a browser without
  first writing application code, which this audit was explicitly told
  not to do.
- No git history → no reliable way to know what changed *before* this
  session started, only what changed *during* it (via file timestamps).

## Assumptions currently in effect (not independently re-verified)

- That the concurrent file changes observed this session represent
  legitimate, intentional development (by the user or another agent
  instance) rather than a compromised dependency or malicious script —
  this was inferred from the content being coherent, well-commented, and
  stylistically consistent with the pre-existing code, not from any
  direct confirmation.
- That `.env.local`'s Clerk values are real/functional credentials for
  some Clerk application — never verified against Clerk's API, only
  observed as present by key name.
- That the `drizzle/0000_silly_captain_stacy.sql` migration accurately
  reflects the current schema files (it was generated once during the
  observed activity; if the schema changed again afterward without a
  re-generate, they could be out of sync).

## Next three recommended actions

1. **Re-run `git status`-equivalent (a full file-timestamp inventory)
   immediately**, before doing anything else, to check whether the
   concurrent activity observed during this audit continued after
   05:59:28 MST — this documentation may already be stale by the time
   it's read.
2. **Fix the 5 lint errors** (`react-hooks/set-state-in-effect` — move
   the synchronous `setState` calls out of the effect body per the
   React docs link in the lint output, or wrap in a ref-based pattern)
   and the 3 unused-import warnings. Low-risk, mechanical, high-value
   (unblocks a clean `lint` gate). See `TASKS.md` T-001.
3. **Build the home page** (`src/app/page.tsx`) wiring `HeroBrief`,
   `EpisodeTimeline`, `TrendingList`, and `BirthdayStrip` to
   `getTodaysBriefing()` / `AniListProvider` — this is the single
   highest-leverage next step, since the supporting components and data
   layer already exist but are unreachable by any route. See `TASKS.md`
   T-002.

## Verification required before continuing

Before trusting this document for a new task: re-run
`npm run typecheck && npm run lint`, take a fresh `find` inventory of
`src/` and compare it against the "Repository structure" list in
`CLAUDE.md`, and check whether `src/app/page.tsx` now exists (if it
does, much of `FEATURES.md`'s "not reachable by any route" framing is
stale and needs updating).
