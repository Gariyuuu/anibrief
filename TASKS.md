# TASKS.md — Active Execution Queue

> Snapshot: 2026-08-06 05:59:28 MST. **See `PROJECT_STATE.md`'s
> "ADDENDUM" section: by ~06:15 MST the repo had grown from ~90 to
> ~176 files, apparently gaining a home page, most nav routes, most
> cron routes, and real tests. T-001, T-002, and T-003 below may
> already be done — verify against the actual code before starting any
> of them.**

## Current task

**T-000 — Documentation audit (this session).**
- **Description:** Bring `anibrief/` up to the same 17-file
  documentation standard as `chamber-seven`/`buildstrike-arena`, built
  purely from inspecting this repo, no product behavior changed.
- **Status:** In progress → nearing completion (writing the final files
  now).
- **Priority:** High (explicit user request).
- **Relevant files:** all 17 root `.md` files.
- **Dependencies:** none.
- **Acceptance criteria:** all 17 files exist, are internally
  consistent with each other and with the actual repo content, contain
  no fabricated facts and no real secret values, and the report back to
  the user covers every required item (file list, branch/tree state,
  current task, feature statuses, unknowns, secret-leak confirmation,
  readiness score, yes/no standard-match verdict).
- **Validation steps:** re-read each file once written; grep all 17
  files for anything that looks like a real secret value; confirm
  `PROJECT_STATE.md`/`TASKS.md`/`HANDOFF.md` describe the current task
  identically.
- **Blockers:** none remaining — the earlier blocker (repository under
  active concurrent modification, making "current state" a moving
  target) was resolved by locking a snapshot timestamp
  (05:59:28 MST) and documenting the volatility explicitly rather than
  waiting indefinitely for it to stop.
- **Notes for a cold resume:** if you're picking this up mid-way, check
  which of the 17 files exist yet (`ls *.md` in the repo root) — write
  whichever are missing using the same voice/structure as the ones that
  already exist, and don't re-do the repo inspection from scratch, reuse
  the facts already recorded in the files that do exist.

## Next up

### T-001 — Fix the 5 ESLint errors + 3 warnings
- **Description:** `npm run lint` currently fails. All 8 problems are in
  files added during this session's observed concurrent build, not in
  the original hand-written scaffold.
- **Status:** Not started.
- **Priority:** High (blocks a clean CI gate; mechanical fix).
- **Relevant files:** `src/components/home/EpisodeTimeline.tsx:20`,
  `src/components/layout/AccentPicker.tsx:14`,
  `src/components/layout/CommandPalette.tsx:5,68,73`,
  `src/components/layout/ThemeToggle.tsx:12`,
  `src/lib/db/schema/lists.ts:1`, `src/lib/db/schema/profiles.ts:1`.
- **Dependencies:** none.
- **Acceptance criteria:** `npm run lint` exits 0.
- **Validation steps:** run `npm run lint` after each fix; run
  `npm run typecheck` too, to make sure the fix (e.g. moving state sync
  out of `useEffect`) doesn't introduce a type error.
- **Blockers:** none.
- **Notes:** the 5 errors are all the same rule
  (`react-hooks/set-state-in-effect`) with the same shape: a `useEffect`
  that calls `setState` synchronously to read a DOM/`localStorage`
  value on mount. The lint message links to
  https://react.dev/learn/you-might-not-need-an-effect for the
  recommended pattern (e.g. lazy `useState` initializer reading from
  `document`/`localStorage` directly, guarded for SSR). The 3 warnings
  are simple unused-import removals.

### T-002 — Build the home page (`src/app/page.tsx`)
- **Description:** Wire `getTodaysBriefing()` (already implemented) to
  `HeroBrief`, `EpisodeTimeline`, `TrendingList`, `BirthdayStrip`
  (already implemented) via a new Server Component page. This is the
  single highest-leverage next step — it turns a large amount of
  already-built, currently-unreachable code into a real, visitable page.
- **Status:** Not started.
- **Priority:** High.
- **Relevant files:** new `src/app/page.tsx`;
  `src/lib/briefing/getTodaysBriefing.ts`; `src/components/home/*`.
- **Dependencies:** none functionally — works even with `DATABASE_URL`
  unset (falls back to in-memory briefing store) and with no AI key
  (falls back to the template summary).
- **Acceptance criteria:** `/` renders without a runtime error;
  `npm run build` succeeds; the page shows real data from AniList/News
  (or their empty states if those calls fail).
- **Validation steps:** `npm run dev` (with explicit user permission,
  since this audit was told not to start it), visit `/`, confirm no
  console errors; `npm run build`.
- **Blockers:** none technical; only the "don't implement features"
  constraint of the *documentation* audit task, which does not apply to
  whoever picks this up next.

