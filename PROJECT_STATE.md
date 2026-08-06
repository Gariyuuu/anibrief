# PROJECT_STATE.md — Exact Handoff Snapshot

## Re-sync note (2026-08-06, ~15:35 MST)

This file was previously locked against a **05:59:28 MST snapshot** taken mid-flight,
before the repository (which was under active concurrent development at the time)
had settled. That work has since landed and been committed. This is a **full
re-verification pass** against the actual current git state, superseding everything
below the "Git state" section from the earlier version of this file. See
`SESSION_LOG.md`'s newest entry for the full account of what was re-checked.

## Git state

- **Real git history exists**, tracked inside the parent `~/Projects` repository
  (`anibrief/` still has no `.git` of its own, but the parent repo tracks it, and
  that's sufficient for `git log`/`git status`/`git diff` to work from within
  `anibrief/`).
- **Branch:** `main`, up to date with `origin/main`.
- **Working tree: clean.** `git status` → "nothing to commit, working tree clean". No
  untracked or modified files at the time this re-sync started or as of writing (this
  re-sync only touched documentation `.md` files, per its own scope).
- **Commits (2, oldest first):**
  1. `0a1de43` — "Initial release: AniBrief v0.1.1" — the ~176-file build this
     project's earlier documentation pass observed happening live.
  2. `1d1eef9` — "0.1.1: fix admin auth bypass + daily-brief RSC crash, deploy to
     Vercel" — two real production bug fixes plus the actual Vercel/Neon deployment.
- **Tracked file count:** 225 (`git ls-files | wc -l`), excluding `node_modules/`,
  `.next/`, `.vercel/` (all gitignored).

## Active objective

No in-progress feature-development objective exists in the repo right now. This
session's objective (from the user): re-sync the 17-file documentation system —
written earlier the same day against a stale, mid-flight snapshot — to match the
actual, now-committed code. No application behavior was changed; only `.md` files
were edited.

## Last completed task

**Production deploy + two bug fixes** (commit `1d1eef9`, same day as this re-sync):
blocked `/admin` in middleware to close an auth-bypass window, fixed a
Server-Component-to-Client-Component function-prop crash on the Daily Brief page,
adjusted `vercel.json`'s cron schedule for Hobby-plan compatibility, provisioned Neon
via Vercel's integration and pushed the schema, and deployed to
https://anibrief.vercel.app.

## Current unfinished task

**None in progress.** The repo is between tasks: the initial build + first production
fix are done and deployed; this documentation re-sync is now also done. See `TASKS.md`
for the actual next-priority work (headline: no P0/P1 bugs known; remaining items are
gaps like rate limiting, `zod` validation, and a handful of unwired providers).

## What currently works (re-verified this pass)

- `npm run typecheck` — passes clean.
- `npm run lint` — passes clean, **0 errors, 0 warnings** (the earlier snapshot's 5
  errors + 3 warnings are fixed, via targeted `eslint-disable-next-line` comments on
  the initial-state-sync `useEffect`s in `ThemeToggle.tsx`, `AccentPicker.tsx`,
  `CommandPalette.tsx`, `EpisodeTimeline.tsx`, plus removing the unused imports).
- `npm run test` — **24/24 pass, 0 fail** — real tests now exist for
  `clusterNews`/`textSimilarity` (dedup), `mapMedia` (AniList mapper), news
  `reliability`, and `dates`/`season` utils.
- `npm run build` — succeeds, produces **44 routes**: every one of `nav.ts`'s 15
  declared routes has a real `page.tsx` (plus nested tab routes under `anime/[id]`
  and `manga/[id]`, the daily-brief archive, settings/import, sign-in/up), all 7
  `/api/cron/*` routes, `/api/search`, `/api/calendar/ics`, and the generated
  icon/manifest/OG routes.
- **Deployed and live** at https://anibrief.vercel.app, per `README.md`, the
  `1d1eef9` commit message, and `.vercel/` being present locally (project link
  metadata only — not inspected for secrets).
- The admin-dashboard auth-bypass bug is fixed and the fix is structurally sound:
  `src/proxy.ts` now blocks `/admin` for non-admins before any rendering starts,
  reusing the same `isAdminUser()` check as the layout-level redirect.
- The Daily Brief RSC crash is fixed: `DailyBriefView`/`BriefModeToggle` now pass only
  plain, serializable data across the server/client component boundary (verified by
  reading the current file — no function props remain).
- Follows, Profile, and Settings — previously "backend only, no UI at all" — now have
  real UI: `FollowButton`/`UnfollowChip` components, a `/profile` page, a `/settings`
  page with 8 preference-category forms, all calling the pre-existing server actions.
