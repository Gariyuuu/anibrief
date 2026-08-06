# HANDOFF.md — Start Here

> Snapshot: 2026-08-06 05:59:28 MST. Read the "Concurrent modification"
> note below before anything else — this repo may not be in the state
> you'd expect from a normal, quiet handoff.
>
> **UPDATE:** the concurrent activity did not stop after this snapshot
> was locked — by ~06:15 MST the repo had grown from ~90 to ~176 files
> and gained a home page, most nav routes, most cron routes, real
> tests, and a real `.env.example`. See `PROJECT_STATE.md`'s "ADDENDUM"
> section. **Your very first action should be re-verifying the current
> file count and state before trusting anything below about what
> is/isn't built.**

## What is this project?

**AniBrief** — a Next.js 16 app meant to be a daily briefing terminal
for anime, manga, Japanese music, voice-actor news, episode tracking,
and discovery, aggregating AniList, Jikan/MyAnimeList, Google News RSS,
and YouTube data, with optional AI-generated summaries (Anthropic or
OpenAI). Auth via Clerk, persistence via Neon Postgres + Drizzle ORM.

## What should I read first?

1. This file.
2. `CLAUDE.md` — full operating manual (stack, commands, conventions,
   env vars, "DO NOT CHANGE WITHOUT REVIEW," known issues).
3. `PROJECT_STATE.md` — exact snapshot, including the concurrent-
   modification episode.
4. `TASKS.md` — the current task queue.

## What is the current task?

As of this handoff, there is **no in-progress feature task** — the most
recent session was a documentation audit (this one), not feature work.
The highest-priority *next* tasks (not yet started) are `TASKS.md`'s
T-001 (fix 5 lint errors) and T-002 (build a home page so the
already-built briefing/component layer becomes reachable). See
`TASKS.md` for full detail on both, including exact files and
acceptance criteria.

## What was the previous agent doing?

This session's own work was purely documentation (writing these 17
files). Separately — and this is important — **the repository was
observed changing on its own, extensively, throughout this session**,
apparently from a different, unidentified process: a Clerk auth layer,
a full Neon/Drizzle database schema (18 tables), an AI summarization
layer, a UI component library, and several server actions all appeared
in the working tree between roughly 05:49 and 05:59 MST, without any
tool call from this documentation session causing them. See
`PROJECT_STATE.md`'s "Concurrent modification" section for the full,
honest account, including that this audit chose *not* to revert any of
it, on the theory that it looked like real, legitimate, in-progress
work. **If you're picking this up and don't recognize that work as your
own, investigate before assuming it's safe to build on top of it
un-reviewed.**

## What works right now?

- `npm run typecheck` — clean.
- `npm run build` — succeeded once (against an intermediate state).
- The theming system (light/dark + 7 accents) — fully wired and live on
  every route via the root layout, since it doesn't depend on any
  content page existing.
- The command palette (⌘K) — functional against `/api/search`, though
  its results link to detail pages that don't exist yet.
- A large amount of backend/component code (providers, DB schema, AI
  layer, server actions, home/anime/news components) — complete-looking
  and typechecks, but **unreachable by any route.**

## What is broken?

- `npm run lint` — 5 errors (`react-hooks/set-state-in-effect` in
  `EpisodeTimeline.tsx`, `AccentPicker.tsx`, `CommandPalette.tsx` ×2,
  `ThemeToggle.tsx`) + 3 unused-import warnings. See `TESTING.md`.
- No home page (`src/app/page.tsx` doesn't exist) and none of
  `src/lib/nav.ts`'s 15 declared routes have a `page.tsx` — the app is
  not visitable as a product yet, only Clerk's sign-in/up screens work.
- `vercel.json`'s 7 cron jobs target routes that don't exist.

## What should I do next?

1. Re-verify the repo hasn't changed further since this handoff (fresh
   `find src -type f` + `npm run typecheck && npm run lint`).
2. Fix the lint errors (`TASKS.md` T-001) — quick, mechanical, unblocks
   a clean gate.
3. Build the home page (`TASKS.md` T-002) — the highest-leverage next
   step, since almost everything it needs already exists.

## Which files are most important?

- `src/proxy.ts` + `src/app/layout.tsx` — the entire auth/shell
  backbone every route depends on.
