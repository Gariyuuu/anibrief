# AniBrief

**Your daily briefing for anime, manga, music, and more.**

**Live:** [anibrief.vercel.app](https://anibrief.vercel.app)

A personalized daily briefing terminal for anime fans — episode tracking, seasonal browsing,
manga and OST discovery, voice-actor birthdays, industry news, and a generated daily brief,
built on the architecture of the sibling **MarketBrief** project (a finance-news dashboard) but
retargeted for anime/manga/entertainment.

**Stack:** Next.js 16 (App Router) + TypeScript (strict) + Tailwind CSS v4 + Clerk (auth) + Neon
Postgres via Drizzle ORM + AniList's public GraphQL API as the primary content source, deployed
on Vercel.

## Alternate names considered

AniBrief was chosen as the working name. Other names considered during design: **Otaku Brief**,
**Seiyuu Daily**, **AniPulse**, **The Weekly Airing**, **AniDesk**, **Konnichiwa Brief**,
**AniWire**. AniBrief was kept for its direct echo of MarketBrief and clear "anime + daily
briefing" read.

## Why AniList as the primary source

Most of this product's data needs — anime/manga metadata, seasonal schedules, airing times,
characters, voice actors, staff, studios, real-person birthdays, streaming links — are covered
by **AniList's public GraphQL API, which needs no API key at all**. That's the same "start from
what's free and keyless" instinct MarketBrief uses for its Google News RSS source, applied here
as the backbone rather than a fallback. See `DATA_SOURCES.md` for the full provider list,
including what's stubbed pending a credential (MyAnimeList OAuth, YouTube, music metadata) and
exactly how each one degrades — never by inventing data, always by showing an honest "not
configured" state.

## Features

- **Home dashboard** — a live "Today in Anime" hero brief, today's episode timeline (converted
  to your local timezone, with real streaming links), top stories, trending titles, and a
  birthday strip that clearly separates real people from fictional characters.
- **Daily Brief** (`/daily-brief`) — Quick/Standard/Deep reading modes, listen-aloud via the
  browser's speech synthesis, copy/email/share, and a persisted daily archive.
- **News** (`/news`) — a multi-tab news terminal with reliability labeling, rumor detection, and
  cross-source duplicate-story clustering, all attributed and linked to the original article.
- **Airing** (`/airing`) and **Seasonal** (`/seasonal`) — today/tomorrow/week schedules and a
  season-by-season browser with sort/format filters.
- **Anime** (`/anime`) and **Manga** (`/manga`) — search, browse, and rich detail pages
  (Overview, Characters, Staff, Relations, News, Music, Statistics).
- **Music** (`/music`) — an OST/opening/ending hub with a curated real-song reference set and
  playlist-style link-outs (never a fake live sync).
- **People** (`/people`) — voice actor / creator profiles, "Born Today," and an honestly-scoped
  "Upcoming Birthdays."
- **Calendar** (`/calendar`) — a unified agenda/month view of episodes, birthdays, and personal
  reminders, exportable as `.ics`.
- **Discover** (`/discover`) — mood, genre, studio, decade, hidden-gem, and short-anime
  explorers.
- **My List, Profile, Settings** — Clerk-authenticated watch/read list management, favorites,
  follows, and a full preferences surface (appearance, spoilers, notifications, streaming
  services, and more).
- **Alerts** (`/alerts`) — create alerts for new episodes and more, with a deduplicated in-app
  notification feed.
- **List import** (`/settings/import`) — CSV import with a mapping preview before commit.
- **Admin dashboard** (`/admin`) — provider health, scheduled-job log, source registry,
  announcement banner, feature flags.
- Command palette (`⌘K` / `/`), 7 accent themes × light/dark, PWA-installable with offline
  caching.

## Local setup

Prerequisites: Node 20+, npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app runs and shows real content with **zero environment variables set** — AniList needs no
key. Sign-in and personalization need Clerk keys (`clerk init --framework next -y` provisions
these automatically); lists/alerts/settings need `DATABASE_URL` (Neon). See
`ENVIRONMENT_VARIABLES.md` for what each variable unlocks and `DATABASE.md` /
`CONTRIBUTING.md` for setup details.

## Documentation

| File | Covers |
|---|---|
| `ARCHITECTURE.md` | Directory layout, data flow, auth model, theming |
| `DATA_SOURCES.md` | Every provider, what's live vs. degraded, and why |
| `DATABASE.md` | Neon/Drizzle schema, authorization model, local setup |
| `DEPLOYMENT.md` | Vercel + Clerk + Neon deploy steps, cron plan limits |
| `ENVIRONMENT_VARIABLES.md` | Every env var and what happens without it |
| `CONTRIBUTING.md` | Local dev workflow and code conventions |
| `CHANGELOG.md` | Release notes (also served at `/whats-new`) |

## Branding

An original mark (`src/components/brand/Mark.tsx`) — a folded briefing page with a play-triangle
center, reading as both "a page" and "a briefing you watch." Not derived from MyAnimeList,
AniList, Crunchyroll, or Anime News Network branding. See `ARCHITECTURE.md` for the icon
generation approach (Next's `next/og` `ImageResponse`, no external image tooling needed).

## Legal

AniBrief is an independent anime/manga discovery and tracking service. It is **not affiliated
with, endorsed by, or partnered with** AniList, MyAnimeList, Crunchyroll, YouTube, or any
publisher or studio referenced in its content. All trademarks belong to their respective owners.
No pirated streaming or manga content is linked or hosted — every link points to the source's
own official site. See the in-app footer for the same disclaimer.

## Known limitations

See `CHANGELOG.md`'s "Known limitations" section — in short: MyAnimeList OAuth sync, browser
push notifications, and Resend email-digest sending are not yet wired up (interfaces exist and
degrade cleanly); trend-delta percentages aren't shown since there isn't enough collected
history yet to display one honestly.
