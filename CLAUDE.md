# CLAUDE.md — Operating Manual for AniBrief

> **Re-sync note (2026-08-06, ~15:35 MST):** the previous documentation pass (written
> ~05:59–06:15 MST the same day) was locked against a snapshot that turned out to be
> mid-flight — the repo kept growing (concurrent development) right up until it was
> committed. Two commits have since landed: `0a1de43` ("Initial release: AniBrief
> v0.1.1", ~176 files) and `1d1eef9` ("0.1.1: fix admin auth bypass + daily-brief RSC
> crash, deploy to Vercel"). This file, and its 16 sibling memory files, have now been
> re-verified against the actual current committed code (git-tracked, 225 files),
> not against the earlier snapshot. See `SESSION_LOG.md`'s newest entry for exactly
> what was re-checked and how.

## Project identity

**AniBrief** is a Next.js web app: "a daily briefing terminal for anime, manga,
Japanese music, voice-actor news, episode tracking, and discovery" (per
`src/app/manifest.ts` and `layout.tsx` metadata). It aggregates data from AniList,
Jikan/MyAnimeList, Google News RSS, and YouTube into a personalized daily brief,
episode calendar, news feed, and watch/read list, with optional AI-generated
summaries. **It is live and deployed:** https://anibrief.vercel.app.

Working directory for all commands: `/Users/gariyuu/Projects/anibrief`.

Comment markers throughout the code (`per spec §5`, `§9`, `§21`, `§22`, `§25`, `§42`,
etc.) reference an external product spec that is **not present in this repository** —
it could not be located anywhere under `anibrief/`. Treat those section numbers as
evidence of intent, not as something you can open and read.

## Current status

As of this re-sync (2026-08-06, git HEAD `1d1eef9`), AniBrief is **a working, deployed
product**, not the early-stage scaffold the earlier documentation pass described:

- **Real git history exists.** `anibrief/` is tracked inside the `~/Projects` parent
  repo, on branch `main`, 2 commits, working tree clean (`git status` → nothing to
  commit) as of this re-sync. `git log --oneline`: `1d1eef9` (auth/RSC fixes + deploy)
  on top of `0a1de43` (initial release).
- **Deployed to Vercel**, live at https://anibrief.vercel.app, with Clerk auth and a
  Neon Postgres database provisioned through Vercel's integration (schema pushed).
- **Every route in `src/lib/nav.ts` (15 items) has a real `page.tsx`.** `npm run build`
  produces 44 routes total: 34 `page.tsx` pages (including nested `anime/[id]`/
  `manga/[id]` tab routes, `daily-brief/archive/[date]`, `settings/import`,
  `sign-in`/`sign-up`), 1 middleware/proxy, the rest API/cron/icon/manifest routes.
  There is no longer a "nothing renders" problem — see `FEATURES.md` for
  feature-by-feature verification.
- **All 7 `/api/cron/*` routes exist and are real**, each wrapped in
  `src/lib/cron/runCronJob.ts`'s idempotency lock (backed by the `sync_jobs` table),
  matching every schedule declared in `vercel.json`.
- **Real tests exist and pass**: 24/24 (`src/lib/dedup/__tests__/*`,
  `src/lib/providers/anilist/__tests__/mappers.test.ts`,
  `src/lib/providers/news/__tests__/reliability.test.ts`,
  `src/lib/utils/__tests__/{dates,season}.test.ts`).
- **A real `.env.example` exists**, comprehensive, no secrets, matches this file's env
  var table.
- **`npm run lint` passes clean** (0 errors, 0 warnings) — the earlier snapshot's 5
  `react-hooks/set-state-in-effect` errors were fixed with targeted
  `eslint-disable-next-line` comments (see `ThemeToggle.tsx`, `AccentPicker.tsx`,
  `CommandPalette.tsx`, `EpisodeTimeline.tsx`); the 3 unused-import warnings are gone.
- **`npm run typecheck` passes clean.**
- **`npm run build` succeeds** (verified this re-sync; ~44 routes, 11.9s static-page
  generation).
- Two real production bugs were found and fixed on top of the initial release (commit
  `1d1eef9`): an **admin-dashboard auth bypass** (a signed-out request could briefly
  receive rendered `/admin` content before a layout-level `redirect()` took effect,
  due to an RSC-streaming timing quirk in this Next.js version — fixed by also
  blocking `/admin` in `src/proxy.ts` middleware, before any rendering starts) and a
  **Daily Brief page crash** (a Server Component was passing a render-prop function
  into a Client Component, which isn't serializable across that boundary — fixed by
  restructuring `DailyBriefView`/`BriefModeToggle` to pass only plain data down).