- News deduplication (`clusterNews`) — previously dead code — is now called from
  `src/app/news/page.tsx`.
- The admin surface — previously "schema-only, zero code reads/writes any of it" — is
  now real: `/admin` (gated), live provider-health checks
  (`src/lib/admin/providerHealth.ts`), feature-flag toggles, an announcement-banner
  editor, a test-notification button, and an audit log, all backed by real server
  actions (`src/lib/actions/admin.ts`) that re-check admin status independently.
- Locally, `.env.local` has real Clerk keys and a real `DATABASE_URL` (+ the full set
  of Neon/Postgres variables Vercel's integration writes) — confirmed by variable
  *names* only, values never read or printed by this pass.

## What currently fails / is unverified

- **No AI key, `YOUTUBE_API_KEY`, `ADMIN_USER_IDS`, or `CRON_SECRET` configured in
  this local environment** — those features run in their documented
  graceful-degradation paths here specifically; production (Vercel) env vars were not
  inspected by this pass (out of scope — this is a local, doc-only re-sync).
- **No browser session was exercised.** `npm run dev` was not started this pass;
  "the build succeeds and routes exist" is not the same claim as "every page renders
  correctly with real data in a browser." See `TESTING.md`'s manual checklist for what
  a real smoke test would still need to cover.
- **The live production database's actual row-level state was not inspected** — no
  DB queries were run this pass (would require either the production `DATABASE_URL`
  or explicit permission to query the local one; out of scope for a documentation
  re-sync).
- **`getUserAnimeList(userId)`/`getUserFollows(userId)`/`getOrCreateProfile(userId)`/
  etc. still take a caller-supplied `userId` with no internal ownership check** — every
  current caller passes their own session's id correctly (verified by reading
  `my-list/page.tsx`, `profile/page.tsx`, `alerts/page.tsx`, `settings/page.tsx`), so
  this is not an active bug, but it's still a latent IDOR-shaped gap. See
  `SECURITY.md`.
- **`zod` and `resend` remain installed but unused** (re-verified: zero `from "zod"`/
  `from "resend"` matches in `src/`).
- **No rate limiting anywhere** in the app.
- **No CI workflow** (`.github/workflows/` doesn't exist).
- **`package.json`'s `"version": "0.1.0"`** doesn't match the `0.1.1` used in
  `CHANGELOG.md` and both commit messages — a real, minor, unfixed inconsistency
  (not corrected by this pass, since that would be an application-file edit outside
  a documentation-only re-sync's scope).

## Blockers

None currently blocking further development. Everything that was previously blocked
on "the app has no reachable pages" is resolved — the app is deployed and every
declared route exists.

## Assumptions currently in effect (not independently re-verified this pass)

- That the production Vercel deployment's environment variables match what
  `DEPLOYMENT.md`/`CLAUDE.md` document as required/optional — not independently
  checked against the live Vercel project (would require Vercel CLI/dashboard access
  this pass didn't use).
- That the schema actually pushed to the live Neon database matches
  `drizzle/0000_silly_captain_stacy.sql` exactly — inferred from the commit message
  ("pushed schema") and from there being no schema-file changes since that migration
  was generated, not from directly querying the live database.
- That `.env.local`'s values are real, functional credentials — never verified
  against Clerk's or Neon's API this pass, only observed as present by variable name.

## Next three recommended actions

1. **Add `zod` runtime validation** to server actions and `/api/search`'s query param
   — the dependency has been installed and unused since the initial release; this is
   the most-flagged, longest-standing gap across `SECURITY.md`/`DECISIONS.md`/
   `CLAUDE.md`.
2. **Add basic rate limiting** to `/api/search`, `/api/calendar/ics`, and the server
   actions before this gets meaningfully more traffic than the initial deploy — see
   `SECURITY.md`'s "Production security gaps."
3. **Decide the fate of the 6 caller-supplied-`userId` read functions** (`getUserAnimeList`,
   `getUserMangaList`, `getUserFollows`, `getUserAlerts`, `getUserNotifications`,
   `getOrCreateProfile`) — either add an internal `auth()`-derived ownership check
   (defense-in-depth, cheap) or explicitly document why every call site is trusted to
   self-police. Not urgent (no active exploit path found), but it's been flagged
   across two documentation passes now without a decision recorded.

## Verification required before continuing

Before trusting this document for a new task: run `git log --oneline -5` and
`git status` to confirm the repo hasn't moved since this snapshot, then re-run
`npm run typecheck && npm run lint && npm run test && npm run build`.
