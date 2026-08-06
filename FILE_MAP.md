# FILE_MAP.md — Practical Repository Map

> Snapshot: 2026-08-06 05:59:28 MST. Re-verify against a fresh `find`
> before trusting file lists — see `PROJECT_STATE.md`.

## Auth & middleware

### `src/proxy.ts`
Next 16's renamed middleware convention (`AGENTS.md` calls this out
explicitly). Exports `proxy` (default export) wrapping
`clerkMiddleware()`, plus a `matcher` config excluding static asset
extensions and explicitly including `/api` and `/(trpc)` (no tRPC
exists in this repo — likely copied from a Clerk template as-is).
**Edit risk: high** — this is the entire auth boundary.

### `src/app/layout.tsx`
Root layout. Fonts (Geist), metadata (title template, OG defaults),
inline FOUC-avoidance theme script, wraps children in
`ClerkProvider` → `AppShell`. Called by: Next.js router for every route.
Calls: `AppShell`, `defaultAccent` from `lib/theme.ts`.
**Edit risk: medium** — touches every page.

## Layout & navigation (`src/components/layout/`)

### `AppShell.tsx`
The visible chrome: sidebar, mobile drawer, header, `CommandPalette`,
`MobileNav`. Called by `layout.tsx`. Calls `NavLinks`, `MobileNav`,
`ThemeToggle`, `AccentPicker`, `CommandPalette`, `Logo`, `Button`, and
Clerk's `SignedIn`/`SignedOut`/`SignInButton`/`UserButton`.
**Edit risk: medium** — one bug here breaks every page's chrome.

### `NavLinks.tsx` / `MobileNav.tsx`
Read `src/lib/nav.ts`'s `navItems`/`mobileNavItems`. Highlight active
route via `usePathname()`. **Edit risk: low.**

### `CommandPalette.tsx`
⌘K/`/`-triggered overlay. Debounced fetch to `/api/search`. "g then
<letter>" shortcuts read from `navItems[].shortcut`. Has an unused
`Image` import (lint warning) — uses `<img>` instead, with an
eslint-disable comment, for the search-result thumbnails.
**Edit risk: low**, but it's the only client-side data-fetching
component in the repo — check `/api/search`'s contract before changing
its response shape.

### `ThemeToggle.tsx` / `AccentPicker.tsx`
Toggle `.dark` class / `data-accent` attribute on `<html>`, persist to
`localStorage` (`THEME_STORAGE_KEY`/`ACCENT_STORAGE_KEY` from
`lib/theme.ts`). Both currently trigger the `react-hooks/set-state-in-effect`
lint error (calling `setState` synchronously in a bare `useEffect`).
**Edit risk: low**, good first fix target (see `TASKS.md` T-001).

## Data providers (`src/lib/providers/`)

### `anilist/` (client.ts, index.ts, mappers.ts, queries.ts, rawTypes.ts)
The primary data source. `client.ts` — raw GraphQL POST + retry +
error handling. `queries.ts` — every GraphQL query string used.
`rawTypes.ts` — AniList's raw response shapes. `mappers.ts` — raw → app
types (`NormalizedMedia`, `NormalizedPerson`). `index.ts` —
`AniListProvider`, the public interface (`searchMedia`, `getMediaById`,
`browse`, `getAiringBetween`, `getStaffBirthdaysToday`,
`getCharacterBirthdaysToday`, `getStaffById`, `searchStaff`). Called by:
`/api/search`, `buildBriefing.ts`. **Edit risk: high** — nearly every
feature depends on this; changing `mappers.ts` output shape ripples
everywhere `NormalizedMedia`/`NormalizedPerson` is consumed.

### `jikan/index.ts`
Supplementary-only MAL data via the public Jikan API. Self-throttled
in-process queue (~1 req/s). Currently only exposes
`getRankingByMalId` — **not called from anywhere else in the repo yet**
(no consumer found). **Edit risk: low.**

### `mal/index.ts`
Stub. `configured` checks `MAL_CLIENT_ID`; both methods
(`getRanking`, `exchangeAuthCode`) return `null` unconditionally,
documented in-code as "intentionally unimplemented." **Edit risk:
low** (nothing depends on real output yet).

### `news/index.ts` + `reliability.ts`
`NewsFeedProvider` — Google News RSS across 8 categories, in-code
query registry (`CATEGORY_QUERIES`). `reliability.ts` — allowlist of
~22 known outlets (`classifyReliability`) + rumor-keyword detector
(`looksLikeRumor`). Called by `buildBriefing.ts`. **Edit risk:
medium** — the query registry directly controls what "counts" as news;
changing categories affects `src/lib/types/news.ts`'s `NewsCategory`
union too (keep them in sync manually — no shared source of truth).

