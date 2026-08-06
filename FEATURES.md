# FEATURES.md — Feature-by-Feature Status

> Snapshot: 2026-08-06 05:59:28 MST. Status classifications per the
> audit's scale: Verified complete / Mostly complete / Partially
> implemented / UI only / Backend only / Mocked / Planned / Broken /
> Deprecated / Unable to verify.

## Daily Brief (home-page briefing)

**Status: Partially implemented — backend + components complete, zero
routes.** No page renders this feature; it cannot be reached by a user.

- **Purpose:** A single daily summary — episodes airing today, top
  news, trending titles, birthdays — with an optional AI-written
  editorial intro.
- **User flow (intended):** Land on `/` → see `HeroBrief` (greeting +
  AI-or-template summary + stat tiles) → `EpisodeTimeline`,
  `TrendingList`, `BirthdayStrip` below.
- **Frontend files:** `src/components/home/{HeroBrief,StatTile,
  EpisodeTimeline,TrendingList,BirthdayStrip}.tsx` — all exist, all
  typecheck, none are imported by any `page.tsx`.
- **Backend files:** `src/lib/briefing/{buildBriefing,getTodaysBriefing,
  store}.ts`.
- **DB dependencies:** `briefings` table (Neon) when `DATABASE_URL` set;
  otherwise an in-process `Map` (lost on cold start).
- **External integrations:** AniList (airing, trending, birthdays),
  Google News RSS, optionally Anthropic/OpenAI.
- **Env vars:** none required for the template path; `ANTHROPIC_API_KEY`
  or `OPENAI_API_KEY` (+ `AI_PROVIDER`) to enable the AI summary.
- **Permissions:** none — briefing content is public/anonymous.
- **Validation:** the AI prompt explicitly instructs the model to use
  only supplied facts and not invent numbers; no schema validation on
  the AI's output text itself (it's just inserted as a string).
- **Error/loading/empty states:** `EmptyState`/`ErrorState` primitives
  exist and are used by `AnimeGrid`/`NewsList`/`EpisodeTimeline`, but
  since no page calls `getTodaysBriefing()`, there's no loading skeleton
  wired for the hero/stat-tile section itself.
- **Edge cases handled in code:** zero episodes today (falls back to a
  template sentence), zero news (same), AI call failure (falls back to
  template, logs a warning).
- **Tests:** none.
- **Known issues:** unreachable (no route); `getTodaysBriefing`'s 20-min
  staleness window is undermined by the in-memory fallback's per-instance
  scope on serverless.
- **Remaining work:** create `src/app/page.tsx` calling
  `getTodaysBriefing()` and rendering the home components.

## Anime/manga search (command palette)

**Status: Mostly complete.** The one feature that is actually wired
end-to-end and reachable today (the palette itself, via `AppShell`,
which is mounted by `layout.tsx`, which wraps every route).

- **Purpose:** Fast keyboard-driven search + navigation.
- **User flow:** ⌘K or `/` anywhere → type 2+ chars → debounced fetch to
  `/api/search` → click a result → navigates to `/anime/:id` or
  `/manga/:id` (**these routes don't exist yet**, so this currently
  leads to a 404/default not-found).
- **Frontend files:** `src/components/layout/CommandPalette.tsx`.
- **Backend files:** `src/app/api/search/route.ts` →
  `AniListProvider.searchMedia`.
- **DB dependencies:** none.
- **External integrations:** AniList GraphQL.
- **Env vars:** none.
- **Permissions:** none, public.
- **Validation:** query must be ≥2 chars trimmed, else returns empty
  arrays.
- **Error/loading/empty states:** "No matches" message; no explicit
  loading spinner (relies on fetch latency being low); AbortController
  cancels stale requests.
- **Tests:** none.
- **Known issues:** unused `Image` import (lint warning); navigates to
  nonexistent detail routes.
- **Remaining work:** build `/anime/[id]` and `/manga/[id]` pages.

## Authentication (sign in / sign up / session)

**Status: Mostly complete** — Clerk is fully wired at the
infrastructure level (middleware, provider, hosted pages, header UI),
but **unverified**: no real Clerk keys were confirmed functional (only
key *names* were observed in `.env.local`, values never read/tested),
and no browser session was ever exercised (`npm run dev` was
intentionally not started).

- **Purpose:** User accounts, gating personalization features.
- **User flow:** Click "Sign in" (header, or inline on gated actions) →
  Clerk modal or `/sign-in` page → redirected back per
  `NEXT_PUBLIC_CLERK_*_FALLBACK_REDIRECT_URL`.
- **Frontend files:** `src/app/sign-in/[[...sign-in]]/page.tsx`,
  `sign-up/[[...sign-up]]/page.tsx`, `AppShell.tsx` (header
  `SignedIn`/`SignedOut` UI).
