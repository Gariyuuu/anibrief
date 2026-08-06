# Architecture

> Re-synced 2026-08-06 ~15:35 MST against the actual current git state (commit
> `1d1eef9`, deployed and live at https://anibrief.vercel.app). This file's body was
> largely already accurate as of the previous documentation pass (it was written
> later in that session than the files that got the stale-snapshot treatment); this
> note plus the "Production fixes" section below are the actual re-sync delta.

AniBrief is a Next.js 16 App Router application — server-rendered by default, with Client
Components only where interactivity genuinely requires them (forms, mutation buttons, the
command palette, timezone-dependent rendering).

## Production fixes (commit `1d1eef9`, since the initial release)

Two real bugs were found and fixed after the initial build landed — both worth
understanding architecturally, not just as changelog entries:

1. **Admin auth bypass, closed at the middleware layer.** `/admin` originally
   relied only on a layout-level `redirect()` for non-admins. In this Next.js
   version, an in-flight sibling render could apparently still be serialized into
   the response before that redirect took effect (an RSC-streaming timing quirk).
   The fix moved the authoritative check into `src/proxy.ts` (middleware), which
   runs before any rendering starts; the layout-level check remains as
   defense-in-depth for client-side navigations. **Pattern to reuse:** any future
   route that must never leak content to unauthorized requests should be gated in
   middleware, not layout alone, in this Next.js version specifically.
2. **RSC server/client prop-boundary crash.** `DailyBriefView` (Server Component)
   was passing a render-prop *function* into `BriefModeToggle` (Client Component) —
   functions can't cross that boundary. Fixed by passing only plain, serializable
   data down. **Pattern to reuse:** never pass a function as a prop from a Server
   Component into a Client Component; pass data and let the Client Component own
   any rendering logic that needs a callback.

## Why this structure

AniBrief reuses the strongest parts of the sibling **MarketBrief** project's architecture
(itself a personal finance-news dashboard): a lean `lib/{types,providers,utils}` split, a
provider-abstraction layer so the UI is never coupled to one third-party API, graceful
degradation everywhere a credential might be missing, and a CSS-variable theme system. Two
things were deliberately changed rather than copied:

- **Auth + database**: MarketBrief uses Supabase (Postgres + Auth bundled). AniBrief uses
  **Clerk** for auth and **Neon** (plain serverless Postgres) via **Drizzle ORM** — a cheaper,
  more composable combination at this project's scale. See `DATABASE.md` for what that changes
  about authorization (app-layer checks instead of Postgres RLS).
- **Primary data source**: MarketBrief pulls from paid/keyed APIs (Finnhub, SEC EDGAR needs a
  descriptive User-Agent, AI providers need a key). AniBrief leans on **AniList's public GraphQL
  API**, which needs no key at all and covers most of the product surface (anime, manga,
  characters, staff, airing schedules, seasonal browsing, real-person birthdays) — see
  `DATA_SOURCES.md`.

## Directory layout

```
anibrief/
  drizzle/                       Generated SQL migrations (from src/lib/db/schema)
  public/
    sw.js                        Hand-written service worker (app-shell + page caching)
  src/
    proxy.ts                     Clerk session middleware (Next 16 renamed middleware.ts -> proxy.ts)
    app/
      layout.tsx                 Root layout: fonts, theme/accent-init script, ClerkProvider, AppShell
      globals.css                 CSS-variable theme tokens (paper/ink palette + 7 accent themes) + Tailwind v4
      icon.tsx / apple-icon.tsx / opengraph-image.tsx / manifest.ts   Generated branding assets (next/og)
      page.tsx                     Home dashboard
      daily-brief/                  Daily Brief page + /archive + /archive/[date]
      news/, airing/, seasonal/       Public MVP browse pages
      anime/[id]/, manga/[id]/         Detail pages with tab sub-routes (characters, staff, relations, news, music, statistics)
      people/, calendar/, discover/     Discovery surfaces
      my-list/, profile/, settings/      Personalization (Clerk-gated)
      alerts/                           Alerts + in-app notifications
      admin/                            Protected admin dashboard (ADMIN_USER_IDS-gated)
      api/
        search/                          Command-palette search proxy
        cron/                             Scheduled jobs (see below)
        calendar/ics/                     .ics export
    components/
      ui/                          Card, Button, Badge, Tabs, Skeleton, EmptyState, ErrorState, Avatar
      layout/                       AppShell, NavLinks, MobileNav, ThemeToggle, AccentPicker, CommandPalette, AnnouncementBanner
      brand/                        Logo, Mark (original SVG mark — see README for the design rationale)
      home/, briefing/, news/, anime/, airing/, actions/, admin/, pwa/    Feature-scoped components
    lib/
      types/                       Normalized domain types (media, person, news, music, briefing, calendarEvent, userList)
      providers/                    One folder per external data source — see DATA_SOURCES.md
      db/                            Drizzle schema + client — see DATABASE.md
      actions/                        "use server" mutations, Clerk-gated
      ai/                              Swappable Anthropic/OpenAI provider + template fallback
      briefing/                        Daily-briefing builder + archive store
      dedup/                           Headline-similarity duplicate detection + clustering
      utils/                           cn, dates, logger, retry, season, mediaId
```

## Data flow

**Read paths** (browsing, search, detail pages) call a provider module directly from a Server
Component — e.g. `src/app/anime/[id]/page.tsx` calls `getAnimeDetail()` →
`AniListProvider.getMediaDetailRaw()` → `mapMedia()`. Next's `fetch` cache (`revalidate` per
call site, from 5 minutes for search to an hour for birthdays) does the caching; there's no
separate content database to keep in sync.

