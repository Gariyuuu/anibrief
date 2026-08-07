# PROJECT_STATE.md — Exact Handoff Snapshot

## FOURTH ADDENDUM (2026-08-07, final-transfer-checkpoint pass — resolves the THIRD ADDENDUM below)

**Re-verified from scratch this pass:** `git log --oneline -5` shows `main` HEAD at
`d69e067` ("Add self-hosted goat-ai-platform as a 3rd AI provider option"), matching
`origin/main` exactly (`git fetch origin` returned nothing new), working tree clean
(`git status`: 0 uncommitted, 0 ahead/behind). **`d69e067` is the same `goat-ai` work
the THIRD ADDENDUM below describes as "not committed" — it was committed after that
addendum was written**, in one commit alongside its own doc edits
(`git show d69e067 --stat`: `src/lib/ai/{goat-ai.ts,index.ts,types.ts}`,
`.env.example`, `CLAUDE.md`, `ENVIRONMENT_VARIABLES.md`, `CHANGELOG.md`, this file,
`TASKS.md`, `SESSION_LOG.md`). Treat every "not committed" / "uncommitted" claim
about the `goat-ai` provider anywhere in this file, `TASKS.md`, or `CLAUDE.md` as
**stale** — it is committed, pushed, and `AI_PROVIDER` still defaults to
`"anthropic"` (goat-ai remains opt-in/inert unless explicitly configured).

**Full re-verification this pass:** `npm run typecheck` clean, `npm run lint` clean
(0/0), `npm run test` 24/24 pass, `npm run build` succeeds — **52 routes** (not 44;
the route count grew across the Spotify/People-directory work in `65c44e9`/`c526d86`
and was stale in every doc file that still said 44 — corrected repo-wide this pass).
**Secret scan of all tracked files** (`git grep` for API-key-shaped patterns,
`postgres://user:pass@` connection strings, Anthropic/Stripe/Google/AWS key prefixes,
long assigned token values): no real secrets found — `.env.example` is
placeholder-only, `.env.local` is gitignored and was never committed (confirmed via
`git log --all -- .env.local`), and the two `sk-ant-...`/`AIza...` example strings in
`SECURITY.md`/`SESSION_LOG.md` are illustrative key-format documentation, not real
keys. **No cross-file contradiction beyond the ones already flagged by this repo's
own prior addendums was found**; the ones that existed (goat-ai's committed/
uncommitted status; the 44-vs-52 route count) are fixed by this addendum and the
repo-wide route-count correction.

**Recommended next action for whoever reads this:** same as always — run
`git log --oneline -5` and `git status` before trusting anything below, but as of
this checkpoint there is nothing left over from `d69e067` to reconcile.

---

## THIRD ADDENDUM (2026-08-06, written after the SECOND ADDENDUM below — real code work, not a doc pass)

**Everything below this addendum (including the SECOND/first ADDENDUMs) is
documentation locked against commit `91b23c4`/`d296f93` and is now several commits
stale** — `git log --oneline -5` at the start of this session showed `main` at
`a0696ef` ("Refresh handoff docs for accuracy..."), five commits ahead of what the
rest of this file describes, with a clean working tree. **Do not trust this file's
body below for anything except the general shape of the app** — re-verify specifics
against the live code, same advice every prior addendum has given.

**This session's actual work:** added a third AI provider, `GoatAIProvider`
(`src/lib/ai/goat-ai.ts`), implementing the existing `AIProvider` interface
(`src/lib/ai/types.ts`, widened `name` union to include `"goat-ai"`) — same shape as
`AnthropicProvider`/`OpenAIProvider`, backed by a self-hosted OpenAI-compatible
platform via the official `openai` npm package (already a dependency — no
`package.json` change needed) pointed at a custom `baseURL`. Wired into
`getAIProvider()` (`src/lib/ai/index.ts`) as an additional branch — the
`anthropic`/`openai` branches and the null/template fallback are untouched and still
work exactly as before. **Not activated by default anywhere** — `AI_PROVIDER` still
defaults to `"anthropic"`; production still has no AI key configured (confirmed: the
`npm run build` in this session hit a real 400 "credit balance too low" from
Anthropic, because *this shell session's own environment* — not `.env.local`, which
has no AI-related keys at all — happened to export a real `ANTHROPIC_API_KEY`; that
error was caught and the build fell back to the template summary exactly as
designed, which is itself a live demonstration that the null/template fallback
survives a real API error, not just a missing key).

