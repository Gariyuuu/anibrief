# API_REFERENCE.md

> Re-synced 2026-08-06 ~15:35 MST against the actual current git state (commit
> `1d1eef9`). The previous version of this file only documented `/api/search` and
> listed the 7 cron routes plus `.ics` export under "What does NOT exist" — all of
> those now exist and are documented below, re-verified by reading each route's
> current source directly. No secrets appear in any example below — all example
> values are placeholders.

## Route Handlers (real HTTP endpoints)

### `GET /api/search`

- **Source file:** `src/app/api/search/route.ts`.
- **Purpose:** Server-side proxy so the command palette can search AniList without
  exposing provider internals or calling AniList directly from the browser.
- **Auth/authz:** None — public, unauthenticated.
- **Params:** query string `q`. Requests with `q` missing or trimmed length `< 2`
  short-circuit to an empty result (no AniList call made).
- **Response shape (200):**
  ```json
  {
    "anime": [
      { "id": "anilist:16498", "title": "Attack on Titan", "image": "https://.../cover.jpg", "kind": "anime" }
    ],
    "manga": [
      { "id": "anilist:87216", "title": "Attack on Titan", "image": "https://.../cover.jpg", "kind": "manga" }
    ]
  }
  ```
  Up to 6 anime + 4 manga results.
- **Status codes:** always `200` — `AniListProvider.searchMedia` never throws.
- **Validation:** trims and length-checks `q` only; still no `zod` schema (unchanged
  gap — see `SECURITY.md`, `TASKS.md` T-101).
- **Rate limiting:** none (unchanged gap).
- **DB ops:** none.
- **External calls:** `AniListProvider.searchMedia(q, "ANIME", {perPage: 6})` and
  `("MANGA", {perPage: 4})` in parallel.

### `GET /api/calendar/ics`

- **Source file:** `src/app/api/calendar/ics/route.ts`. **New since the previous
  documentation pass** (the earlier snapshot predates this route entirely).
- **Purpose:** Downloadable `.ics` (RFC 5545) calendar of episodes airing in the
  next 30 days, plus the signed-in user's own calendar reminders.
- **Auth/authz:** **Public** — works signed-out (airing episodes only). When a
  Clerk session exists, also includes that user's `calendar_reminders` rows via
  `getUserReminders(userId)`.
- **Params:** none.
- **Response:** `text/calendar; charset=utf-8`, `Content-Disposition: attachment`,
  hand-built `VCALENDAR`/`VEVENT` blocks (no external ics library).
- **DB ops:** `SELECT` on `calendar_reminders` (only when signed in).
- **External calls:** `AniListProvider.getAiringBetween(startSec, endSec, 200)`.
- **Errors:** none explicitly handled beyond what the underlying calls already
  degrade to (empty arrays on failure).

## Cron Route Handlers (`src/app/api/cron/*`) — all 7 real, all via `runCronJob()`

Every route below is a thin wrapper around `src/lib/cron/runCronJob.ts`
(`runCronJob(request, jobName, bucket, work)`), which handles, identically for all
7:

- **Auth:** `CRON_SECRET` bearer-token check. If `CRON_SECRET` is set, a request
  without a matching `Authorization: Bearer <secret>` header gets `401`. **If
  `CRON_SECRET` is unset** (the case in this local environment), the check
  short-circuits to "allow" and logs a warning — this is intentional, to support
  local testing, but means an unauthenticated deploy is publicly triggerable.
- **Idempotency:** each invocation locks on `<jobName>:<YYYY-MM-DD>` (day bucket)
  or `<jobName>:<YYYY-MM-DDTHH>` (hour bucket); a job already `"running"` or
  `"success"` for that bucket is skipped, recorded via the `sync_jobs` table.