**Write paths** (add to list, create alert, follow, update settings) are Next Server Actions in
`src/lib/actions/`, called from small Client Components via `useTransition` — see
`src/components/actions/AddToListButton.tsx` for the canonical pattern (auth check → DB write →
`revalidatePath`). Every action independently re-checks `await auth()`, since Server Actions are
directly callable and can't rely solely on a page-level gate.

**The Daily Brief** (`src/lib/briefing/buildBriefing.ts`) fans out to AniList (today's airing
schedule, trending, birthdays) and the news provider in parallel, computes a stats block from
only the data actually returned (never a fabricated number), and generates its executive summary
via the AI provider when configured or a deterministic fact-only template otherwise. It's
persisted once per day (`src/lib/briefing/store.ts`, Neon-backed with an in-memory fallback) and
reused by both the Home page's hero card and the full Daily Brief page — mirroring the
`isStale()`/rebuild-on-stale-visit pattern from the sibling `daily-brief` project rather than
depending solely on the cron schedule.

**Scheduled jobs** (`src/app/api/cron/*`, registered in `vercel.json`) refresh caches, collect
trend snapshots, pre-generate the day's brief, and dispatch deduplicated notifications. Every
route is wrapped in an idempotent `sync_jobs` lock (see `DATABASE.md`) so overlapping/duplicate
triggers are safe.

## Authentication

Clerk (`@clerk/nextjs`), with `src/proxy.ts` running `clerkMiddleware()` on every request except
static assets. Routes are public by default; personalization pages check `await auth()` (server)
or `useUser()`/`<Show when="signed-in">` (client) individually rather than blanket-protecting
routes in middleware, since most of AniBrief (browsing, search, news, the daily brief) is meant
to be useful before sign-in, per the product brief.

## Theming

CSS custom properties in `src/app/globals.css`, toggled via a `.dark` class and a `data-accent`
attribute on `<html>`, both set by an inline no-flash script in `layout.tsx` reading
`localStorage` before paint. Seven accent themes (`src/lib/theme.ts`) layer on top of one shared
light/dark ink-and-paper palette, deliberately avoiding a default "purple SaaS" look.

## What's intentionally not built yet

See `README.md`'s "Known limitations" section for the full list — notably: MyAnimeList OAuth
list-sync, browser push notifications (the DB column exists; the subscription flow doesn't),
Resend email-digest sending (a `mailto:` link covers the spec's "Email" share action instead),
and trend-delta percentages in the UI (snapshots are collected but not enough history exists yet
to show one honestly).
