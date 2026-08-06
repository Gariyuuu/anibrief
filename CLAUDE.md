# CLAUDE.md — Operating Manual for AniBrief

> **SECOND, LARGER wave of concurrent change observed after this
> audit's snapshot was locked:** by ~06:15 MST (while this
> documentation was still being written), the repo had grown from ~90
> to ~176 files, gaining a home page, most nav routes, most
> `/api/cron/*` routes, real tests, and a real `.env.example` — several
> specific claims below (no home page, no tests, no `.env.example`, no
> cron routes) are very likely **already false**. See
> `PROJECT_STATE.md`'s "ADDENDUM" section and `SESSION_LOG.md`'s
> addendum entry before trusting specifics in this file. A fresh audit
> pass is recommended before relying on this file's "Current status."

> **Audit note (2026-08-06):** This file (and the 16 sibling memory files
> it references) were produced by a documentation-audit pass. During that
> audit, this repository was observed under **active, continuous
> concurrent modification by a separate process** for the entire session
> (roughly 05:49–05:59 MST) — an auth layer, database layer, AI layer,
> and ~30 UI/component/action files were added live while the audit was
> being written. Nothing in this file was invented: every claim below was
> verified against the repository content at the final snapshot taken at
> **2026-08-06 05:59:28 MST**. But because the repo was a moving target,
> **re-verify file counts, lint/typecheck results, and route lists before
> relying on specifics** — see `PROJECT_STATE.md` for the full account.
> No application behavior was intentionally changed by the audit itself;
> see `SESSION_LOG.md` for exactly what was and wasn't touched.

## Project identity

**AniBrief** is a Next.js web app: "a daily briefing terminal for anime,
manga, Japanese music, voice-actor news, episode tracking, and
discovery" (per `src/app/manifest.ts` and `layout.tsx` metadata). It
aggregates data from AniList, Jikan/MyAnimeList, Google News RSS, and
YouTube into a personalized daily brief, episode calendar, news feed,
and watch/read list, with optional AI-generated summaries.

Working directory for all commands: `/Users/gariyuu/Projects/anibrief`.

Comment markers throughout the code (`per spec §5`, `§9`, `§21`, `§22`,
`§25`, `§42`, etc.) reference an external product spec that is **not
present in this repository** — it could not be located anywhere under
`anibrief/`. Treat those section numbers as evidence of intent, not as
something you can open and read.

## Current status

As of the final audit snapshot (2026-08-06 05:59 MST), AniBrief is
**early-stage / actively under construction**, not deployed, not
runnable as a real product yet:

- **No git history.** `anibrief/` has no `.git` of its own. The nearest
  repository is the parent `~/Projects` folder, which itself has zero
  commits — the entire `anibrief/` tree is untracked, uncommitted
  content. There is no way to `git diff`/`git log` this project's history.
- **No deployed instance.** No evidence of a live URL anywhere in the
  repo (no Vercel project link, no README with a URL).
- **Zero user-facing pages exist** except Clerk's default
  `/sign-in/[[...sign-in]]` and `/sign-up/[[...sign-up]]`. There is no
  `src/app/page.tsx` (home page), and none of the 15 routes declared in
  `src/lib/nav.ts` (`/daily-brief`, `/news`, `/airing`, `/seasonal`,
  `/anime`, `/manga`, `/music`, `/people`, `/calendar`, `/discover`,
  `/my-list`, `/alerts`, `/profile`, `/settings`) have a `page.tsx`.
  There's also no custom `not-found.tsx` or `error.tsx`.
- **A substantial supporting layer already exists** despite the above:
  data providers (AniList, Jikan, MyAnimeList stub, YouTube, news RSS,
  streaming-link derivation, curated music), a full Drizzle/Neon schema
  (18 tables), Clerk auth wiring (root layout, proxy/middleware,
  sign-in/up pages), an AI summary layer (Anthropic/OpenAI, with
  template fallback), a component library (`ui/`, `layout/`, `home/`,
  `anime/`, `news/`, `actions/`), and several Clerk-gated server actions
  for lists/alerts/follows/profile. None of it is reachable by a real
  user yet because there's no page to render it.