- `src/lib/db/client.ts` + `src/lib/db/schema/*` — the persistence
  contract every server action depends on.
- `src/lib/nav.ts` — the single source of truth for the app's intended
  information architecture; cross-reference against actual `page.tsx`
  files to see what's missing.
- `src/lib/briefing/{buildBriefing,getTodaysBriefing}.ts` — the biggest
  ready-to-wire piece of unreached functionality.

## Which areas are dangerous to modify?

See `CLAUDE.md`'s "DO NOT CHANGE WITHOUT REVIEW" section in full.
Headline: `src/proxy.ts`/Clerk config (auth boundary), the Drizzle
schema (a migration has already been generated against it), `.env.local`
(never print its contents), `vercel.json`'s cron schedules (keep in
sync with whatever routes do/don't exist), the
`isDatabaseConfigured()`/`getAIProvider()` graceful-degradation
contracts.

## Which commands should I run first?

```bash
cd /Users/gariyuu/Projects/anibrief
npm run typecheck   # expect: clean
npm run lint         # expect (as of this handoff): 5 errors, 3 warnings
npm run test          # expect: 0 tests found
```
Do **not** run `npm run db:push` against any database, and be cautious
re-running `npm run build` given the concurrent-modification episode
observed this session (see `DEPLOYMENT.md`'s "Known build failures"
note) — if you do run it, take a file-timestamp inventory immediately
before and after so you can tell what, if anything, changed as a
result.

## How do I verify the app still works?

There is no "still works" baseline for a running app yet, since no page
renders anything a user could visit besides Clerk's sign-in/up screens.
The closest available verification is: `npm run typecheck` stays clean,
`npm run build` still succeeds, and (once you fix T-001) `npm run lint`
stays clean. Once a home page exists, use `TESTING.md`'s manual
smoke-test checklist.

---

## Prompt for the next Claude Code account

Copy-paste this verbatim to start a new session on this project:

```
Read CLAUDE.md, PROJECT_STATE.md, TASKS.md, and HANDOFF.md in this
repository (/Users/gariyuu/Projects/anibrief) in full before doing
anything else. This is AniBrief, a Next.js 16 daily-briefing app for
anime/manga/Japanese music/news, with Clerk auth and a Neon+Drizzle
database layer.

Important context before you start: this repo has no git history of
its own (see PROJECT_STATE.md), and the last documentation-audit
session observed the repository changing extensively on its own,
apparently from a separate concurrent process, throughout that entire
session. Do not assume the repo is in a quiet, settled state just
because no one told you otherwise.

After reading those files:
1. Take a fresh file inventory of src/ (there's no `git status` to lean
   on) and compare it against CLAUDE.md's "Repository structure" and
   PROJECT_STATE.md's snapshot — flag any difference you find, however
   small.
2. Re-run `npm run typecheck` and `npm run lint` and confirm they match
   what CLAUDE.md/TESTING.md/PROJECT_STATE.md report (typecheck clean;
   lint currently 5 errors + 3 warnings, all in files listed in
   TASKS.md T-001).
3. Read whichever of ARCHITECTURE.md / FEATURES.md / API_REFERENCE.md /
   DATABASE.md / SECURITY.md / UI_SYSTEM.md / DECISIONS.md is relevant
   to what you're about to do.
4. Summarize your understanding of the current state back to me in a
   few sentences before making any changes, and explicitly flag
   anything in the documentation that looks stale or contradicts what
   you find in the actual code.
5. Continue from TASKS.md's "Next up" section (T-001, then T-002) —
   do not redo the documentation audit itself, and do not assume any
   feature is unbuilt without checking FEATURES.md's status
   classification and the actual code first (a striking amount of this
   repo's backend/component layer already exists but is simply
   unreachable by any route).
6. Preserve the existing architecture (Clerk for auth, Neon+Drizzle for
   persistence, the provider-never-throws / server-action-throws
   pattern, the isDatabaseConfigured()/getAIProvider() graceful-
   degradation contracts) unless you find a strong, specific reason to
   change it — and if you do change something architectural, record it
   in DECISIONS.md.
7. After completing any meaningful work, update PROJECT_STATE.md,
   TASKS.md, and append to SESSION_LOG.md (append — never overwrite
   prior entries), plus whichever other documentation file(s) your
   change affects.
```