### T-003 — Implement `/api/cron/*` routes or remove them from `vercel.json`
- **Description:** 7 cron schedules are declared with no matching route.
  Either build the 7 routes (refresh-airing, refresh-news,
  refresh-seasonal, birthdays, trend-snapshot, daily-brief,
  notifications) or remove the dead declarations so a deploy doesn't
  silently 404 on every scheduled invocation.
- **Status:** Not started.
- **Priority:** Medium (not urgent while undeployed, becomes urgent the
  moment this is deployed to Vercel).
- **Relevant files:** `vercel.json`; new `src/app/api/cron/*/route.ts`
  files.
- **Dependencies:** most of these would want `DATABASE_URL` configured
  (trend-snapshot, notifications write to Neon tables that already
  exist: `trend_snapshots`, `notifications`).
- **Acceptance criteria:** either 7 working routes returning 200, or an
  updated `vercel.json` with only real targets.
- **Blockers:** needs a decision on which crons are actually wanted
  before building them.

### T-004 — Wire `AddToListButton`/`RemindMeButton` (and their remaining
CRUD actions) into a real page
- **Description:** These components and their server actions exist and
  typecheck but are only referenced from `EpisodeTimeline`, which no
  page renders. Once T-002 lands, they become reachable for the "add"
  path — but `removeAnimeListEntry`, `toggleAnimeFavorite`,
  `markEpisodeWatched`, and all of `mangaList.ts`/`follows.ts`/
  `profile.ts` still have zero UI trigger anywhere.
- **Status:** Not started.
- **Priority:** Medium.
- **Relevant files:** `src/lib/actions/*`, new `/my-list`, `/alerts`,
  `/profile`, `/settings` pages.
- **Dependencies:** T-002 (establishes the pattern), `DATABASE_URL`
  configured for end-to-end testing.
- **Blockers:** none technical.

## Blocked

None currently — every open item above is blocked only by "not started
yet," not by an external dependency, except where noted.

## High priority

- T-001 (lint fix)
- T-002 (home page)

## Medium priority

- T-003 (cron routes)
- T-004 (list/alert/profile pages)
- Decide whether to wire `clusterNews` into the news feed (currently
  dead code — see `FEATURES.md`'s News feed section).
- Decide whether to keep or remove the empty `supabase/migrations/`
  directory (leftover from an apparently-abandoned earlier plan — see
  `DECISIONS.md`).

## Low priority

- Remove unused `resend` and `zod` dependencies, or actually integrate
  them (email digest sending; runtime input validation on server
  actions).
- Wire `JikanProvider`, `YouTubeProvider`, `MusicProvider` into any UI
  (all implemented, zero callers).
- Sync `profiles.accentTheme`/`colorMode` with the current
  `localStorage`-only theme persistence, so preference follows the
  user across devices once signed in.

## Bugs

- **B-001:** `npm run lint` fails (5 errors, 3 warnings) — see T-001.
- **B-002 (design gap, not a crash):** Command palette search results
  link to `/anime/:id`/`/manga/:id`, which don't exist — clicking a
  result currently 404s.
- **B-003 (design gap):** `vercel.json` cron targets don't exist — see
  T-003.

## Technical debt

- **No `.env.example`** — onboarding a new environment requires reading
  `CLAUDE.md`'s reconstructed env var table instead of copying a file.
- **DB schema and TS types are independently maintained** (Drizzle
  `text()` enums vs. `src/lib/types/*`'s TS unions) — see
  `DECISIONS.md`.
- **`src/lib/providers/types.ts`'s `ProviderResult`/`ok`/`fail` pattern
  is defined but unadopted** — every provider does its own inline
  try/catch instead.
- **No repo-local git history** — every change is unrevertable except
  by hand; strongly recommend `git init` inside `anibrief/` (or
  confirming intent to keep using the parent repo) as a near-term
  action, though this is a decision for the user, not something this
  audit should do unprompted.

## Testing needed

- No tests exist at all (`npm run test` finds 0 files). At minimum:
  unit tests for `src/lib/dedup/{clusterNews,textSimilarity}.ts` (pure
  functions, easy to test, currently unverified logic) and
  `src/lib/providers/news/reliability.ts` (`classifyReliability`,
  `looksLikeRumor` — pure functions).
- Once T-002 lands: a manual smoke test of the home page (see
  `TESTING.md`'s checklist).

## Documentation needed

- None outstanding beyond this audit's own deliverables — see
  `HANDOFF.md` for what to read first on a fresh resume.

## Recently completed

- **This session:** documentation audit (T-000) — see `SESSION_LOG.md`
  for the full account. No application code was written by this task,
  though a large amount of application code appeared during the session
  via the observed concurrent process (see `PROJECT_STATE.md`).

## Deferred

- Real database provisioning and end-to-end DB/AI verification —
  explicitly out of scope for a documentation-only audit; deferred to
  whoever next has permission to configure real credentials.

## Rejected ideas

None recorded — no evidence in the repo of any idea being explicitly
considered and rejected (no such comments/notes found).