- **`lint` currently fails** (5 errors, 3 warnings) as of the final
  snapshot — all in files added during the concurrent build (see
  `TESTING.md` and `TASKS.md`). **`typecheck` passes clean.** `build`
  was run once during the audit and succeeded, but see the "DO NOT
  CHANGE WITHOUT REVIEW" note below about running `build` again.
- **No tests exist.** `npm test` runs a glob that currently matches zero
  files (0/0/0 pass/fail/skip — not a failure, just empty).
- **No `.env.example`** exists anywhere in the repo, despite
  `.gitignore` special-casing `!.env.example`. Environment variables are
  documented only in code comments and in this file.

## Technology stack

Versions below are copied verbatim from `package.json` at the final
snapshot — do not assume newer/older versions without re-checking.

- **Framework:** Next.js `16.2.11`, App Router, Turbopack (default dev/build
  engine per the build output). `AGENTS.md` explicitly warns this Next.js
  version has **breaking changes vs. what you may know** — most notably
  `middleware.ts` is renamed to `proxy.ts` (exported function `proxy`,
  see `src/proxy.ts`). Read `node_modules/next/dist/docs/` before
  assuming standard Next.js behavior.
- **UI:** React `19.2.4`, React DOM `19.2.4`.
- **Language:** TypeScript `^5`, `strict: true` (see `tsconfig.json`).
- **Styling:** Tailwind CSS `^4` via `@tailwindcss/postcss`, CSS custom
  properties for theming (`src/app/globals.css`).
- **Auth:** `@clerk/nextjs ^7.6.5`.
- **Database:** `@neondatabase/serverless ^0.10.4` (Neon Postgres, HTTP
  driver) + `drizzle-orm ^0.36.4` + `drizzle-kit ^0.28.1` (dev).
- **AI:** `@anthropic-ai/sdk ^0.112.5`, `openai ^6.48.0` — dual-provider,
  optional, template-fallback if neither key is set.
- **Email:** `resend ^6.18.0` is a dependency but has **zero references**
  anywhere in `src/` — installed, not integrated.
- **News ingestion:** `rss-parser ^3.13.0` (Google News RSS, no key).
- **Dates:** `date-fns ^4.4.0`, `date-fns-tz ^3.2.0`.
- **Icons:** `lucide-react ^1.25.0`.
- **Validation:** `zod ^4.4.3` is a dependency but has **zero usages**
  anywhere in `src/` — server actions currently take raw typed objects
  with no runtime validation (see `SECURITY.md`).
- **Utility:** `clsx ^2.1.1` + `tailwind-merge ^3.6.0` (via `cn()`),
  `server-only ^0.0.1` (marks server-only modules).
- **Lint:** ESLint `^9`, flat config, `eslint-config-next 16.2.11`.

## Essential commands

Run all commands from `/Users/gariyuu/Projects/anibrief`.

```bash
npm run dev         # next dev (Turbopack) — NOT verified this session
npm run build        # next build — verified once; see caution below
npm run start         # next start — not verified this session
npm run lint          # eslint — verified: 5 errors, 3 warnings (final snapshot)
npm run typecheck     # tsc --noEmit — verified: passes clean
npm run test           # node --experimental-strip-types --test src/**/__tests__/**/*.test.ts
                        #   verified: 0 tests found (no __tests__ dirs exist)
npm run db:generate     # drizzle-kit generate — added by the concurrent build; not exercised this session
npm run db:push         # drizzle-kit push — NOT run this session (would need a real DATABASE_URL; do not run against a real DB without permission)
npm run db:studio        # drizzle-kit studio — not run this session
```

**Caution on `npm run build`:** during this audit, running `build` was
immediately followed by a large amount of new application code
appearing in the working tree (Clerk auth wiring, `.env.local`, the
Neon/Drizzle layer, `package.json` dependency changes). The audit's
working theory, after observation, is that this was a **separate
concurrent process/agent actively building the app in parallel**, not a
side effect of `build` itself — but this was never conclusively proven
(no way to attribute file-write ownership on this machine from inside
the session). Because of that ambiguity: **do not assume `build` is a
side-effect-free command in this repo.** If you run it, check
`git status`-equivalent (a file-timestamp diff, since there's no git
history to compare against) immediately before and after.