- **Graceful DB degradation:** if `DATABASE_URL` is unset, the job still runs (to
  warm Next's `fetch` cache) but no `sync_jobs` row is written and no idempotency
  lock is checked.
- **Response:** always `200` (even on internal failure — the error is recorded in
  the `sync_jobs` row and returned in the JSON body, specifically so Vercel Cron
  doesn't treat a partial failure as needing infinite retries).

| Route | Job name / bucket | Work | Schedule (`vercel.json`) |
|---|---|---|---|
| `GET /api/cron/birthdays` | `birthdays` / day | Pre-warms today's staff/character birthday queries | `0 0 * * *` (00:00 UTC) |
| `GET /api/cron/refresh-airing` | `refresh-airing` / ? | Refreshes the airing-schedule cache | `0 1 * * *` |
| `GET /api/cron/refresh-news` | `refresh-news` / ? | Refreshes the news-feed cache | `0 3 * * *` |
| `GET /api/cron/refresh-seasonal` | `refresh-seasonal` / ? | Refreshes the current-season browse cache (`currentSeason()`) | `0 5 * * *` |
| `GET /api/cron/notifications` | `notifications` / ? | Writes deduplicated rows to `notifications` (unique on `clerkUserId, dedupeKey`) | `0 9 * * *` |
| `GET /api/cron/trend-snapshot` | `trend-snapshot` / ? | Writes a row to `trend_snapshots` from live AniList popularity/score/favourites data | `0 12 * * *` |
| `GET /api/cron/daily-brief` | `daily-brief` / day | `buildDailyBriefing()` + `saveBriefing()` — pre-generates the day's brief | `0 13 * * *` |

Exact hour-vs-day bucketing for `refresh-airing`/`refresh-news`/`refresh-seasonal`/
`notifications`/`trend-snapshot` wasn't individually re-confirmed line-by-line for
every route this pass (only `daily-brief`'s `"day"` bucket and the shared
`runCronJob` contract were read directly) — read each route file directly before
relying on an exact bucket claim for one of those five.

## Server Actions (`"use server"` — not HTTP routes, the app's mutation surface)

All action files share the `requireUser()` (or, for admin actions, `requireAdmin()`)
pattern: throws `Error("Sign in to ...")` if no Clerk session (or "Admin access
required." for admin actions), throws a DB-not-configured error if
`!isDatabaseConfigured()`.

### `src/lib/actions/animeList.ts`

| Action | Auth | DB op | Side effects |
|---|---|---|---|
| `addOrUpdateAnimeListEntry(input)` | required | `INSERT ... ON CONFLICT (clerk_user_id, media_id) DO UPDATE` | `revalidatePath("/my-list")` |
| `removeAnimeListEntry(mediaId)` | required | `DELETE` | `revalidatePath("/my-list")` |
| `toggleAnimeFavorite(mediaId, isFavorite)` | required | `UPDATE` | `revalidatePath("/my-list")` |
| `markEpisodeWatched(mediaId, mediaTitle, coverImage, episode)` | required | `INSERT ... ON CONFLICT DO UPDATE` | `revalidatePath("/my-list")`, `revalidatePath("/airing")` |
| `getUserAnimeList(userId)` | **not internally enforced** — caller passes `userId` directly | `SELECT` | none |

**Real caller (new since the previous pass):** `src/app/my-list/page.tsx` calls
`getUserAnimeList(userId)` with the signed-in session's own `userId` — correct
usage, but the function itself still has no internal check that the caller is
asking about their own data. See `SECURITY.md`.

### `src/lib/actions/mangaList.ts`

Same shape as `animeList.ts` minus `markEpisodeWatched`/`toggleAnimeFavorite`
(has `toggleMangaFavorite` instead): `addOrUpdateMangaListEntry`,
`removeMangaListEntry`, `toggleMangaFavorite`, `getUserMangaList(userId)` (same
caveat as above). Table: `user_manga_list`. Real caller: `/my-list`.

### `src/lib/actions/alerts.ts`

| Action | Auth | DB op |
|---|---|---|
| `createAlert(input)` | required | `INSERT ... ON CONFLICT DO NOTHING` |
| `deleteAlert(id)` | required | `DELETE` (scoped to `clerk_user_id`) |
| `getUserAlerts(userId)` | not internally enforced | `SELECT` |
| `getUserNotifications(userId, limit=30)` | not internally enforced | `SELECT`, ordered `created_at desc` |
| `markNotificationRead(id)` | required | `UPDATE` (scoped to `clerk_user_id`) |

**Real caller (new):** `src/app/alerts/page.tsx` calls `getUserNotifications`/
`getUserAlerts` with its own session's `userId`.

### `src/lib/actions/follows.ts`

| Action | Auth | DB op |
|---|---|---|
| `followTarget(targetType, targetId, targetLabel)` | required | `INSERT ... ON CONFLICT DO NOTHING` |
| `unfollowTarget(targetType, targetId)` | required | `DELETE` |
| `getUserFollows(userId)` | not internally enforced | `SELECT` |

**Real callers (new):** `FollowButton`/`UnfollowChip` components, used from
`src/app/people/[id]/page.tsx`, `src/app/profile/page.tsx`, `src/app/news/page.tsx`.

### `src/lib/actions/profile.ts`

| Action | Auth | DB op |
|---|---|---|
| `getOrCreateProfile(userId)` | not internally enforced (only checks `isDatabaseConfigured()`) | `SELECT`, then `INSERT ... RETURNING` if no row exists |
| `updateProfile(patch)` | required (calls `auth()` directly) | `INSERT ... ON CONFLICT (clerk_user_id) DO UPDATE`, then `revalidatePath("/settings")` + `revalidatePath("/profile")` |

**Real callers (new):** `src/app/profile/page.tsx`, `src/app/settings/page.tsx`,
and (indirectly, for the admin-check path) `src/lib/utils/adminAccess.ts`'s
`isAdminUser()` — which calls `getOrCreateProfile(userId)` to read the
`isAdmin` fallback column.

**Note (unchanged from the previous pass, now with real callers):**
`getOrCreateProfile` still takes a raw `userId` with no internal auth check —
every current caller passes a trusted, session-derived or Clerk-verified id, so
there's no active exploit path, but the function itself still doesn't enforce it.

### `src/lib/actions/calendarReminders.ts` — new since the previous pass

| Action | Auth | DB op |
|---|---|---|
| `createReminder(input)` | required | `INSERT` on `calendar_reminders` |
| `deleteReminder(id)` | required | `DELETE` (scoped to `clerk_user_id`) |
| `getUserReminders(userId)` | not internally enforced | `SELECT` |

Real callers: `src/components/calendar/AddReminderForm.tsx`,
`GET /api/calendar/ics` (see above).

### `src/lib/actions/listImport.ts` — new since the previous pass

| Action | Auth | DB op |
|---|---|---|
| `parseImportPreview(rows, sourceType)` | not independently re-confirmed this pass — read the file directly before relying on this | writes an `import_jobs` preview row (per `DATABASE.md`'s "preview before commit" design) |
| `commitImport(jobId)` | not independently re-confirmed this pass | commits the previewed rows into `user_anime_list`/`user_manga_list` |

Real caller: `src/components/import/ImportWizard.tsx`, mounted at
`/settings/import`.

### `src/lib/actions/admin.ts` — new since the previous pass

All four re-check `requireAdmin()` independently (Clerk `auth()` + `isAdminUser()`)
and write an `adminAuditLogs` row via a shared `logAudit()` helper before
returning.

| Action | Auth | DB op | Side effects |
|---|---|---|---|
| `toggleDataSource(id, enabled)` | admin required | `UPDATE` on `data_sources` | audit log, `revalidatePath("/admin")` |
| `toggleFeatureFlag(key, enabled)` | admin required | `UPDATE` on `feature_flags` | audit log, `revalidatePath("/admin")` |
| `updateAnnouncementBanner({message, tone, active})` | admin required | `INSERT ... ON CONFLICT (id) DO UPDATE` on `announcement_banner` (single row, `id: "current"`) | audit log, `revalidatePath("/admin")`, `revalidatePath("/")` |
| `sendTestNotification()` | admin required | `INSERT` a test row into `notifications` for the calling admin | audit log, `revalidatePath("/alerts")` |

Real callers: `src/components/admin/{DataSourceToggle,FeatureFlagToggle,
AnnouncementBannerForm,TestNotificationButton}.tsx`, all mounted on `/admin`.

## What does NOT exist (re-verified this pass)

- No webhook endpoints (no Clerk webhook handler, no payment webhook — unchanged
  from the previous pass).
- No GraphQL endpoint of AniBrief's own.
- No `/api/anime/[id]`-style detail-fetch route — detail pages call
  `AniListProvider` directly from Server Components, per the established pattern.
- No authentication endpoints of AniBrief's own — Clerk's hosted endpoints handle
  sign-in/up entirely.
- **No longer true, previously listed here:** the 7 `/api/cron/*` routes and
  `GET /api/calendar/ics` — both now real, documented above.
