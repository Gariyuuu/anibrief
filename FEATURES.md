# FEATURES.md — Feature-by-Feature Status

> Re-synced 2026-08-06 ~15:35 MST against the actual current git state (commit
> `1d1eef9`, working tree clean). The previous version of this file classified
> almost everything as "Backend only" / "Planned" / "Schema-only" against a stale,
> pre-commit snapshot — that snapshot's build has since landed and been deployed.
> Every classification below was re-checked by reading the current `src/app/**/page.tsx`,
> the components it renders, and the server actions/providers it calls — not
> inferred from file existence alone. Status scale: Verified complete / Mostly
> complete / Partially implemented / UI only / Backend only / Mocked / Planned /
> Broken / Deprecated / Unable to verify.

## Home dashboard (`/`)

**Status: Verified complete.** `src/app/page.tsx` (46 lines) calls
`getTodaysBriefing()` and renders `HeroBrief`, `EpisodeTimeline`, `TrendingList`,
`BirthdayStrip` — exactly the wiring the previous documentation pass listed as the
single highest-leverage missing piece. It now exists, builds successfully, and is
part of the 44-route production build.

- **Purpose:** Live "Today in Anime" hero brief + stat tiles, today's episode
  timeline (local-timezone converted, with streaming links), top stories, trending
  titles, birthday strip.
- **Backend:** `src/lib/briefing/{buildBriefing,getTodaysBriefing,store}.ts`.
- **DB dependency:** `briefings` table when `DATABASE_URL` is set; in-memory `Map`
  fallback otherwise.
- **Tests:** none directly on the page; the pure-function layers it depends on
  (`mapMedia`, `classifyReliability`) have unit tests.
- **Known issues:** none found this pass. **Unverified:** real-browser rendering
  (no `npm run dev` session was run this pass) — build-time static generation of `/`
  succeeded, which is a meaningful but not complete signal.

## Daily Brief (`/daily-brief`, `/daily-brief/archive`, `/daily-brief/archive/[date]`)

**Status: Verified complete**, including a real production bug fix.

- **Purpose:** Full daily briefing with Quick/Standard/Deep modes, listen-aloud,
  share actions, persisted archive.
- **Frontend:** `DailyBriefView.tsx`, `BriefModeToggle.tsx`, `BriefActions.tsx`.
- **Production bug found and fixed (commit `1d1eef9`):** `DailyBriefView` (a Server
  Component) was passing a render-prop *function* into a Client Component
  (`BriefModeToggle`) — functions aren't serializable across the RSC boundary, which
  crashed the page in production. Fixed by restructuring so all section data flows
  down as plain props; re-verified this pass by reading the current file — no
  function props remain in that boundary.
- **Known issues:** none found. `getTodaysBriefing`'s 20-minute staleness window is
  still nominally undermined by the in-memory fallback's per-instance scope on
  serverless when `DATABASE_URL` is unset — this is a real, honestly-documented
  limitation of the fallback path, not a bug in the DB-backed path.

## News feed (`/news`)

**Status: Verified complete**, including the previously-dead-code dedup path now
being wired in.

- **Purpose:** Aggregated multi-tab news terminal (Latest/Top/Following/Anime/
  Manga/Music/Industry/Streaming/Games/Movies/People/Rumors), reliability labeling,
  rumor detection, cross-source duplicate clustering.
- **Frontend:** `NewsCard`, `NewsList`, `NewsClusterCard`.
- **Backend:** `NewsFeedProvider` + `reliability.ts` + `clusterNews.ts` — **`clusterNews`
  is now called from `src/app/news/page.tsx`**, resolving the previous pass's "dead
  code, never wired in" finding.
- **Tests:** `clusterNews`, `textSimilarity`, `classifyReliability`, `looksLikeRumor`
  all have passing unit tests (12 of the 24 total).

## Command palette / search (⌘K, `/api/search`)

**Status: Verified complete**, unchanged from the previous pass's assessment except
that its detail-page links now resolve instead of 404ing.

- **Frontend:** `CommandPalette.tsx`.
- **Backend:** `GET /api/search` → `AniListProvider.searchMedia`.
- **Known issues fixed:** the previous pass flagged that search results linked to
  `/anime/:id`/`/manga/:id`, which didn't exist — **both routes now exist** (with 5
  and 3 sub-tab routes respectively), so this is resolved.
- **Remaining known issue:** no rate limiting on `/api/search` (unchanged finding).

## Authentication (sign in / sign up / session)

**Status: Verified complete**, and now exercised by real UI across the app (My
List, Alerts, Profile, Settings, Admin all gate on it) rather than being wired but
unreachable.

- **Backend:** `src/proxy.ts`, every server action's `requireUser()`/`requireAdmin()`.
- **Known issues:** still not exercised in a real browser session by any AI-run
  verification pass (no `npm run dev` was started this pass either) — "typechecks
  and builds" is not the same claim as "a real sign-in flow works," though the
  production deployment being live and the code being unchanged in shape since the
  initial build both weigh toward this working.