## Repository structure

```
anibrief/
├── AGENTS.md                # Breaking-changes warning for this Next.js version; @-included by CLAUDE.md
├── CLAUDE.md                 # This file
├── PROJECT_STATE.md, TASKS.md, ARCHITECTURE.md, FILE_MAP.md, FEATURES.md,
│   ROADMAP.md, DECISIONS.md, DATABASE.md, API_REFERENCE.md, UI_SYSTEM.md,
│   SECURITY.md, TESTING.md, DEPLOYMENT.md, CHANGELOG.md, SESSION_LOG.md,
│   HANDOFF.md                # This audit's memory files (all in repo root)
├── package.json / package-lock.json
├── tsconfig.json, eslint.config.mjs, postcss.config.mjs, next.config.ts
├── vercel.json                # 7 cron job declarations (see DEPLOYMENT.md — targets don't exist yet)
├── drizzle.config.ts           # drizzle-kit config
├── drizzle/                    # Generated migration (0000_silly_captain_stacy.sql) + meta
├── .env.local                  # Clerk keys only (6 vars) — see "Environment setup"
├── public/                     # Empty — zero static assets
├── supabase/migrations/         # Empty directory — vestige of an earlier (abandoned) Supabase plan; package.json no longer depends on @supabase/*
└── src/
    ├── app/
    │   ├── layout.tsx           # Root layout: ClerkProvider, AppShell, theme-init script, fonts, metadata
    │   ├── globals.css           # Theme tokens (accent system, light/dark)
    │   ├── manifest.ts, icon.tsx, apple-icon.tsx, opengraph-image.tsx, pwa-icon/{192,512}/route.tsx
    │   ├── api/search/route.ts    # The only real API route: GET, AniList search proxy
    │   └── sign-in/[[...sign-in]]/page.tsx, sign-up/[[...sign-up]]/page.tsx  # Clerk defaults
    │       # NOTE: no page.tsx for "/" or any of nav.ts's 15 routes
    ├── proxy.ts                   # Next 16's middleware convention; wraps clerkMiddleware()
    ├── components/
    │   ├── ui/                    # Button, Card, Badge, Avatar, Skeleton, EmptyState, ErrorState, Tabs
    │   ├── layout/                # AppShell, NavLinks, MobileNav, CommandPalette, ThemeToggle, AccentPicker
    │   ├── brand/                  # Logo, Mark (SVG)
    │   ├── home/                    # HeroBrief, StatTile, EpisodeTimeline, TrendingList, BirthdayStrip
    │   ├── anime/                   # AnimeCard, AnimeGrid
    │   ├── news/                     # NewsCard, NewsList
    │   └── actions/                  # AddToListButton, RemindMeButton (client components wrapping server actions)
    └── lib/
        ├── ai/                        # AIProvider interface, Anthropic + OpenAI implementations, provider selection
        ├── actions/                    # "use server" Clerk-gated CRUD: animeList, mangaList, alerts, follows, profile
        ├── briefing/                    # buildBriefing, getTodaysBriefing, store (Neon or in-memory)
        ├── db/                           # client.ts (lazy Drizzle/Neon client) + schema/ (18 tables across 5 files)
        ├── dedup/                        # clusterNews, textSimilarity (Jaccard) — news deduplication
        ├── providers/                     # anilist/, jikan/, mal/, music/, news/, streaming/, youtube/, types.ts
        ├── types/                          # Shared TS contracts: media, person, news, music, briefing, calendarEvent, userList
        ├── utils/                          # cn, dates, logger, retry
        ├── nav.ts                          # Nav item declarations (15 routes) — the source of truth for intended IA
        └── theme.ts                        # 7 accent theme definitions + localStorage keys
```

## Architecture summary