- **Backend files:** `src/proxy.ts`, every server action's
  `requireUser()`.
- **DB dependencies:** `profiles` table (created lazily on first
  `getOrCreateProfile` call — but nothing calls that function yet
  either, see Profile/Settings below).
- **External integrations:** Clerk.
- **Env vars:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`,
  4 optional URL overrides.
- **Permissions:** binary signed-in/signed-out only, no roles.
- **Tests:** none.
- **Known issues:** unverified end-to-end (no live test performed this
  session, per the task's "no dev server" constraint).
- **Remaining work:** verify a real sign-in flow once a dev environment
  with real Clerk keys can be exercised.

## Anime/Manga list tracking ("My List")

**Status: Backend only.** Server actions + schema exist; **zero UI page**
renders a list, and only the "add" action has a wired button
(`AddToListButton`) — that button itself isn't rendered on any live
page either.

- **Purpose:** Track watching/reading status, progress, score, favorite
  flag per anime/manga title.
- **User flow (intended):** Click "Add to list" on a title card → pick
  status → view/manage at `/my-list` (route doesn't exist).
- **Frontend files:** `src/components/actions/AddToListButton.tsx`
  (not currently rendered by any page — it's used inside
  `EpisodeTimeline`, which itself isn't rendered by any page).
- **Backend files:** `src/lib/actions/animeList.ts`,
  `src/lib/actions/mangaList.ts`.
- **DB dependencies:** `user_anime_list`, `user_manga_list` tables
  (unique index on `(clerkUserId, mediaId)`).
- **Permissions:** requires Clerk sign-in; requires `DATABASE_URL`.
- **Validation:** none beyond TypeScript's compile-time types — no
  runtime schema check on the input object.
- **Error states:** thrown Error caught by the calling client component,
  shown as inline red text.
- **Tests:** none.
- **Remaining work:** `/my-list` page (read path — `getUserAnimeList`/
  `getUserMangaList` exist but nothing calls them from UI), remove/
  favorite/episode-progress UI (the actions `removeAnimeListEntry`,
  `toggleAnimeFavorite`, `markEpisodeWatched` all exist server-side with
  no UI trigger anywhere).

## Alerts / notifications

**Status: Backend only.** `RemindMeButton` exists but, like
`AddToListButton`, is only referenced from a component
(`EpisodeTimeline`) that no page renders.

- **Purpose:** Per-title/person/studio alert subscriptions with a
  frequency preference; a `notifications` table for delivered alerts.
- **Frontend files:** `src/components/actions/RemindMeButton.tsx`.
- **Backend files:** `src/lib/actions/alerts.ts`.
- **DB dependencies:** `user_alerts` (unique on `clerkUserId, type,
  targetId`), `notifications` (unique on `clerkUserId, dedupeKey`).
- **Permissions:** Clerk sign-in + `DATABASE_URL`.
- **Remaining work:** an `/alerts` page (nav.ts already declares the
  route, and the header has a bell icon linking to it); the actual
  alert-triggering mechanism (an `/api/cron/notifications` route is
  declared in `vercel.json` but doesn't exist — nothing currently
  creates rows in `notifications` from a real event).

## Follows (studio/person/tag/genre)

**Status: Backend only, no UI at all.** No component in the repo calls
`followTarget`/`unfollowTarget`/`getUserFollows`.

- **Backend files:** `src/lib/actions/follows.ts`.
- **DB dependencies:** `user_follows` table.
- **Remaining work:** everything user-facing — this is schema +
  server-action plumbing with zero UI.

## Profile / Settings

**Status: Backend only, no UI at all.** `profile.ts`'s
`getOrCreateProfile`/`updateProfile` are never called from any
component.

- **Purpose:** Per-user preferences (timezone, region, language, accent
  theme, color mode, genre filters, spoiler mode, brief mode/categories,
  email digest opt-in, etc. — 20 columns in `profiles`).
- **Backend files:** `src/lib/actions/profile.ts`.
- **DB dependencies:** `profiles` table.
- **Remaining work:** `/profile` and `/settings` pages (both declared
  in `nav.ts`); note the accent/theme preference is currently only ever
  stored in `localStorage` (`src/lib/theme.ts`) — the DB columns
  `accentTheme`/`colorMode` on `profiles` are not yet synced with that
  client-side state, so signing in on a second device wouldn't carry
  the preference over even once the UI exists.

## News feed

**Status: Backend only** — `NewsFeedProvider` + `NewsCard`/`NewsList`
components exist and are complete, but no page renders them (`/news`
is declared in `nav.ts`, no `page.tsx` exists).

- **Purpose:** Aggregated anime/manga/industry news from Google News
  RSS across 8 categories, with reliability tagging and rumor
  flagging.
- **Frontend files:** `src/components/news/{NewsCard,NewsList}.tsx`.
- **Backend files:** `src/lib/providers/news/{index,reliability}.ts`.
- **External integrations:** Google News RSS (no key).
- **Validation/edge cases:** empty category returns `[]` gracefully;
  malformed feed items (missing title/link) are filtered out.
- **Known issues:** `src/lib/dedup/clusterNews.ts` (multi-source
  dedup) exists and looks complete but **is never called** — `NewsList`
  renders raw, un-clustered articles, so the same story from 2+ outlets
  would currently show as 2+ separate cards if a page ever consumed
  `NewsFeedProvider.fetchAll()` directly.
- **Remaining work:** `/news` page; decide whether to wire in
  `clusterNews`.

## Airing schedule / episode calendar

**Status: Backend only.** `EpisodeTimeline` (home component) is the only
consumer of `AniListProvider.getAiringBetween`; no dedicated
`/airing` or `/calendar` page exists despite both being in `nav.ts`.

- **Frontend files:** `src/components/home/EpisodeTimeline.tsx`.
- **Backend files:** `AniListProvider.getAiringBetween` (anilist
  provider).
- **Known issues:** has the `react-hooks/set-state-in-effect` lint
  error (timezone/tick state).
- **Remaining work:** `/airing` (week view) and `/calendar` (broader
  calendar including manga volumes, music releases, birthdays — per
  `CalendarEvent` type, which has no provider/query behind it at all
  yet) pages.

## Trending / Discover / Seasonal browse

**Status: Backend only** (trending) / **Planned** (discover, seasonal
have no dedicated code beyond the generic `AniListProvider.browse()`
method and nav entries).

- **Frontend files:** `src/components/home/TrendingList.tsx`.
- **Backend files:** `AniListProvider.browse()` (generic, supports
  season/year/genre/format/status filters — the plumbing for a real
  `/seasonal` and `/discover` page already exists in the provider, just
  not wired to any route).

## Streaming availability

**Status: Verified complete as a utility, but unreachable** — pure
function (`getStreamingAvailability`), no network call, correctly
derives from AniList's own `externalLinks`. Used by `EpisodeTimeline`
(itself unreachable). No known bugs in the logic itself.

## Music (OP/ED releases)

**Status: Mocked.** Explicitly and honestly labeled in code
(`source: "mock"`) — 4 hand-picked real songs with search-based
(not exact-video-ID) YouTube links. No live Spotify/MusicBrainz
integration. No UI consumes `MusicProvider` at all in this snapshot (no
`/music` page, and no component references it).

## MyAnimeList ranking data

**Status: Planned / stub.** `MyAnimeListProvider`'s methods
unconditionally return `null`, documented in-code as "intentionally
unimplemented... requires a registered MAL API client." `configured`
correctly reflects whether `MAL_CLIENT_ID` is set, but that flag
currently has no functional effect.

## Jikan supplementary rankings

**Status: Backend only, unreachable.** `JikanProvider.getRankingByMalId`
is implemented and self-throttled correctly, but has zero callers
anywhere in the codebase.

## YouTube trailers/PVs

**Status: Backend only, unreachable.** `YouTubeProvider.searchTrailers`
is implemented, key-gated, and has zero callers anywhere in the
codebase.

## Theming (light/dark + 7 accent colors)

**Status: Verified complete and reachable** — this is the one feature
that is both fully implemented and live on every page (via `AppShell`'s
header), since it doesn't depend on any route existing.

- **Frontend files:** `ThemeToggle.tsx`, `AccentPicker.tsx`,
  `globals.css`, `lib/theme.ts`, the inline script in `layout.tsx`.
- **Persistence:** `localStorage` only (`anibrief-theme`,
  `anibrief-accent`) — no server-side/DB persistence despite `profiles`
  having `colorMode`/`accentTheme` columns (see Profile/Settings above).
- **Known issues:** both `ThemeToggle` and `AccentPicker` have the
  `react-hooks/set-state-in-effect` lint error on their initial-state
  sync effect.

## Admin surface (audit log, feature flags, announcement banner, provider
health, sync job tracking, trend snapshots)

**Status: Planned / schema-only.** 6 tables exist
(`admin_audit_logs`, `feature_flags`, `announcement_banner`,
`data_sources`, `provider_health`, `sync_jobs`, `trend_snapshots` — 7
actually) under `src/lib/db/schema/admin.ts`. **Zero code anywhere
reads or writes any of them.** No admin route, no admin check, no
`isAdmin`-gated UI.

## Cron-driven refresh jobs (airing, news, seasonal, birthdays, trend
snapshot, daily brief, notifications)

**Status: Planned.** `vercel.json` declares schedules for all 7; **none
of the target routes exist** (`src/app/api/cron/*` is entirely absent).
This is the most visible "declared but not built" gap in the repo.