### `streaming/index.ts`
Pure function (`getStreamingAvailability`) — filters a `NormalizedMedia`'s
`externalLinks` against a hardcoded `KNOWN_STREAMING_SITES` set. No
network call of its own. Called by `EpisodeTimeline.tsx`. **Edit risk:
low.**

### `music/index.ts`
`MusicProvider.getCuratedReleases()` — 4 hand-curated real OP/ED
entries, `configured: false`. **Edit risk: low** — not called from
anywhere yet (no consumer found in the current snapshot).

### `youtube/index.ts`
`YouTubeProvider.searchTrailers()` — real YouTube Data API v3 call,
gated on `YOUTUBE_API_KEY`. **Edit risk: low** — not called from
anywhere yet (no consumer found).

### `types.ts`
Shared `ProviderResult<T>`/`ProviderHealth` shapes + `ok()`/`fail()`
helpers. **Not actually used by any provider in the current
snapshot** — every provider instead does its own try/catch-and-fallback
inline rather than returning `ProviderResult`. Treat this file as an
established-but-unadopted convention.

## News deduplication (`src/lib/dedup/`)

### `clusterNews.ts` / `textSimilarity.ts`
Jaccard-similarity (`textSimilarity.ts`, stopword-filtered token sets)
+ URL-normalization + 72-hour time window to group articles covering
the same event (`clusterNews.ts`). Not currently called from anywhere
in the snapshot (no consumer found — `buildBriefing.ts` uses raw
`NewsFeedProvider.fetchAll()` output, not clustered). **Edit risk:
low**, but note it's dead code as of this snapshot.

## AI summarization (`src/lib/ai/`)

### `types.ts`, `anthropic.ts`, `openai.ts`, `index.ts`
`AIProvider` interface (`name`, `complete()`). `AnthropicProvider`/
`OpenAIProvider` each wrap their SDK's chat/completion call.
`getAIProvider()` (in `index.ts`) picks one based on `AI_PROVIDER` env
var, returns `null` (cached) if the corresponding key is missing.
Called only by `buildBriefing.ts`. **Edit risk: low** — isolated,
single consumer, already has a safe fallback path.

## Briefing (`src/lib/briefing/`)

### `buildBriefing.ts`
`buildDailyBriefing(date)` — fans out to AniList (today/tomorrow airing,
trending, birthdays) + news in parallel, builds a deterministic
`templateSummary`, optionally upgrades it to an AI-generated paragraph
via `getAIProvider()`. Returns a `DailyBriefing`. **Edit risk:
medium** — the AI prompt hard-codes "use only these facts" guardrails;
changing the fact set passed in without updating the prompt risks the
AI inventing numbers.

### `store.ts`
`saveBriefing`/`getBriefing`/`listBriefingDates`/`isStale` — Neon-backed
when `DATABASE_URL` set, else an in-process `Map` (lost on
cold-start/restart). **Edit risk: medium** — the in-memory fallback
means "today's briefing" can be rebuilt multiple times per day across
serverless cold starts even though `isStale`'s 20-minute window intends
to prevent that.

### `getTodaysBriefing.ts`
Thin cache-or-rebuild wrapper combining the two files above. **Not
currently called from anywhere** (no page renders it yet). **Edit risk:
low.**

## Database (`src/lib/db/`)

### `client.ts`
Lazy Neon+Drizzle singleton, `isDatabaseConfigured()` gate, throws with
a descriptive message if `db()` is called without `DATABASE_URL`.
**Edit risk: high** — every persistence feature depends on this
contract (check-before-call).

### `schema/{profiles,lists,alerts,briefing,admin}.ts` + `schema/index.ts`
18 `pgTable` definitions total, re-exported from `index.ts` (which
`drizzle.config.ts` points at for migration generation). See
`DATABASE.md` for the full table list. **Edit risk: high** — a
migration has already been generated against the current shape
(`drizzle/0000_silly_captain_stacy.sql`); changing a schema file without
regenerating (`npm run db:generate`) will desync code from migration.

## Server actions (`src/lib/actions/`)

### `animeList.ts`, `mangaList.ts`, `alerts.ts`, `follows.ts`, `profile.ts`
All `"use server"`, all share the `requireUser()` pattern (Clerk
`auth()` + `isDatabaseConfigured()` check, throws a user-readable error
on failure), all call `revalidatePath()` on the relevant (currently
nonexistent) page route after a write. Called by the matching
`src/components/actions/*` client buttons (for `animeList`/`alerts`) —
`mangaList.ts`, `follows.ts`, and `profile.ts` have **no UI consumer
yet** in this snapshot. **Edit risk: medium** — these are the only
write path into Neon; changing their signatures requires updating every
caller.