Server-first Next.js App Router app. Data providers under
`src/lib/providers/*` are all `import "server-only"` and call external
APIs directly (AniList GraphQL, Jikan REST, Google News RSS, YouTube
Data API) with retry/backoff (`src/lib/utils/retry.ts`) and Next's
`fetch` cache (`next: { revalidate }`) rather than a database cache.
User-generated data (lists, alerts, follows, profile, saved news,
calendar reminders) is meant to live in Neon Postgres via Drizzle, keyed
by Clerk's `userId` — but every write path first checks
`isDatabaseConfigured()` and degrades to either an in-memory `Map`
(briefing store only) or a thrown user-facing error (list/alert/follow/
profile actions) when `DATABASE_URL` is unset, which it currently is.
Auth is Clerk end-to-end: `proxy.ts` (middleware) + `ClerkProvider` in
the root layout + `SignedIn`/`SignedOut`/`useUser()` in client
components + `auth()` in server actions. See `ARCHITECTURE.md` for the
full diagram and request lifecycle.

## Coding conventions

**Verified (observed consistently across the existing code):**
- Every provider module starts with `import "server-only";` and never
  throws to its caller — failures are caught, logged via
  `src/lib/utils/logger.ts` (structured JSON to console), and a safe
  empty/`null` fallback is returned instead.
- Providers expose a `configured` boolean/getter so callers can render a
  clear "not configured" state instead of a runtime crash
  (`src/lib/providers/types.ts`'s `ProviderResult`, `ok()`/`fail()`
  helpers — though not every provider actually returns this shape; check
  each one).
- Server actions (`src/lib/actions/*.ts`, `"use server"`) each start with
  a local `requireUser()` that throws a **user-readable** error message
  (not a generic 500) when unauthenticated or when the DB isn't
  configured, then call `revalidatePath()` on success.
- Components use `cn()` (`clsx` + `tailwind-merge`) for conditional
  classes, never raw template-string class concatenation.
- Money-shot UI primitives live in `src/components/ui/` and are the only
  place Tailwind variant maps are defined — feature components compose
  them rather than redefining button/card styling.
- No CSS-in-JS; all styling is Tailwind utility classes + the CSS custom
  properties in `globals.css`.

**Recommended (not yet consistently enforced — flag if you see a
deviation, don't assume it's a rule):**
- Given `zod` is a dependency but unused, and server actions currently
  trust their TypeScript input types at the boundary (no runtime
  validation), adding `zod` parsing to each server action's input before
  it reaches the DB would match the apparent intent of having it
  installed. This is not yet a repo convention, just a gap.

## UI and design system

See `UI_SYSTEM.md` for full detail. Key files:
- `src/app/globals.css` — CSS custom property tokens (`--background`,
  `--surface`, `--accent`, etc.), 7 accent-theme variants keyed by
  `[data-accent="..."]`, dark mode via `.dark` class + Tailwind's
  `@custom-variant dark`.
- `src/lib/theme.ts` — the 7 accent options (`sakura` default,
  `midnight`, `ocean`, `ember`, `matcha`, `violet`, `monochrome`),
  `localStorage` keys (`anibrief-accent`, `anibrief-theme`).
- `src/components/ui/*` — Button (supports `href` → renders `Link`),
  Card, Badge (4 tones), Avatar (image or initial fallback), Skeleton,
  EmptyState, ErrorState (distinguishes "not configured" vs. "fetch
  failed"), Tabs.
- `src/components/brand/Mark.tsx` — original SVG logomark (folded page +
  play-triangle/eye), documented in-code as "not derived from any
  existing anime-site logo."

## Environment setup

**No `.env.example` exists in the repo.** The list below was
reconstructed from `process.env.*` references in the code and from
`.env.local`'s key names (values were never read/printed during this
audit — only key names, via a redacting `sed` command).

