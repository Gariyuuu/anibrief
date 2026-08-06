# Changelog

All notable changes to AniBrief are documented here. This file also powers the in-app
"What's New" page (`/whats-new`).

## 0.1.1 — Security fix + deployment

### Fixed

- **Admin dashboard was readable while signed out.** `/admin` relied on a `redirect()` inside
  its layout to send non-admins away, but in this Next.js version a sibling page render could
  still be serialized into the response before the redirect took effect — a signed-out request
  could receive the full dashboard (provider health, job logs) with a `200` instead of being
  redirected. Fixed by blocking `/admin` in `src/proxy.ts` (Clerk middleware), which runs before
  any rendering starts; the layout-level check remains as defense-in-depth for client-side
  navigations. Verified: a signed-out request now gets a clean `307 → /` with no content sent.
- **Daily Brief page crashed in production builds.** `DailyBriefView` (a Server Component) was
  passing a render-prop function into a Client Component — functions can't cross that boundary
  in React Server Components. Restructured so all section data flows down as plain serializable
  props instead (`src/components/briefing/BriefModeToggle.tsx`).

### Changed

- Deployed to Vercel with Clerk + Neon wired up; see `DEPLOYMENT.md` for the live setup.

## 0.1.0 — Initial release

First release of AniBrief: a daily briefing terminal for anime, manga, Japanese music, and
voice-actor news, built on the architecture of the sibling MarketBrief project, with Clerk +
Neon/Drizzle in place of Supabase and AniList's public GraphQL API as the primary live data
source.

### Added

- **Home dashboard** — hero "Today in Anime" brief with real stats, today's episode timeline
  (local-timezone converted, with streaming links), top stories, trending titles, and a
  real-person/character birthday strip.
- **Daily Brief** — full briefing with Quick/Standard/Deep modes, listen-aloud (browser speech
  synthesis), copy-summary/copy-link/email sharing, and a persisted daily archive
  (`/daily-brief/archive`).
- **News terminal** (`/news`) — Latest/Top/Following/Anime/Manga/Music/Industry/Streaming/
  Games/Movies/People/Rumors tabs, reliability labeling, rumor detection, and duplicate-story
  clustering across sources.
- **Airing schedule** (`/airing`) — Today/Tomorrow/This week views, grouped by local day.
- **Seasonal browser** (`/seasonal`) — season navigation, sort, format filter, and a live
  genre/studio mix computed from the fetched page.
- **Anime & Manga** (`/anime`, `/manga`) — search/browse plus detail pages with tabs (Overview,
  Characters, Staff*, Relations, News, Music*, Statistics* — *anime only).
- **Music hub** (`/music`) — curated OP/ED reference set grouped by theme, with playlist-style
  YouTube-search link-outs.
- **People directory** (`/people`) — search, "Born Today," and an honestly-scoped "Upcoming
  Birthdays" (computed from AniList's most-favorited staff, since AniList has no birthday
  date-range query).
- **Calendar** (`/calendar`) — unified agenda of episodes, birthdays, and user reminders, with
  toggleable filters and `.ics` export.
- **Discover** (`/discover`) — mood, genre, studio, decade, hidden-gems, and short-anime
  explorers, each backed by live AniList queries.
- **My List, Profile, Settings** — Clerk-authenticated watch/read lists with status/progress/
  favorite management, a favorites+following profile view, and a full settings surface
  (appearance, content prefs, streaming services, spoilers, brief preferences, timezone,
  notifications, connected accounts via Clerk's `<UserProfile />`, privacy).
- **Alerts & notifications** (`/alerts`) — alert creation/management and a deduplicated in-app
  notification feed.
- **List import** (`/settings/import`) — CSV import with AniList-backed best-effort title
  matching and a mapping preview before commit.
- **Admin dashboard** (`/admin`, env-gated) — live provider health, sync-job log, data-source
  registry, announcement banner editor, feature flags, and a notification test button.
- **Scheduled jobs** — airing/news/seasonal cache refresh, birthday pre-warming, trend-snapshot
  collection, daily-brief pre-generation, and deduplicated notification dispatch, all idempotent
  via a shared `sync_jobs` lock.
- **PWA support** — installable manifest, generated icons, and a hand-written service worker
  caching the app shell and recently-visited pages for offline use.
- Full documentation set: `README.md`, `ARCHITECTURE.md`, `DATA_SOURCES.md`, `DATABASE.md`,
  `DEPLOYMENT.md`, `ENVIRONMENT_VARIABLES.md`, `CONTRIBUTING.md`.

### Known limitations

- Trend-delta percentages aren't shown anywhere — snapshots are collected (`trend_snapshots`)
  but there isn't enough historical depth yet to display an honest change figure.
- MyAnimeList's official API (ranking sync, two-way list sync) isn't implemented — the provider
  interface exists and degrades cleanly; it needs a registered OAuth client to activate.
- Browser push notifications aren't wired up (the DB column for a subscription exists; the
  subscribe flow doesn't yet) — in-app notifications and email-link sharing work today.
- Email-digest *sending* isn't implemented (the `resend` dependency is present but unused); the
  Daily Brief's "Email" share action uses a client-side `mailto:` link instead.
- Music and trailer data depend on optional API keys (Spotify/MusicBrainz-equivalent, YouTube)
  that aren't configured in this deployment — both surfaces show an honest "not configured"
  state alongside a small curated reference set where applicable, rather than fabricating data.