## Server action UI (`src/components/actions/`)

### `AddToListButton.tsx`, `RemindMeButton.tsx`
Client components: Clerk `useUser()` gate → `SignInButton` if signed
out, else a `useTransition`-wrapped call into the matching server
action with inline error display. **Edit risk: low.**

## UI primitives (`src/components/ui/`)

`Button` (supports `href` → renders `Link`), `Card`, `Badge` (4 tones),
`Avatar` (image or initial fallback), `Skeleton`, `EmptyState`,
`ErrorState` (`not_configured` vs. `fetch_failed`), `Tabs`. All
presentational, no data fetching, all built on `cn()`.
**Edit risk: low individually, high in aggregate** — nearly every
feature component imports from here; a visual regression here is
repo-wide.

## Feature components

- `src/components/home/` — `HeroBrief`, `StatTile`, `EpisodeTimeline`,
  `TrendingList`, `BirthdayStrip`. Built for a home page that doesn't
  exist yet. `EpisodeTimeline` has the other
  `react-hooks/set-state-in-effect` lint error.
- `src/components/anime/` — `AnimeCard`, `AnimeGrid` (grid + empty
  state).
- `src/components/news/` — `NewsCard`, `NewsList` (list + empty state).
- `src/components/brand/` — `Logo`, `Mark` (original SVG mark).

## App-router file-convention routes (`src/app/`)

- `layout.tsx` — see above.
- `globals.css` — theme tokens.
- `manifest.ts`, `icon.tsx`, `apple-icon.tsx`, `opengraph-image.tsx`,
  `pwa-icon/{192,512}/route.tsx` — all `next/og`/metadata-convention
  files, all generate images procedurally (no static assets).
- `api/search/route.ts` — the one real API route.
- `sign-in/[[...sign-in]]/page.tsx`, `sign-up/[[...sign-up]]/page.tsx` —
  Clerk's default hosted UI, mounted at catch-all routes.
- **No `page.tsx` at any other path.**

## Configuration files

| File | Purpose | Edit risk |
|---|---|---|
| `next.config.ts` | `images.remotePatterns` (3 hosts) | Low |
| `tsconfig.json` | Strict TS, `@/*` → `src/*` path alias | Medium |
| `eslint.config.mjs` | Flat config, `eslint-config-next` | Low |
| `postcss.config.mjs` | `@tailwindcss/postcss` plugin | Low |
| `drizzle.config.ts` | Points at `src/lib/db/schema/index.ts`, `dialect: "postgresql"`, safe placeholder DB URL fallback | Medium |
| `vercel.json` | 7 cron declarations (targets don't exist) | Medium — declares infra with no implementation |
| `.gitignore` | Standard Next.js ignores + `.env*` (except `.env.example`, which doesn't exist) | Low |

## Where to make common changes

- **Add a new page/route:** create `src/app/<route>/page.tsx` (Server
  Component by default). For a route already in `src/lib/nav.ts`, reuse
  that `href`. Wire data via the relevant provider(s) directly (no data
  layer indirection exists beyond the providers themselves and
  `briefing/`).
- **Change auth behavior:** `src/proxy.ts` (route matching) and
  `layout.tsx`'s `ClerkProvider` (global config). Per-component gating
  uses `SignedIn`/`SignedOut`/`useUser()` (client) or `auth()` (server).
- **Change the DB schema:** edit the relevant file under
  `src/lib/db/schema/`, then run `npm run db:generate` to produce a new
  migration (do not hand-edit `drizzle/*.sql`). Never run `db:push`
  against a real database without explicit permission.
- **Add an env var:** reference it via `process.env.X` in a
  `server-only`-marked module if it's a secret, or prefix with
  `NEXT_PUBLIC_` if the client needs it. Document it in `CLAUDE.md`'s
  env var table (there's no `.env.example` to update — consider adding
  one).
- **Change styling/theme:** CSS custom properties + accent variants in
  `src/app/globals.css`; the accent option list in `src/lib/theme.ts`.
  Component-level styling is Tailwind utility classes; shared variants
  live in `src/components/ui/*`.
- **Change deployment/cron config:** `vercel.json`. Remember: adding a
  cron schedule here does nothing until the matching
  `src/app/api/cron/<name>/route.ts` exists.
- **Add a new external integration:** follow the existing provider
  pattern — new file under `src/lib/providers/<name>/`, `import
  "server-only"`, a `configured` getter, methods that never throw
  (catch + log + safe fallback), consumed by a Server Component or by
  `buildBriefing.ts`.