| Variable | Required? | Client/Server | Purpose | Placeholder |
|---|---|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Required (Clerk won't init without it) | Client | Clerk publishable key | `pk_test_xxxxxxxx` |
| `CLERK_SECRET_KEY` | Required | Server | Clerk backend secret | `sk_test_xxxxxxxx` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Optional (Clerk default used otherwise) | Client | Sign-in route override | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Optional | Client | Sign-up route override | `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Optional | Client | Post-sign-in redirect | `/` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Optional | Client | Post-sign-up redirect | `/` |
| `DATABASE_URL` | Optional — but every DB feature is inert without it | Server | Neon Postgres connection string | `postgres://user:pass@host/db` |
| `ANTHROPIC_API_KEY` | Optional | Server | Enables Anthropic AI briefing summaries | `sk-ant-xxxxxxxx` |
| `ANTHROPIC_MODEL` | Optional (default `claude-sonnet-5`) | Server | Override Anthropic model id | `claude-sonnet-5` |
| `OPENAI_API_KEY` | Optional | Server | Enables OpenAI AI briefing summaries (`AI_PROVIDER=openai`) | `sk-xxxxxxxx` |
| `OPENAI_MODEL` | Optional (default `gpt-4o-mini`) | Server | Override OpenAI model id | `gpt-4o-mini` |
| `AI_PROVIDER` | Optional (default `anthropic`) | Server | `"anthropic"` \| `"openai"` | `anthropic` |
| `YOUTUBE_API_KEY` | Optional | Server | Enables trailer/PV search; returns `[]` without it | `AIzaSy...` |
| `MAL_CLIENT_ID` | Optional, currently no-op | Server | Gates `MyAnimeListProvider`, whose methods are stubs regardless | `mal_client_xxxxxxxx` |
| `NEXT_PUBLIC_APP_URL` | Optional (defaults to `http://localhost:3000`) | Client | `metadataBase` for OG images | `https://anibrief.example.com` |

**Not present but implied by a dependency:** a Resend API key
(`resend` is installed) — no such variable is actually read anywhere in
`src/`, so there is nothing to configure for it yet.

`.env.local` at the final snapshot contained exactly the 6 Clerk
variables above (confirmed by key name only, values never inspected) —
**no `DATABASE_URL`, no AI keys, no `YOUTUBE_API_KEY`** are configured
in this environment, meaning the DB and AI layers are wired in code but
functionally inert right now.

## Database summary

Neon Postgres (serverless HTTP driver) via Drizzle ORM. 18 tables across
5 schema files under `src/lib/db/schema/`. Zero rows/deployment exist —
`DATABASE_URL` is unset, and `npm run db:push` was never run this
session. A migration (`drizzle/0000_silly_captain_stacy.sql`) has been
*generated* but not *applied* anywhere. Full detail, including every
table and its columns, is in `DATABASE.md`.

## Authentication and authorization

Clerk (`@clerk/nextjs`). `src/proxy.ts` wraps `clerkMiddleware()`.
`ClerkProvider` sits at the root of `layout.tsx`. There is **no custom
role/permission system** beyond Clerk's own signed-in/signed-out state —
a `profiles.isAdmin` boolean column exists in the DB schema but nothing
in the code reads or enforces it anywhere (no admin route, no admin
check). Treat any "admin" surface as schema-only/planned. See
`SECURITY.md` for the full authz review.

## API and integrations

One real API route: `GET /api/search` (AniList search proxy for the
command palette). Everything else is either a Next.js file-convention
route (icons, manifest, OG image — not really "APIs") or a server
action. External integrations: AniList GraphQL (no key), Jikan REST (no
key, self-throttled), Google News RSS (no key), YouTube Data API v3
(key-gated), Anthropic/OpenAI (key-gated, template fallback). Full
detail in `API_REFERENCE.md` and `FEATURES.md`.

## Testing and verification

- `npm run typecheck` — **passes clean** (verified twice this session,
  once against the original ~37-file scaffold and once against the
  final ~90-file snapshot).
- `npm run lint` — **passed clean against the original scaffold**, but
  **fails with 5 errors + 3 warnings against the final snapshot** (all
  in files added by the concurrent build during this session — see
  `TESTING.md`).
- `npm run test` — 0 tests found, 0 pass/fail (no `__tests__` files
  exist anywhere).
- `npm run build` — run once, succeeded, but see the caution above about
  its observed side effects. Not re-run after the final snapshot to
  avoid further disturbing an already-fast-moving working tree.
- No E2E, no component tests, no CI workflow files found anywhere in the
  repo (no `.github/workflows/`).

## Deployment

`vercel.json` declares 7 cron jobs (`/api/cron/refresh-airing`,
`/api/cron/refresh-news`, `/api/cron/refresh-seasonal`,
`/api/cron/birthdays`, `/api/cron/trend-snapshot`,
`/api/cron/daily-brief`, `/api/cron/notifications`) — **none of these
routes exist in the codebase.** If deployed to Vercel as-is, every cron
invocation would 404. No other Vercel config (no `vercel link`
evidence, no project ID found). See `DEPLOYMENT.md`.

## DO NOT CHANGE WITHOUT REVIEW

1. **`src/proxy.ts` and Clerk configuration** — this is the entire
   auth boundary for the app. Changing the matcher or removing
   `clerkMiddleware()` would either lock everyone out or leave every
   route unauthenticated.
2. **`src/lib/db/schema/*`** — 18 tables already have a generated
   migration (`drizzle/0000_silly_captain_stacy.sql`). Changing column
   types/names now, before that migration has ever been applied to a
   real database, is low-risk *today*, but do not assume that stays
   true — check whether `DATABASE_URL` has been pointed at a real,
   possibly-seeded Neon instance before altering schema.
3. **`vercel.json`'s cron schedules** — even though the target routes
   don't exist yet, changing the schedule strings without also creating
   the routes (or vice versa) will silently break whichever side is
   assumed to match.
4. **`.env.local`** — contains real-looking Clerk secret values. Never
   print, log, or copy its contents into any documentation, commit, or
   chat output. This audit only ever read redacted key *names*.
5. **The `isDatabaseConfigured()` / `getAIProvider()` graceful-degradation
   pattern** in `src/lib/db/client.ts` and `src/lib/ai/index.ts` — every
   caller depends on these never throwing when unconfigured (except
   `db()` itself, which throws intentionally and is expected to be
   guarded by `isDatabaseConfigured()` first). Don't "simplify" this to
   assume a key/URL is always present.
6. **`package.json` dependency set** — it changed substantially during
   this session (see `CHANGELOG.md` / `SESSION_LOG.md`). Don't remove
   `@clerk/nextjs`, `@neondatabase/serverless`, `drizzle-orm`, or
   `drizzle-kit` assuming they're unused — they're the entire auth/DB
   layer as of the final snapshot.

## Known issues

- **Lint fails** on the final snapshot: 5 `react-hooks/set-state-in-effect`
  errors (`EpisodeTimeline.tsx`, `AccentPicker.tsx`, `CommandPalette.tsx`
  ×2, `ThemeToggle.tsx`) + 3 unused-import warnings
  (`CommandPalette.tsx`'s `Image`, `lists.ts`'s `primaryKey`,
  `profiles.ts`'s `integer`). See `TESTING.md` and `TASKS.md`.
- **No page renders anything.** `HeroBrief`, `EpisodeTimeline`,
  `TrendingList`, `BirthdayStrip`, `AnimeGrid`, `NewsList` etc. all exist
  and look complete, but nothing in `src/app/` imports or renders them —
  there is no home page. The command palette and nav links point at
  routes with no `page.tsx`.
- **`vercel.json` cron targets don't exist** (see above).
- **`supabase/migrations/` is an empty leftover directory** from an
  apparently-abandoned Supabase plan — `package.json` no longer has
  `@supabase/ssr`/`@supabase/supabase-js` as of the final snapshot (they
  were present at the very start of this session and were replaced by
  the Neon/Drizzle stack partway through). The empty `supabase/` folder
  itself was never cleaned up.
- **`resend` and `zod` are installed but 100% unused** in `src/`.
- **`MyAnimeListProvider`'s methods are unconditionally-`null` stubs**
  regardless of `MAL_CLIENT_ID` — "intentionally unimplemented" per its
  own code comment.
- **`MusicProvider` is hand-curated mock data** (4 real songs, honestly
  labeled `source: "mock"` in the type) — no live Spotify/MusicBrainz
  integration.
- **No `.env.example`** — the env var table in this file is the only
  in-repo documentation of what to configure.
- **This repo has no git history of its own** — see "Current status."
- **The DB schema (Drizzle) and the app's shared TS types
  (`src/lib/types/*`) are two separate, hand-kept-in-sync shapes** (e.g.
  enums are plain `text()` columns in Drizzle, not derived from the TS
  union types) — a future schema change could silently drift from the
  type layer with no compiler error. See `DECISIONS.md`.

## AI working instructions

Future Claude Code sessions (or any AI agent) working in this repo must:

1. Read `CLAUDE.md` (this file) in full.
2. Read `PROJECT_STATE.md`.
3. Read `TASKS.md`.
4. Read whichever of `ARCHITECTURE.md` / `FEATURES.md` /
   `API_REFERENCE.md` / `DATABASE.md` / `UI_SYSTEM.md` / `SECURITY.md` /
   `DEPLOYMENT.md` is relevant to the task at hand.
5. Re-run `npm run typecheck` and `npm run lint` yourself before trusting
   this file's "Testing and verification" section — the repo may have
   changed again since this audit (see the concurrent-modification note
   at the top of this file).
6. Inspect the affected code directly before changing it — do not trust
   a memory file's description of a function's exact behavior over
   reading the function itself.
7. Check for uncommitted/untracked state before modifying files — recall
   there is no git repo local to `anibrief/` itself, so "uncommitted"
   effectively means "everything," and there is no diff/undo safety net.
8. Avoid overwriting unrelated work — especially plausible here, given
   evidence of concurrent development during this very audit.
9. Make small, reviewable changes.
10. Run `npm run typecheck && npm run lint && npm run build` after
    changes touching `src/` — but read the build caution above first.
11. Update documentation after meaningful changes (see the permanent
    rules below).
12. Never claim something works without verification — "it typechecks"
    is not the same claim as "it renders in a browser," which is not the
    same claim as "a real user flow works end-to-end." Say which one you
    mean.
13. Never expose secrets (`.env.local` values, Clerk secret key, any
    future `DATABASE_URL`) in output, commits, or documentation.
14. Never modify production data — there is no evidence of a production
    database yet, but if one is ever configured, treat it as real.
15. Never perform destructive database operations (`db:push` against a
    populated database, `DROP TABLE`, etc.) without explicit permission.
16. Never silently replace an existing architectural pattern (e.g. the
    Clerk+Neon+Drizzle stack, the provider graceful-degradation pattern)
    with a new one without it being the explicit point of the task —
    note that this exact kind of silent replacement (Supabase → Clerk/
    Neon/Drizzle) appears to have already happened once during this very
    session; see `DECISIONS.md`.
17. Never remove a dependency without a fresh repo-wide search for its
    usages first (`resend` and `zod` are flagged as apparently unused
    above — verify freshly, don't just trust this file).
18. Record unresolved uncertainty in the relevant memory file rather than
    guessing and presenting a guess as fact.

## Permanent rules for future development

**After every meaningful coding task:**
1. Update `PROJECT_STATE.md` with the new exact stopping point.
2. Update `TASKS.md` (move/close tasks, add new ones discovered).
3. Append an entry to `SESSION_LOG.md` (append — never overwrite prior
   entries).
4. Update whichever of `FEATURES.md` / `ARCHITECTURE.md` /
   `API_REFERENCE.md` / `DATABASE.md` / `TESTING.md` / `DEPLOYMENT.md` /
   `SECURITY.md` is affected by the change.
5. Remove or correct stale information you notice, even if unrelated to
   your task — but note what you changed and why in `SESSION_LOG.md`.
6. Record meaningful architectural decisions in `DECISIONS.md`.
7. Run the verification commands listed above.
8. Clearly record anything not verified rather than implying full
   verification.
9. Treat this repository's memory files as the permanent source of
   project memory — chat history will not survive to the next session.

**Before every meaningful coding task:**
1. Read `CLAUDE.md`.
2. Read `PROJECT_STATE.md`.
3. Read `TASKS.md`.
4. Read the relevant technical documentation file(s).
5. Take a fresh file-timestamp inventory (there is no `git status` to
   lean on) and compare it against what `PROJECT_STATE.md` describes.
6. Inspect the specific files you're about to change.
7. Confirm the requested work isn't already done (check `TASKS.md`
   "Recently completed" and the actual code — this repo has a track
   record of gaining large amounts of code between sessions).
8. Preserve unrelated work — never delete files you didn't create
   without first confirming with the user, especially given this
   session's evidence of concurrent development.
9. Identify risks before modifying anything listed under "DO NOT CHANGE
   WITHOUT REVIEW" above.