- **Locally, this environment has Clerk + a real `DATABASE_URL` configured** (via
  Vercel's Neon integration — confirmed by variable *names* only in `.env.local`, not
  values). **No AI key** (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`), **no
  `YOUTUBE_API_KEY`**, **no `ADMIN_USER_IDS`**, **no `CRON_SECRET`** are set locally —
  those features run in their documented graceful-degradation/"not configured" paths
  in this environment (production may differ; not verified from inside this session).
- **`package.json`'s `"version"` field still reads `0.1.0`**, while the changelog and
  both commit messages call this `0.1.1` — a real, minor inconsistency, left as-is
  (bumping it would be an application-file change outside this doc-only re-sync's
  scope). Flag it if you touch `package.json` for any other reason.

## Technology stack

Versions below are copied verbatim from `package.json` at the current commit.

- **Framework:** Next.js `16.2.11`, App Router, Turbopack (default dev/build engine
  per the build output). `AGENTS.md` explicitly warns this Next.js version has
  **breaking changes vs. what you may know** — most notably `middleware.ts` is
  renamed to `proxy.ts` (exported function `proxy`, wired via `clerkMiddleware()`; see
  `src/proxy.ts`, which now also enforces the `/admin` auth gate — see "Current
  status"). Read `node_modules/next/dist/docs/` before assuming standard Next.js
  behavior.
- **UI:** React `19.2.4`, React DOM `19.2.4`.
- **Language:** TypeScript `^5`, `strict: true` (see `tsconfig.json`).
- **Styling:** Tailwind CSS `^4` via `@tailwindcss/postcss`, CSS custom properties for
  theming (`src/app/globals.css`).
- **Auth:** `@clerk/nextjs ^7.6.5`.
- **Database:** `@neondatabase/serverless ^0.10.4` (Neon Postgres, HTTP driver) +
  `drizzle-orm ^0.36.4` + `drizzle-kit ^0.28.1` (dev). Live: provisioned via Vercel's
  Neon integration, schema pushed (per the `1d1eef9` commit message).
- **AI:** `@anthropic-ai/sdk ^0.112.5`, `openai ^6.48.0` — dual-provider, optional,
  template-fallback if neither key is set. No key configured in this local
  environment.
- **Email:** `resend ^6.18.0` is a dependency but is still **not integrated** — zero
  send call sites in `src/`. `NotificationsForm.tsx` says so explicitly in its own UI
  copy ("up yet (`resend` is installed but not integrated)"). The Daily Brief's
  "Email" share action uses a client-side `mailto:` link instead.
- **News ingestion:** `rss-parser ^3.13.0` (Google News RSS, no key).
- **Dates:** `date-fns ^4.4.0`, `date-fns-tz ^3.2.0`.
- **Icons:** `lucide-react ^1.25.0`.
- **Validation:** `zod ^4.4.3` is a dependency but **still has zero usages** anywhere
  in `src/` (re-verified this pass: `grep -r 'from "zod"' src/` → no matches) — server
  actions and `/api/search` still trust their TypeScript input types with no runtime
  validation. See `SECURITY.md`.
- **Utility:** `clsx ^2.1.1` + `tailwind-merge ^3.6.0` (via `cn()`),
  `server-only ^0.0.1` (marks server-only modules).
- **Lint:** ESLint `^9`, flat config, `eslint-config-next 16.2.11`. Clean (0/0).
- **Skills:** `.claude/skills/{neon,neon-postgres}` and `.agents/skills/{neon,neon-postgres}`
  were added in the `1d1eef9` commit (Claude Code / Agents skill packages used while
  provisioning Neon), tracked via `skills-lock.json`.

## Essential commands

Run all commands from `/Users/gariyuu/Projects/anibrief`.

```bash
npm run dev            # next dev (Turbopack)
npm run build           # next build — verified this re-sync: succeeds, 44 routes
npm run start            # next start — not exercised this re-sync
npm run lint              # eslint — verified this re-sync: 0 errors, 0 warnings
npm run typecheck          # tsc --noEmit — verified this re-sync: passes clean
npm run test                 # node --experimental-strip-types --test src/**/__tests__/**/*.test.ts
                              #   verified this re-sync: 24/24 pass, 0 fail
npm run db:generate            # drizzle-kit generate — not re-run this pass (no schema changes made)
npm run db:push                 # drizzle-kit push — already run in production per the 1d1eef9 commit
                                 #   message ("Provisioned Neon Postgres... pushed schema"); NOT
                                 #   re-run by this documentation pass. Never run against a real DB
                                 #   without explicit permission.
npm run db:studio                # drizzle-kit studio — not run this pass
```

## Repository structure

```
anibrief/
├── AGENTS.md                # Breaking-changes warning for this Next.js version
├── CLAUDE.md                 # This file
├── PROJECT_STATE.md, TASKS.md, ARCHITECTURE.md, FILE_MAP.md, FEATURES.md,
│   ROADMAP.md, DECISIONS.md, DATABASE.md, API_REFERENCE.md, UI_SYSTEM.md,
│   SECURITY.md, TESTING.md, DEPLOYMENT.md, CHANGELOG.md, SESSION_LOG.md,
│   HANDOFF.md                # This 17-file memory system (all in repo root)
├── README.md, CONTRIBUTING.md, DATA_SOURCES.md, ENVIRONMENT_VARIABLES.md
│                             # Product-facing docs added during the build (not part
│                             # of the original 17-file memory-system spec, but real
│                             # and current — see each for its own scope)
├── package.json / package-lock.json
├── tsconfig.json, eslint.config.mjs, postcss.config.mjs, next.config.ts
├── vercel.json                # 7 cron declarations, once-daily/staggered (Hobby-plan
│                               # compatible) — see DEPLOYMENT.md
├── drizzle.config.ts           # drizzle-kit config
├── drizzle/                    # Generated migration (0000_silly_captain_stacy.sql) + meta
├── .env.example                 # Full, real, placeholder-only env var template
├── .env.local                    # Clerk + Neon (Vercel-integration) vars, gitignored
├── .claude/skills/, .agents/skills/  # neon / neon-postgres skill packages (skills-lock.json)
├── public/                        # PWA service worker (sw.js) — otherwise empty; all
│                                   # icons/OG images are generated via next/og, not static
├── scripts/                        # register-loader.mjs, resolve-aliases.mjs (test runner support)
├── supabase/migrations/             # Empty directory — vestige of an abandoned Supabase
│                                     # plan; package.json no longer depends on @supabase/*
└── src/
    ├── proxy.ts                     # Clerk middleware; also enforces the /admin auth gate
    │                                 # (see "Current status" — this is the auth-bypass fix)
    └── app/
        ├── layout.tsx                # Root layout: ClerkProvider, AppShell, theme-init script
        ├── page.tsx                   # Home dashboard (hero brief + episode timeline + trending + birthdays)
        ├── daily-brief/, daily-brief/archive/, daily-brief/archive/[date]/
        ├── news/, airing/, seasonal/, discover/, calendar/
        ├── anime/, anime/[id]/{characters,music,news,relations,staff,statistics}/
        ├── manga/, manga/[id]/{characters,news,relations}/
        ├── music/, people/, people/[id]/
        ├── my-list/, profile/, settings/, settings/import/
        ├── alerts/
        ├── admin/                     # Clerk-gated (ADMIN_USER_IDS or profiles.isAdmin);
        │                               # gated in both proxy.ts (middleware) and layout.tsx
        ├── api/
        │   ├── search/route.ts          # Command-palette search proxy
        │   ├── calendar/ics/route.ts     # .ics calendar export
        │   └── cron/{birthdays,daily-brief,notifications,refresh-airing,
        │             refresh-news,refresh-seasonal,trend-snapshot}/route.ts
        │                                 # All 7 real, all wrapped in runCronJob()'s
        │                                 # sync_jobs idempotency lock
        ├── sign-in/[[...sign-in]]/, sign-up/[[...sign-up]]/   # Clerk hosted pages
        └── whats-new/                    # Renders CHANGELOG.md content
    ├── components/
    │   ├── ui/                    # Button, Card, Badge, Avatar, Skeleton, EmptyState, ErrorState, Tabs
    │   ├── layout/                 # AppShell, NavLinks, MobileNav, CommandPalette, ThemeToggle,
    │   │                            # AccentPicker, AnnouncementBanner
    │   ├── brand/                   # Logo, Mark (SVG)
    │   ├── home/                     # HeroBrief, StatTile, EpisodeTimeline, TrendingList, BirthdayStrip
    │   ├── briefing/                  # DailyBriefView, BriefModeToggle, BriefActions
    │   ├── anime/, news/, people/, airing/, calendar/
    │   ├── actions/                    # AddToListButton, RemindMeButton, RemoveFromListButton,
    │   │                                # FollowButton, UnfollowChip, ListStatusSelect,
    │   │                                # FavoriteToggleButton
    │   ├── admin/                       # AnnouncementBannerForm, DataSourceToggle,
    │   │                                 # FeatureFlagToggle, TestNotificationButton
    │   ├── settings/                     # 8 preference forms (Appearance, BriefPrefs, ContentPrefs,
    │   │                                  # Notifications, Privacy, Region, Spoiler, Streaming)
    │   ├── import/                        # ImportWizard
    │   └── pwa/                            # OfflineBanner, ServiceWorkerRegister
    └── lib/
        ├── ai/                        # AIProvider interface, Anthropic + OpenAI implementations
        ├── actions/                    # "use server" Clerk-gated CRUD: animeList, mangaList,
        │                                # alerts, follows, profile, calendarReminders, listImport, admin
        ├── admin/                       # providerHealth.ts (live admin health-check aggregator)
        ├── briefing/                     # buildBriefing, getTodaysBriefing, store (Neon or in-memory)
        ├── cron/                          # runCronJob.ts (shared idempotency-lock wrapper)
        ├── db/                             # client.ts (lazy Drizzle/Neon client) + schema/ (18 tables)
        ├── dedup/                          # clusterNews, textSimilarity — now called from src/app/news/page.tsx
        ├── providers/                       # anilist/, jikan/, mal/, music/, news/, streaming/, youtube/, types.ts
        ├── types/                            # Shared TS contracts
        ├── utils/                            # cn, dates, logger, retry, season, mediaId, birthdays,
        │                                      # alertLabels, adminAccess, calendarEvents
        ├── nav.ts                             # 15-route nav source of truth — every route now has a page.tsx
        └── theme.ts                           # 7 accent theme definitions + localStorage keys
```

## Architecture summary

Server-first Next.js App Router app. Data providers under `src/lib/providers/*` are
all `import "server-only"` and call external APIs directly (AniList GraphQL, Jikan
REST, Google News RSS, YouTube Data API) with retry/backoff and Next's `fetch` cache
rather than a database cache. User-generated data (lists, alerts, follows, profile,
saved news, calendar reminders) lives in Neon Postgres via Drizzle, keyed by Clerk's
`userId` — every write path checks `isDatabaseConfigured()` first and degrades to a
clear "sign in" / "not configured" error or an in-memory fallback (briefing store
only) rather than crashing. Auth is Clerk end-to-end: `proxy.ts` (middleware, now also
enforcing the `/admin` gate) + `ClerkProvider` in the root layout +
`SignedIn`/`SignedOut`/`useUser()` in client components + `auth()` in server actions
and route handlers. See `ARCHITECTURE.md` for the full diagram and request lifecycle.

## Coding conventions

**Verified (observed consistently across the codebase, re-checked this pass):**
- Every provider module starts with `import "server-only";` and never throws to its
  caller — failures are caught, logged via `src/lib/utils/logger.ts`, and a safe
  empty/`null` fallback is returned instead.
- Server actions (`src/lib/actions/*.ts`, `"use server"`) each start with a local
  `requireUser()`/`requireAdmin()` that throws a **user-readable** error message when
  unauthenticated, unauthorized, or when the DB isn't configured, then call
  `revalidatePath()` on success.
- Several read-only functions across `animeList.ts`, `mangaList.ts`, `follows.ts`,
  `alerts.ts`, `calendarReminders.ts`, and `profile.ts` (`getUserAnimeList(userId)`,
  `getUserFollows(userId)`, `getOrCreateProfile(userId)`, etc.) still take a
  **caller-supplied `userId`** rather than deriving it from `auth()` internally. Every
  current caller (`src/app/my-list/page.tsx`, `profile/page.tsx`, `alerts/page.tsx`,
  `settings/page.tsx`) correctly passes the signed-in session's own id — **not an
  active vulnerability today** — but the functions themselves still have no internal
  check that the caller is asking about their own data. See `SECURITY.md`.
- Components use `cn()` (`clsx` + `tailwind-merge`) for conditional classes.
- UI primitives live in `src/components/ui/` and are the only place Tailwind variant
  maps are defined.
- No CSS-in-JS; all styling is Tailwind utility classes + CSS custom properties.
- Cron routes (`src/app/api/cron/*/route.ts`) are all thin wrappers around
  `src/lib/cron/runCronJob.ts`, which takes an idempotency lock in the `sync_jobs`
  table before running the job body — copy this pattern for any new scheduled route.

**Recommended (not yet enforced — flag if you see a deviation, don't assume it's a
rule):**
- `zod` is installed and unused; adding runtime validation to server actions and
  `/api/search`'s query param would match the apparent intent of having it installed.
  This is still just a gap, not yet a repo convention.

## UI and design system

See `UI_SYSTEM.md` for full detail. Key files:
- `src/app/globals.css` — CSS custom property tokens, 7 accent-theme variants,
  dark mode via `.dark` class + Tailwind's `@custom-variant dark`.
- `src/lib/theme.ts` — 7 accent options, `localStorage` keys.
- `src/components/ui/*` — Button, Card, Badge, Avatar, Skeleton, EmptyState,
  ErrorState, Tabs.
- `src/components/brand/Mark.tsx` — original SVG logomark.

## Environment setup

**A real `.env.example` exists** (`/.env.example`) — copy it to `.env.local` and fill
in what you need; the app runs with zero variables set (AniList needs no key).

| Variable | Required? | Client/Server | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Required for sign-in | Client | Clerk publishable key |
| `CLERK_SECRET_KEY` | Required for sign-in | Server | Clerk backend secret |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `..._SIGN_UP_URL` / `..._SIGN_IN_FALLBACK_REDIRECT_URL` / `..._SIGN_UP_FALLBACK_REDIRECT_URL` | Optional | Client | Clerk routing overrides |
| `DATABASE_URL` | Optional — every personalization feature is inert without it | Server | Neon Postgres connection string |
| `ADMIN_USER_IDS` | Optional | Server | Comma-separated Clerk user ids allowed into `/admin`, in addition to `profiles.isAdmin` |
| `MAL_CLIENT_ID`, `MAL_CLIENT_SECRET` | Optional, currently no-op | Server | Gates `MyAnimeListProvider`, whose methods are still unconditional stubs |
| `YOUTUBE_API_KEY` | Optional | Server | Enables real trailer/PV search; empty results without it |
| `AI_PROVIDER` (+ `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`) | Optional | Server | AI-written Daily Brief summary; template fallback otherwise |
| `ANTHROPIC_MODEL`, `OPENAI_MODEL` | Optional | Server | Model overrides (defaults `claude-sonnet-5` / `gpt-4o-mini`) |
| `CRON_SECRET` | Optional but recommended before a public deploy | Server | Bearer-token guard on `/api/cron/*`; Vercel Cron sends it automatically once set |
| `NEXT_PUBLIC_APP_URL` | Optional (defaults to `http://localhost:3000`) | Client | Absolute link/share/OG base URL |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Not currently used | — | Reserved for a future email-digest feature; zero call sites in `src/` today |

**This local environment** (`.env.local`, confirmed by variable *names* only, values
never read/printed) has: Clerk keys, `DATABASE_URL` + the full set of Neon/Postgres
variables Vercel's integration writes (`PGHOST`, `POSTGRES_URL`, etc.). **Not set
locally:** `ADMIN_USER_IDS`, `AI_PROVIDER`/`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`,
`YOUTUBE_API_KEY`, `MAL_CLIENT_ID`, `CRON_SECRET`, `RESEND_API_KEY`. This means, in
this environment specifically: sign-in and DB-backed personalization work; `/admin`
is inaccessible (no allowlist) unless a `profiles.isAdmin` row is set by hand; the
Daily Brief uses the template summary, not an AI one; trailer search returns empty;
cron routes run unauthenticated with a logged warning. See `ENVIRONMENT_VARIABLES.md`
for the full unlock/degrade table.

## Database summary

Neon Postgres (serverless HTTP driver) via Drizzle ORM. 18 tables across 5 schema
files under `src/lib/db/schema/`. Schema has been generated
(`drizzle/0000_silly_captain_stacy.sql`) and, per the `1d1eef9` commit message,
**pushed to a real, Vercel-provisioned Neon database** — this documentation pass did
not independently re-verify live row data (out of scope; no destructive/exploratory
DB queries were run). Full detail in `DATABASE.md`.

## Authentication and authorization

Clerk (`@clerk/nextjs`) end-to-end. `src/proxy.ts` wraps `clerkMiddleware()` and now
also blocks `/admin` for non-admins **before any rendering starts** (the fix for the
auth-bypass bug in commit `1d1eef9` — see "Current status"). `profiles.isAdmin` and
the `ADMIN_USER_IDS` env allowlist (`src/lib/utils/adminAccess.ts`'s `isAdminUser()`)
are both real, wired, and used by both the middleware gate and `src/app/admin/layout.tsx`.
See `SECURITY.md` for the full authz review.

## API and integrations

Real HTTP routes: `GET /api/search` (command-palette proxy), `GET /api/calendar/ics`
(auth-gated `.ics` export), and all 7 `/api/cron/*` routes. External integrations:
AniList GraphQL (no key), Jikan REST (no key, self-throttled, currently only called
from the admin health check), Google News RSS (no key), YouTube Data API v3
(key-gated, called from the Music pages), Anthropic/OpenAI (key-gated, template
fallback). Full detail in `API_REFERENCE.md` and `FEATURES.md`.

## Testing and verification

- `npm run typecheck` — **passes clean** (re-verified this pass).
- `npm run lint` — **passes clean, 0 errors, 0 warnings** (re-verified this pass; the
  earlier snapshot's 8 problems are fixed).
- `npm run test` — **24/24 pass** (re-verified this pass): `src/lib/dedup/__tests__/
  {clusterNews,textSimilarity}.test.ts`, `src/lib/providers/anilist/__tests__/
  mappers.test.ts`, `src/lib/providers/news/__tests__/reliability.test.ts`,
  `src/lib/utils/__tests__/{dates,season}.test.ts`.
- `npm run build` — **succeeds** (re-verified this pass; 44 routes).
- No E2E, no component tests, no CI workflow files found anywhere in the repo (no
  `.github/workflows/`) — see `TESTING.md`.

## Deployment

Live at https://anibrief.vercel.app. `vercel.json` declares all 7 cron jobs, now
**once-daily and staggered** (Hobby-plan compatible — see `DEPLOYMENT.md`), matching
7 real routes under `src/app/api/cron/*`. Neon Postgres provisioned via Vercel's
integration; Clerk configured for production. See `DEPLOYMENT.md` for the full
checklist and the two production fixes shipped in `1d1eef9`.

## DO NOT CHANGE WITHOUT REVIEW

1. **`src/proxy.ts`** — the entire auth boundary, and (as of `1d1eef9`) the
   authoritative `/admin` gate. Removing or narrowing its admin-route check
   re-introduces the fixed auth-bypass bug.
2. **`src/lib/db/schema/*`** — the schema has a generated migration that has been
   pushed to a real, live Neon database (per the `1d1eef9` commit message). Treat
   schema changes as needing a real migration path from here on, not a "green field"
   `db:push`.
3. **`vercel.json`'s cron schedules** — kept intentionally once-daily/staggered for
   Vercel Hobby-plan compatibility; see `DEPLOYMENT.md` before changing.
4. **`.env.local`** — contains real Clerk and Neon connection values for this
   environment. Never print, log, or copy its contents into any documentation,
   commit, or chat output. This pass only ever read redacted key *names*.
5. **The `isDatabaseConfigured()` / `getAIProvider()` graceful-degradation pattern**
   in `src/lib/db/client.ts` and `src/lib/ai/index.ts`.
6. **`src/components/briefing/DailyBriefView.tsx`/`BriefModeToggle.tsx`'s
   server/client prop boundary** — this is the exact shape that crashed production
   once (function props aren't serializable across the RSC boundary); don't
   reintroduce a function prop here without checking `1d1eef9`'s diff first.
7. **`package.json` dependency set** — don't remove `@clerk/nextjs`,
   `@neondatabase/serverless`, `drizzle-orm`, or `drizzle-kit` assuming they're
   unused — they're the entire live auth/DB layer.

## Known issues

- **`zod` and `resend` are installed but 100% unused** in `src/` (re-verified this
  pass).
- **`MyAnimeListProvider`'s methods are unconditionally-`null` stubs** regardless of
  `MAL_CLIENT_ID` — "intentionally unimplemented" per its own code comment.
- **`MusicProvider` is hand-curated mock data** (4 real songs, honestly labeled
  `source: "mock"`) — no live Spotify/MusicBrainz integration, though it **is now
  reachable** via `/music` and `anime/[id]/music`.
- **`JikanProvider` has exactly one caller** (`src/lib/admin/providerHealth.ts`'s
  health check) — its actual ranking data (`getRankingByMalId`) still has zero
  consumers outside that configured-check.
- **The 6 caller-supplied-`userId` read functions** (see "Coding conventions" above)
  are a latent IDOR-shaped design gap — not an active bug given today's callers, but
  flag it before adding a new caller.
- **No rate limiting anywhere** — `/api/search`, `/api/calendar/ics`, and every server
  action have no request-rate protection.
- **`package.json`'s version field (`0.1.0`) doesn't match the changelog/commit
  messages (`0.1.1`).**
- **`supabase/migrations/` is an empty leftover directory** from an abandoned earlier
  plan — harmless, never cleaned up.
- **No CI workflow** (no `.github/workflows/`).
- **The DB schema (Drizzle) and the app's shared TS types (`src/lib/types/*`) are two
  separate, hand-kept-in-sync shapes** — see `DECISIONS.md`.

## AI working instructions

Future Claude Code sessions (or any AI agent) working in this repo must:

1. Read `CLAUDE.md` (this file) in full.
2. Read `PROJECT_STATE.md`.
3. Read `TASKS.md`.
4. Read whichever of `ARCHITECTURE.md` / `FEATURES.md` / `API_REFERENCE.md` /
   `DATABASE.md` / `UI_SYSTEM.md` / `SECURITY.md` / `DEPLOYMENT.md` is relevant to the
   task at hand.
5. Re-run `npm run typecheck && npm run lint && npm run test` yourself before trusting
   this file's "Testing and verification" section — re-verify, don't just cite it.
6. Check `git log`/`git status` first — this repo now has real git history; use it
   (`git diff`, `git log -p`) instead of guessing what changed.
7. Inspect the affected code directly before changing it.
8. Make small, reviewable changes; commit only when explicitly asked to.
9. Run `npm run typecheck && npm run lint && npm run test && npm run build` after
   changes touching `src/`.
10. Update documentation after meaningful changes (see the permanent rules below).
11. Never claim something works without verification.
12. Never expose secrets (`.env.local` values, Clerk secret key, `DATABASE_URL`) in
    output, commits, or documentation.
13. Never perform destructive database operations (`db:push` against a populated
    database, `DROP TABLE`, etc.) without explicit permission — remember `DATABASE_URL`
    now points at a real, live, schema-pushed database.
14. Never silently replace an existing architectural pattern without it being the
    explicit point of the task.
15. Record unresolved uncertainty in the relevant memory file rather than guessing.

## Permanent rules for future development

**After every meaningful coding task:**
1. Update `PROJECT_STATE.md` with the new exact stopping point.
2. Update `TASKS.md` (move/close tasks, add new ones discovered).
3. Append an entry to `SESSION_LOG.md` (append — never overwrite prior entries).
4. Update whichever of `FEATURES.md` / `ARCHITECTURE.md` / `API_REFERENCE.md` /
   `DATABASE.md` / `TESTING.md` / `DEPLOYMENT.md` / `SECURITY.md` is affected.
5. Remove or correct stale information you notice, even if unrelated to your task —
   note what you changed and why in `SESSION_LOG.md`.
6. Record meaningful architectural decisions in `DECISIONS.md`.
7. Run the verification commands listed above.
8. Clearly record anything not verified rather than implying full verification.
9. Treat this repository's memory files as the permanent source of project memory.

**Before every meaningful coding task:**
1. Read `CLAUDE.md`.
2. Read `PROJECT_STATE.md`.
3. Read `TASKS.md`.
4. Read the relevant technical documentation file(s).
5. Run `git log --oneline` / `git status` and compare against what `PROJECT_STATE.md`
   describes.
6. Inspect the specific files you're about to change.
7. Confirm the requested work isn't already done (check `TASKS.md` "Recently
   completed" and the actual code).
8. Preserve unrelated work.
9. Identify risks before modifying anything listed under "DO NOT CHANGE WITHOUT
   REVIEW" above.