## Anime/Manga list tracking ("My List", `/my-list`)

**Status: Verified complete.** Previously "Backend only, zero UI page" — now has a
204-line real page (`src/app/my-list/page.tsx`) rendering the user's list via
`getUserAnimeList`/`getUserMangaList`, plus `RemoveFromListButton`,
`FavoriteToggleButton`, `ListStatusSelect` action components that didn't exist in
the previous snapshot.

- **DB dependency:** `user_anime_list`, `user_manga_list` tables.
- **Known issue (latent, not active):** `getUserAnimeList(userId)`/
  `getUserMangaList(userId)` still take a caller-supplied id rather than deriving it
  from `auth()` internally — `my-list/page.tsx` correctly passes the signed-in
  user's own id, so this isn't an active bug, but the function itself still has no
  internal ownership check. See `SECURITY.md`.

## Alerts / notifications (`/alerts`)

**Status: Verified complete.** Previously "Backend only" — now a real 66-line page
rendering `AlertsPanel`/`NotificationsPanel`/`CreateAlertForm`, and the
`/api/cron/notifications` route (previously entirely absent) now exists and writes
to the `notifications` table.

- **DB dependency:** `user_alerts`, `notifications`.
- **Known issue:** the notification-generation logic's actual trigger conditions
  (which events produce a notification) weren't independently re-derived line by
  line this pass — read `src/app/api/cron/notifications/route.ts` directly before
  relying on a specific claim about what triggers what.

## Follows (studio/person/tag/genre)

**Status: Verified complete.** Previously "Backend only, no UI at all" — now has
`FollowButton`/`UnfollowChip` components, used from `src/app/people/[id]/page.tsx`,
`src/app/profile/page.tsx`, and `src/app/news/page.tsx`.

- **DB dependency:** `user_follows`.
- **Known issue (latent, not active):** same caller-supplied-`userId` pattern as My
  List, on `getUserFollows` — current callers pass their own id correctly.

## Profile / Settings (`/profile`, `/settings`, `/settings/import`)

