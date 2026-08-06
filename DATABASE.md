# Database

AniBrief uses **Neon** (serverless Postgres) via **Drizzle ORM**, accessed through Neon's HTTP
driver (`@neondatabase/serverless`'s `neon()` + `drizzle-orm/neon-http`) — no persistent
connection pool needed, which suits Vercel's serverless/edge functions well.

This is a deliberate departure from the sibling MarketBrief project's Supabase setup: Supabase
bundles Postgres + Auth + Storage behind one product; AniBrief instead uses **Clerk** for
auth (see `ARCHITECTURE.md`) and **Neon** for a plain Postgres database, which is cheaper at
this project's scale and keeps the two concerns independently swappable.

## Authorization model

Because Neon is plain Postgres (not Supabase, which wires its own `auth.uid()` into Postgres
Row Level Security), **authorization is enforced at the application layer**, not via Postgres
RLS. Every table that holds user data is keyed by `clerkUserId` (a string like `user_2abc...`),
and every server action in `src/lib/actions/` re-checks `await auth()` from
`@clerk/nextjs/server` before reading or writing — see `src/lib/actions/animeList.ts` for the
canonical pattern (a `requireUser()` helper that throws before any DB touch if the caller isn't
signed in). Server Actions are independently callable (not gated by page-level checks alone), so
every one of them performs its own auth check, including the admin-only ones in
`src/lib/actions/admin.ts`.

## Graceful degradation without a database

If `DATABASE_URL` isn't set, `src/lib/db/client.ts`'s `isDatabaseConfigured()` returns `false`
and every call site branches to a safe fallback instead of crashing:

- Server actions throw a clear, catchable "not configured" error that the calling client
  component displays inline (never an unhandled crash).
- The daily-briefing archive (`src/lib/briefing/store.ts`) falls back to an in-process `Map` —
  briefings still generate and render, they just don't persist across restarts/deploys.
- Read-only list/data pages render an empty state rather than an error.

This means the whole public app (browsing, search, news, airing, seasonal, daily brief) works
with **zero** database configured; only sign-in-gated personalization (lists, favorites,
alerts, follows, saved settings) needs `DATABASE_URL`.

## Schema (`src/lib/db/schema/*.ts`)

| Table | File | Purpose |
|---|---|---|
| `profiles` | `profiles.ts` | Per-user AniBrief settings Clerk doesn't store: timezone, region, language, accent theme, spoiler mode, brief mode/categories, streaming subscriptions, genre prefs, `isAdmin`. Keyed by `clerkUserId`, not a separate internal user id. |
| `notification_permission_state` | `profiles.ts` | Stored Web Push subscription per user (reserved; browser push isn't fully wired up yet — see `FEATURES.md`-equivalent notes in `README.md`). |
| `user_anime_list` / `user_manga_list` | `lists.ts` | Per-user watch/read lists — status, progress, score, notes, favorite flag, rewatch count. Unique on `(clerkUserId, mediaId)`. `mediaId` matches `NormalizedMedia.id` (e.g. `anilist:16498`), so it's provider-agnostic by construction. |
| `user_follows` | `lists.ts` | Followed studios/people/tags/genres. Unique on `(clerkUserId, targetType, targetId)`. |
| `import_jobs` | `lists.ts` | CSV/JSON list-import tracking: a mapping preview is stored before commit, per spec's "preview before committing" rule. |
| `user_alerts` | `alerts.ts` | User-created alert subscriptions (new episode, season premiere, birthday, etc.). |
| `notifications` | `alerts.ts` | Generated in-app notifications. Unique on `(clerkUserId, dedupeKey)` so the notification-generating cron can never double-notify for the same event — see `src/app/api/cron/notifications/route.ts`. |
| `briefings` | `briefing.ts` | One row per calendar day — the generated Daily Brief, archived. |
| `calendar_reminders` | `briefing.ts` | User-created calendar reminders. |
| `saved_news` | `briefing.ts` | Bookmarked news articles (reserved; wire up a "Save" button here as a follow-on). |
| `data_sources` | `admin.ts` | Reserved for an admin-editable news-source registry (currently the registry is in-code in `src/lib/providers/news/index.ts`'s `CATEGORY_QUERIES` — this table lets that move to the DB later without an interface change). |
| `provider_health` | `admin.ts` | Reserved for stored health snapshots; the current admin dashboard computes health live instead (see `DATA_SOURCES.md`), so this table is currently unpopulated. |
| `sync_jobs` | `admin.ts` | Admin-visible job log for every scheduled cron run — status, duration, items processed, idempotency lock key. |
| `admin_audit_logs` | `admin.ts` | Reserved for admin-action auditing. |
| `feature_flags` | `admin.ts` | Simple on/off flags, admin-editable. |
| `announcement_banner` | `admin.ts` | Single-row (`id: "current"`) site-wide banner, admin-editable, rendered in `src/components/layout/AnnouncementBanner.tsx`. |
| `trend_snapshots` | `admin.ts` | Popularity/score/favourites snapshots captured periodically (`/api/cron/trend-snapshot`) — collects data for a future trend-delta feature. **Not yet surfaced in the UI**: there isn't enough historical depth yet to show an honest "+12% this week" style delta, so none is shown, per the product rule against fabricated trend numbers. |

No table stores anime/manga/person metadata itself — that's fetched live from AniList on every
request (cached via Next's `fetch` `revalidate`) rather than mirrored into Postgres, so there's
no ingestion/sync-drift problem to manage for content data. Only *user-generated* data lives in
Neon.

## Local setup

```bash
# 1. Create a Neon project (neon.tech), or — if this app is deployed on Vercel — add
#    "Postgres (powered by Neon)" from the Vercel project's Storage tab, which sets
#    DATABASE_URL for you automatically.
# 2. Put the connection string in .env.local:
DATABASE_URL=postgres://...

# 3. Generate + apply the schema:
npm run db:generate   # diffs src/lib/db/schema/*.ts against drizzle/, writes migration SQL
npm run db:push       # applies the schema directly to DATABASE_URL (fine for a fresh project)
npm run db:studio     # optional: Drizzle Studio, a local DB browser
```

`npm run db:push` is used here instead of a `migrate` step because there's no existing
production data to preserve yet; once this schema is live in production, prefer generating a
migration (`db:generate`) and applying it explicitly rather than `push`, which can be
destructive on a schema with data in it.

## Migrations

`drizzle/0000_silly_captain_stacy.sql` is the initial schema, generated from
`src/lib/db/schema/*.ts` via `drizzle-kit generate` (see `drizzle.config.ts`). After changing a
schema file, run `npm run db:generate` again to produce the next migration — don't hand-edit
generated SQL files.