**Verification:** `npm run typecheck && npm run lint && npm run test && npm run
build` all pass clean (24/24 tests, build succeeds with the same route count).
Functionally tested end-to-end outside the Next.js process (plain `node
--experimental-strip-types --conditions=react-server`, importing the real source
files via this repo's existing `@/` alias loader) against the real platform with the
real credentials supplied for this task: `GoatAIProvider.complete()` returned a real
completion; `getAIProvider()` correctly returns the `goat-ai` instance when
`AI_PROVIDER=goat-ai` + `AI_PLATFORM_API_KEY` are both set, and correctly falls back
to `null` when either is missing (three scenarios tested: both set → real completion;
neither set → null; `AI_PROVIDER=goat-ai` with no key → null). Did **not** start
`npm run dev` or exercise the feature through an actual page load — the direct-import
test above was judged sufficient and lower-risk than standing up the dev server with
a real key in the environment. Files touched: `src/lib/ai/types.ts`,
`src/lib/ai/goat-ai.ts` (new), `src/lib/ai/index.ts`, `.env.example`, `CLAUDE.md`,
`ENVIRONMENT_VARIABLES.md`, `CHANGELOG.md`, this file, `TASKS.md`, `SESSION_LOG.md`.
Not committed — per this task's instructions, commit/push/deploy only on explicit
request.

---

## SECOND ADDENDUM (2026-08-06, written last, after the first ADDENDUM below)

**The uncommitted Spotify-schema work described in the ADDENDUM immediately below
has since been committed and pushed**, as `d296f93` ("Add patch-notes link to
sidebar; add Spotify OAuth connections table") — landing, again, mid-pass, and
again sweeping up this session's then-unsaved-to-git documentation edits into
itself (see `SESSION_LOG.md`'s second addendum entry for the full account). **The
actual current latest commit is `d296f93`, not `91b23c4`** — every reference to
`91b23c4` as "latest" elsewhere in this file (and the other 16 memory files) was
accurate at the time it was written but is now one commit behind. Re-run
`git log --oneline -5` before trusting any specific "latest commit" claim in this
file's body.

What actually landed in `d296f93`, confirmed via `git show d296f93 --stat`:
- `src/lib/db/schema/spotify.ts`'s `userSpotifyConnections` table — **committed**,
  and per the commit message, **pushed to the live database** ("migration 0001...
  pushed to the live database"). Still no `src/lib/providers/spotify/` provider
  file and no UI consumer exist (not re-checked after this final commit, but no
  evidence of either appearing in the commit's file list above).
- `src/components/layout/AppShell.tsx`'s "What's New / Patch notes" sidebar link —
  **committed**. This resolves a small, real UI gap: `/whats-new` (which renders
  `CHANGELOG.md`) existed as a page since the initial release but had no in-app
  navigation link pointing to it until now.

This documentation was not re-run against `d296f93` as a fresh full pass (that
would risk chasing an indefinitely-moving target, per the same reasoning the
original stale-snapshot episode already worked through) — instead, this specific
addendum plus corresponding short notes in `TASKS.md`, `HANDOFF.md`, `CLAUDE.md`,
and `SESSION_LOG.md` are the closing account. **Recommended next action for
whoever reads this:** `git log --oneline -5` first, always.

---

## ADDENDUM (2026-08-06, written after the rest of this re-sync pass)

**A third wave of concurrent, uncommitted development was observed near the end of
this documentation pass**, on top of the already-observed `91b23c4` commit (see
below). A routine `git status` check found, beyond this pass's own `.md` edits:

- `src/components/layout/AppShell.tsx` — modified (adds a "What's New / Patch
  notes" link to the sidebar footer, above the existing legal disclaimer text).
- `src/lib/db/schema/index.ts` — modified (adds one new schema export).
- `src/lib/db/schema/spotify.ts` — **new, untracked**: a `userSpotifyConnections`
  table (OAuth token storage: `clerkUserId`, `spotifyUserId`, `accessToken`,
  `refreshToken`, `expiresAt`, `scope`) — the start of a real Spotify integration,
  per its own doc comment ("see `src/lib/providers/spotify/oauth.ts`" — **that file
  does not exist yet**, confirmed via `find src/lib/providers/spotify`).
- `drizzle/0001_brief_spencer_smythe.sql`, `drizzle/meta/0001_snapshot.json` —
  **new, untracked**: a generated (not yet applied) migration for the above.

**None of this was made by this documentation pass** (this pass only edits `.md`
files, never `src/`/`drizzle/`). This is the **same concurrent-development pattern
observed twice already** in this repo's history (the original stale-snapshot
episode, and commit `91b23c4` landing mid-pass — see `SESSION_LOG.md`'s addendum
entry). This time, the work is **uncommitted and incomplete** (schema exists, no
provider, no UI, no package.json dependency added yet, migration generated but not
applied) — consistent with this repo's established pattern of schema-first,
provider-second, UI-third development.

**This documentation pass's decision:** same as the original audit's precedent —
do not revert or discard this in-progress work (it looks legitimate, coherent, and
is exactly the kind of feature `CHANGELOG.md`'s "Known limitations" section already
flags as wanted — "Music... credential that aren't configured"). Do not attempt to
fully document a half-built, uncommitted feature as if it were finished (that was
the original episode's core mistake). Instead: **this file, and the rest of this
pass's documentation, is locked as an accurate record of the repo as of commit
`91b23c4`** — the last point where the working tree was fully committed and
settled. The Spotify-schema work described above is flagged here, in
`SESSION_LOG.md`, and in `TASKS.md`, but not otherwise documented as a feature
(it isn't one yet — it's an uncommitted schema file).

**Recommended immediate next action for whoever reads this:** run `git status`
before anything else. If the Spotify schema (or anything else) is now committed,
or if the working tree has grown further, treat this file's body below as
possibly one step further behind reality than it claims, and re-verify before
relying on specifics — exactly the same caveat the original stale-snapshot episode
needed, for exactly the same underlying reason.

---

## Re-sync note (2026-08-06, ~15:35 MST)

This file was previously locked against a **05:59:28 MST snapshot** taken mid-flight,
before the repository (which was under active concurrent development at the time)
had settled. That work has since landed and been committed. This is a **full
re-verification pass** against the actual current git state, superseding everything
below the "Git state" section from the earlier version of this file. See
`SESSION_LOG.md`'s newest entry for the full account of what was re-checked —
**including a second live demonstration of this same repo's concurrent-development
pattern**: a third commit (`91b23c4`) landed and was pushed to `origin/main` by a
separate process partway through this very re-sync pass, sweeping up this file's
and `TASKS.md`'s/`CLAUDE.md`'s then-unsaved-to-git edits along with its own
`next.config.ts`/`CHANGELOG.md` change. This pass never ran `git commit`/`git push`.

## Git state

- **Real git history exists**, tracked inside the parent `~/Projects` repository
  (`anibrief/` still has no `.git` of its own, but the parent repo tracks it, and
  that's sufficient for `git log`/`git status`/`git diff` to work from within
  `anibrief/`).
- **Branch:** `main`, matches `origin/main` (both at `91b23c4` — confirmed via
  `git rev-parse HEAD origin/main`, meaning the third commit below was pushed, not
  just committed locally).
- **Working tree: not clean at the moment this file is being written** — this
  pass's own remaining documentation-file edits are legitimately unstaged (this
  pass never runs `git add`/`git commit` itself; only the user decides whether to
  commit documentation changes). Re-run `git status` for the current exact list —
  it should show only `.md` files, never `src/`/`package.json`/`next.config.ts`/
  any other application file, since this pass's own edits are documentation-only.
- **Commits (3, oldest first):**
  1. `0a1de43` — "Initial release: AniBrief v0.1.1" — the ~176-file build this
     project's earlier documentation pass observed happening live.
  2. `1d1eef9` — "0.1.1: fix admin auth bypass + daily-brief RSC crash, deploy to
     Vercel" — two real production bug fixes plus the actual Vercel/Neon deployment.
  3. `91b23c4` — "0.1.2: fix CSP blocking Clerk's sign-up CAPTCHA" — a real bug
     (sign-up silently failed for every visitor because the CSP didn't allowlist
     Cloudflare Turnstile, which Clerk's bot-protection CAPTCHA loads from), landed
     **during this documentation re-sync pass itself**, authored and pushed by a
     separate process, not this one. See the "Re-sync note" above.
- **Tracked file count:** 225 as of the start of this pass (`git ls-files | wc -l`);
  not re-counted after `91b23c4` landed (that commit only touched already-tracked
  files: `CHANGELOG.md`, `next.config.ts`, plus this pass's own in-flight
  `CLAUDE.md`/`PROJECT_STATE.md`/`TASKS.md` edits — no new files were added).

## Active objective

No in-progress feature-development objective exists in the repo right now. This
session's objective (from the user): re-sync the 17-file documentation system —
written earlier the same day against a stale, mid-flight snapshot — to match the
actual, now-committed code. No application behavior was changed; only `.md` files
were edited.

## Last completed task

**A sign-up CAPTCHA fix** (commit `91b23c4`, landed live during this documentation
pass): the CSP header (added in the initial release) didn't allowlist
`challenges.cloudflare.com`, which Clerk's Cloudflare-Turnstile bot-protection
CAPTCHA loads from — silently breaking sign-up for every visitor. Fixed by adding
that host to `script-src`/`connect-src`/`frame-src` in `next.config.ts`.

Before that: **production deploy + two bug fixes** (commit `1d1eef9`): blocked
`/admin` in middleware to close an auth-bypass window, fixed a
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
- `npm run build` — succeeds, produces **52 routes**: every one of `nav.ts`'s 15
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
- Real security headers exist and are actively maintained: `next.config.ts` sets a
  scoped CSP plus `X-Content-Type-Options`/`X-Frame-Options`/`Referrer-Policy`/
  `Permissions-Policy` on every route — the just-fixed CAPTCHA bug (`91b23c4`) is
  direct evidence this header is real and enforced (a too-narrow CSP is what broke
  sign-up), not decorative. See `SECURITY.md`'s new "Security headers" section.
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