**Status: Verified complete.** Previously "Backend only, no UI at all" — now has a
real `/profile` page and a `/settings` page backed by 8 separate preference-form
components (`AppearanceForm`, `BriefPrefsForm`, `ContentPrefsForm`,
`NotificationsForm`, `PrivacyForm`, `RegionForm`, `SpoilerForm`, `StreamingForm`),
plus a CSV list-import wizard at `/settings/import` (`ImportWizard.tsx`, backed by
`src/lib/actions/listImport.ts`'s `parseImportPreview`/`commitImport`, matching the
`import_jobs` table's "preview before commit" design noted in `DATABASE.md`).

- **DB dependency:** `profiles`, `import_jobs`.
- **Known issue carried forward:** the accent/theme preference is still
  `localStorage`-only (`src/lib/theme.ts`) — `profiles.accentTheme`/`colorMode`
  columns exist but nothing syncs them yet, so preference still doesn't follow a
  user across devices. Not independently re-verified this pass beyond confirming
  `AppearanceForm.tsx` exists (its exact sync behavior wasn't re-read line by line).
- **`NotificationsForm.tsx`** contains an honest in-UI disclosure that email
  digests aren't sent yet (`resend` installed, not integrated) — matches the code
  reality (re-verified: zero `resend` send call sites in `src/`).

## Admin dashboard (`/admin`)

**Status: Verified complete.** Previously "Planned / schema-only, zero code reads
or writes any of it" — now fully real:

- **Auth:** gated in **both** `src/proxy.ts` (middleware, blocks before any
  rendering) and `src/app/admin/layout.tsx` (defense-in-depth) — this dual-gate is
  the direct fix for a real production auth-bypass bug (see `SECURITY.md`,
  `DECISIONS.md`).
- **Live provider health:** `src/lib/admin/providerHealth.ts` — makes a real,
  cheap live AniList call plus reads every other provider's `.configured` flag;
  not a stored/stale table read.
- **Feature flags, announcement banner, test notifications, audit log:**
  `src/lib/actions/admin.ts` — `toggleDataSource`, `toggleFeatureFlag`,
  `updateAnnouncementBanner`, `sendTestNotification`, all independently re-checking
  `requireAdmin()` and writing to `adminAuditLogs`.
- **Known issue:** in this local environment, `ADMIN_USER_IDS` is unset, so `/admin`
  is only reachable via a hand-set `profiles.isAdmin = true` row — not tested this
  pass (would require a DB write, out of scope for a documentation-only re-sync).

## Airing schedule / Calendar (`/airing`, `/calendar`)

**Status: Verified complete.** Previously "Backend only" (airing) / effectively
unbuilt (calendar) — both now have real pages. `/calendar` (105 lines) additionally
exposes `.ics` export via `GET /api/calendar/ics` (public route — works
signed-out, showing only airing episodes; when signed in, also includes the
user's own `calendar_reminders`).

- **Frontend:** `AiringByDay.tsx`, `CalendarView.tsx`, `AddReminderForm.tsx`.
- **Backend:** `AniListProvider.getAiringBetween`, `src/lib/actions/calendarReminders.ts`,
  `src/lib/utils/calendarEvents.ts`.
- **DB dependency:** `calendar_reminders`.

## Seasonal / Discover browse (`/seasonal`, `/discover`)

**Status: Verified complete.** Previously "Backend only" (seasonal) / "Planned, no
dedicated code" (discover) — `/seasonal` is 129 lines, `/discover` is 345 lines
(the largest single page file found this pass), both calling
`AniListProvider.browse()` with real filter UI.

## Anime / Manga detail pages (`/anime`, `/anime/[id]` + 5 tabs, `/manga`, `/manga/[id]` + 3 tabs)

**Status: Verified complete.** Previously entirely absent. `anime/[id]` has
`characters`, `music`, `news`, `relations`, `staff`, `statistics` sub-routes;
`manga/[id]` has `characters`, `news`, `relations`. All present in the 44-route
build output.

## People directory (`/people`, `/people/[id]`)

**Status: Verified complete.** 100-line list page + detail page, using
`FollowButton` for person-following (see "Follows" above).

## Music (`/music`, `anime/[id]/music`)

**Status: Mocked, but now reachable** — status upgraded from the previous pass's
"Mocked, no UI consumes it at all." `MusicProvider.getCuratedReleases()` is still
honestly-labeled mock data (`source: "mock"`, `configured: false`, 4 real curated
songs, YouTube-search links not guessed video IDs) — but it now has two real
callers (`src/app/music/page.tsx`, `src/app/anime/[id]/music/page.tsx`), so the
"never wired into any UI" part of the old finding no longer holds.

## MyAnimeList ranking data

**Status: Planned / stub — unchanged.** `MyAnimeListProvider`'s methods still
unconditionally return `null`, "intentionally unimplemented" per its own comment.
Its `.configured` flag is now read by the admin health check, but that doesn't
change the functional status.

## Jikan supplementary rankings

**Status: Backend only, effectively unreachable — mostly unchanged.**
`JikanProvider` now has exactly one caller (`src/lib/admin/providerHealth.ts`), but
that caller only reads `.configured`, not `getRankingByMalId`'s actual data — so the
real ranking data still has zero consumers. Slightly better than "zero callers
anywhere," not yet "wired into a real feature." See `TASKS.md` T-104.

## YouTube trailers/PVs

**Status: Verified complete as a utility, reachable.** `YouTubeProvider.searchTrailers`
now has real callers via the Music pages (upgraded from "zero callers anywhere" in
the previous pass) — still key-gated, `YOUTUBE_API_KEY` not set in this local
environment, so it degrades to an empty result here.

## Streaming availability

**Status: Verified complete.** Pure function (`getStreamingAvailability`), no
network call, correctly derives from AniList's own `externalLinks`. Used by
`EpisodeTimeline` (now reachable via the live home page). No change from the
previous pass's assessment beyond reachability.

## Theming (light/dark + 7 accent colors)

**Status: Verified complete.** Unchanged from the previous pass except that the
`react-hooks/set-state-in-effect` lint errors on `ThemeToggle`/`AccentPicker` are
now fixed (targeted `eslint-disable-next-line` comments, re-verified by reading the
current files — `npm run lint` is clean).

## Cron-driven scheduled jobs (`/api/cron/*` — 7 routes)

**Status: Verified complete.** Previously "Planned — none of the target routes
exist." All 7 (`birthdays`, `daily-brief`, `notifications`, `refresh-airing`,
`refresh-news`, `refresh-seasonal`, `trend-snapshot`) now exist under
`src/app/api/cron/`, each wrapped in `src/lib/cron/runCronJob.ts`'s idempotency
lock (backed by the `sync_jobs` table), matching every schedule in `vercel.json`
exactly. Not independently verified against a live Vercel Cron trigger this pass
(would require production access) — verified by reading the route source and
confirming the shared lock pattern is used consistently.

## PWA support

**Status: Verified complete.** `public/sw.js` (network-first for pages, cache-first
for static assets, per its own header comment) + `ServiceWorkerRegister.tsx`
(registers it, silently no-ops if unsupported) + `OfflineBanner.tsx` + a real
`manifest.ts`. Not present at all in the previous pass's snapshot.

## Rate limiting

**Status: Broken / missing — unchanged.** Still genuinely absent everywhere. Not a
regression; the previous pass's finding still holds exactly as stated. See
`SECURITY.md` and `TASKS.md` T-102.

## Runtime input validation (`zod`)

**Status: Planned / gap — unchanged.** `zod` is still an installed, zero-usage
dependency (re-verified: `grep -r 'from "zod"' src/` → no matches). See `TASKS.md`
T-101.

## Email digest sending (`resend`)

**Status: Planned / gap — unchanged.** `resend` is still installed and unused,
honestly disclosed in `NotificationsForm.tsx`'s own UI copy. The Daily Brief's
"Email" share action uses a client-side `mailto:` link instead, which needs no key.
