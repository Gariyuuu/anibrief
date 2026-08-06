# FILE_MAP.md — Practical Repository Map

> Re-synced 2026-08-06 ~15:35 MST against the actual current git state (commit
> `1d1eef9`, 225 tracked files). The previous version of this file described a
> ~90-file mid-flight snapshot with "no `page.tsx` at any other path" — that is no
> longer true; every route below is real and confirmed by the `npm run build`
> output (44 routes).

## Auth & middleware

### `src/proxy.ts`
Next 16's renamed middleware convention (`AGENTS.md` calls this out explicitly).
Exports `proxy` (default export) wrapping `clerkMiddleware()`. **As of commit
`1d1eef9`, this also enforces the `/admin` gate**: `createRouteMatcher(["/admin(.*)"])`
+ `isAdminUser()` (`src/lib/utils/adminAccess.ts`), redirecting non-admins to `/`
before any rendering starts. This is the fix for a real production bug — a
layout-level-only `redirect()` didn't reliably stop an in-flight sibling render from
being serialized into the response, due to an RSC-streaming timing quirk in this
Next.js version (see the code comment in `proxy.ts` for the exact reasoning, and
`DECISIONS.md`). **Edit risk: high** — this is both the entire auth boundary and the
one place the admin-bypass fix lives; removing or narrowing the admin-route check
reopens that bug.

### `src/app/layout.tsx`
Root layout. Fonts (Geist), metadata, inline FOUC-avoidance theme script, wraps
children in `ClerkProvider` → `AppShell`. **Edit risk: medium** — touches every page.

### `src/app/admin/layout.tsx`
Gates the entire `/admin/*` subtree with the same `isAdminUser()` check as
`proxy.ts`, as defense-in-depth for client-side navigations (the middleware check
alone stops the initial request; this stops client-side route transitions that
don't re-hit the middleware in the same way). **Edit risk: high** — don't remove
without also confirming `proxy.ts` still independently blocks the route.

## Layout & navigation (`src/components/layout/`)

### `AppShell.tsx`
The visible chrome: sidebar, mobile drawer, header, `CommandPalette`, `MobileNav`,
`AnnouncementBanner`. **Edit risk: medium.**

### `NavLinks.tsx` / `MobileNav.tsx`
Read `src/lib/nav.ts`'s `navItems`/`mobileNavItems` (15 items, 5 on mobile).
**Edit risk: low.**

### `CommandPalette.tsx`
⌘K/`/`-triggered overlay. Debounced fetch to `/api/search`; results now link to
real `/anime/:id`/`/manga/:id` routes (previously 404s — fixed by those routes
being built). The unused-`Image`-import lint warning from the earlier snapshot is
gone (re-verified: `npm run lint` clean). **Edit risk: low.**

### `ThemeToggle.tsx` / `AccentPicker.tsx`
Toggle `.dark` class / `data-accent` attribute, persist to `localStorage`. The
`react-hooks/set-state-in-effect` lint errors from the earlier snapshot are fixed
via targeted `eslint-disable-next-line` comments on the initial-state-sync effect
(re-verified by reading the current file). **Edit risk: low.**

### `AnnouncementBanner.tsx`
Renders the single-row `announcement_banner` table's content when `active: true`.
Editable from `/admin` via `AnnouncementBannerForm.tsx` +
`updateAnnouncementBanner()`. **New since the earlier snapshot.** **Edit risk: low.**

## Data providers (`src/lib/providers/`)

### `anilist/` (client.ts, index.ts, mappers.ts, queries.ts, rawTypes.ts, getAnimeDetail.ts)
The primary data source, unchanged in shape from the earlier snapshot except for
the addition of `getAnimeDetail.ts` (used by `anime/[id]/page.tsx`). `mappers.ts`
now has a real unit test suite (`__tests__/mappers.test.ts`, 6 tests, all passing).
Called by nearly every page in `src/app/`. **Edit risk: high.**

### `jikan/index.ts`
Self-throttled (~1 req/s) Jikan client. **Now has one caller**
(`src/lib/admin/providerHealth.ts`, which only reads `.configured`) — up from zero
in the earlier snapshot, but its actual data method (`getRankingByMalId`) still has
zero consumers. **Edit risk: low.**

### `mal/index.ts`
Still an unconditional stub — unchanged. **Edit risk: low.**

### `news/index.ts` + `reliability.ts`
Unchanged in shape. Both have real unit tests now
(`__tests__/reliability.test.ts`, 3 tests). Called by `buildBriefing.ts` and
(new) `src/app/news/page.tsx` directly. **Edit risk: medium.**

### `streaming/index.ts`
Unchanged, pure function. **Edit risk: low.**

### `music/index.ts`
**Now has real callers**: `src/app/music/page.tsx`, `src/app/anime/[id]/music/page.tsx`
— up from zero in the earlier snapshot. Still honest mock data
(`configured: false`). **Edit risk: low.**

### `youtube/index.ts`
**Now has real callers** via the Music pages — up from zero in the earlier
snapshot. Still key-gated (`YOUTUBE_API_KEY`, unset in this local environment).
**Edit risk: low.**

### `types.ts`
`ProviderResult<T>`/`ProviderHealth` shapes + `ok()`/`fail()` helpers. **Still not
adopted by any provider** (re-verified this pass) — every provider still does its
own inline try/catch. Treat as an established-but-unadopted convention, unchanged
from the earlier snapshot's finding.

## News deduplication (`src/lib/dedup/`)

### `clusterNews.ts` / `textSimilarity.ts`
**No longer dead code** — `clusterNews` is now called from `src/app/news/page.tsx`.
Both files have real, passing unit tests (`__tests__/clusterNews.test.ts` — 3
tests, `__tests__/textSimilarity.test.ts` — 5 tests). **Edit risk: low-medium** now
that it's on a real user-facing path (it wasn't before).

## AI summarization (`src/lib/ai/`)

Unchanged in shape from the earlier snapshot. Called only by `buildBriefing.ts`. No
`ANTHROPIC_API_KEY`/`OPENAI_API_KEY` set in this local environment, so the template
fallback path is what actually runs here. **Edit risk: low.**

## Briefing (`src/lib/briefing/`)

### `buildBriefing.ts`, `store.ts`
Unchanged in shape. **Edit risk: medium.**

### `getTodaysBriefing.ts`
**No longer unreachable** — called from `src/app/page.tsx` (the home dashboard) and
`src/app/daily-brief/page.tsx`. **Edit risk: low-medium** now that it's on a
real, high-traffic path.

## Cron infrastructure (`src/lib/cron/`)

### `runCronJob.ts`
**New since the earlier snapshot.** Shared wrapper every `/api/cron/*/route.ts`
uses: takes an idempotency lock in the `sync_jobs` table before running the job
body, so overlapping/duplicate triggers are safe. Copy this pattern for any new
scheduled route. **Edit risk: high** — all 7 cron routes depend on its contract.

## Admin (`src/lib/admin/`, `src/lib/actions/admin.ts`, `src/lib/utils/adminAccess.ts`)

**Entirely new since the earlier snapshot** (the earlier snapshot found zero code
reading/writing the admin schema tables):

- `src/lib/utils/adminAccess.ts` — `isAdminUser()` (checked by both `proxy.ts` and
  `admin/layout.tsx`), `parseAdminUserIds()` (reads `ADMIN_USER_IDS`).
- `src/lib/admin/providerHealth.ts` — live health-check aggregator for the admin
  dashboard (real AniList call + every other provider's `.configured` flag).
- `src/lib/actions/admin.ts` — `toggleDataSource`, `toggleFeatureFlag`,
  `updateAnnouncementBanner`, `sendTestNotification`, all via a shared
  `requireAdmin()` guard, all writing an audit-log row via `logAudit()`.

**Edit risk: high** — this is the entire admin surface, gated by the same
`isAdminUser()` logic in two places (`proxy.ts`, `admin/layout.tsx`); keep them in
sync if the admin-check logic ever changes.

## Database (`src/lib/db/`)

Unchanged in shape from the earlier snapshot (18 tables, 5 schema files). **What
changed:** the generated migration (`drizzle/0000_silly_captain_stacy.sql`) has,
per the `1d1eef9` commit message, actually been pushed to a real, live Neon
database provisioned via Vercel's integration — treat schema edits from here on as
needing a real migration path, not a green-field `db:push`. **Edit risk: high.**

## Server actions (`src/lib/actions/`)

### `animeList.ts`, `mangaList.ts`, `alerts.ts`, `follows.ts`, `profile.ts`
Unchanged in shape from the earlier snapshot, but **all now have real UI callers**:
`AddToListButton`/`RemoveFromListButton`/`FavoriteToggleButton`/`ListStatusSelect`
(`/my-list`), `RemindMeButton` (`/alerts`, `EpisodeTimeline`), `FollowButton`/
`UnfollowChip` (`/people/[id]`, `/profile`, `/news`), the 8 settings forms
(`/settings`). **Edit risk: medium-high** now that every one of these is on a real
user path, up from "medium, mostly unreached" in the earlier snapshot.

### `calendarReminders.ts`
**New since the earlier snapshot.** Backs `/calendar`'s `AddReminderForm.tsx` and
`GET /api/calendar/ics`. **Edit risk: medium.**

### `listImport.ts`
**New since the earlier snapshot.** `parseImportPreview`/`commitImport` back
`/settings/import`'s `ImportWizard.tsx`, matching the `import_jobs` table's
preview-before-commit design. **Edit risk: medium.**

### `admin.ts`
See "Admin" section above.

## UI primitives (`src/components/ui/`)

Unchanged: `Button`, `Card`, `Badge`, `Avatar`, `Skeleton`, `EmptyState`,
`ErrorState`, `Tabs`. **Edit risk: low individually, high in aggregate** —
unchanged assessment.

## Feature components

- `src/components/home/` — unchanged set, **now actually rendered** by `src/app/page.tsx`.
- `src/components/briefing/` — **new**: `DailyBriefView`, `BriefModeToggle`,
  `BriefActions`. See `DailyBriefView.tsx`'s note above re: the RSC-boundary bug fix.
- `src/components/anime/`, `src/components/news/` — unchanged, now reachable.
- `src/components/people/` — **new**: `PersonCard`.
- `src/components/airing/` — **new**: `AiringByDay`.
- `src/components/calendar/` — **new**: `CalendarView`, `AddReminderForm`.
- `src/components/actions/` — grew from 2 to 7 components: `AddToListButton`,
  `RemoveFromListButton`, `FavoriteToggleButton`, `ListStatusSelect`,
  `RemindMeButton`, `FollowButton`, `UnfollowChip`.
- `src/components/admin/` — **new**: `AnnouncementBannerForm`, `DataSourceToggle`,
  `FeatureFlagToggle`, `TestNotificationButton`.
- `src/components/settings/` — **new**, 8 forms: `AppearanceForm`, `BriefPrefsForm`,
  `ContentPrefsForm`, `NotificationsForm`, `PrivacyForm`, `RegionForm`,
  `SpoilerForm`, `StreamingForm`.
- `src/components/import/` — **new**: `ImportWizard`.
- `src/components/pwa/` — **new**: `OfflineBanner`, `ServiceWorkerRegister`.
- `src/components/brand/` — unchanged: `Logo`, `Mark`.

## App-router file-convention routes (`src/app/`)

**Every route in `src/lib/nav.ts` (15 items) now has a real `page.tsx`.** Full list
per the `npm run build` output (44 routes total):

- `/` (home), `/daily-brief` (+ `/archive`, `/archive/[date]`), `/news`, `/airing`,
  `/seasonal`, `/anime` (+ `/[id]` + 5 tab sub-routes: characters, music, news,
  relations, staff, statistics), `/manga` (+ `/[id]` + 3 tab sub-routes:
  characters, news, relations), `/music`, `/people` (+ `/[id]`), `/calendar`,
  `/discover`, `/my-list`, `/alerts`, `/profile`, `/settings` (+ `/import`),
  `/admin`, `/whats-new`, `/sign-in/[[...sign-in]]`, `/sign-up/[[...sign-up]]`.
- `api/search/route.ts`, `api/calendar/ics/route.ts`,
  `api/cron/{birthdays,daily-brief,notifications,refresh-airing,refresh-news,
  refresh-seasonal,trend-snapshot}/route.ts` — all real.
- `manifest.ts`, `icon.tsx`, `apple-icon.tsx`, `opengraph-image.tsx`,
  `pwa-icon/{192,512}/route.tsx`, `error.tsx`, `loading.tsx`, `not-found.tsx` — all
  present (the earlier snapshot found only `manifest.ts`/icons, no
  `error.tsx`/`loading.tsx`/`not-found.tsx`).

## Configuration files

| File | Purpose | Edit risk |
|---|---|---|
| `next.config.ts` | `images.remotePatterns` | Low |
| `tsconfig.json` | Strict TS, `@/*` → `src/*` path alias | Medium |
| `eslint.config.mjs` | Flat config, `eslint-config-next` | Low |
| `postcss.config.mjs` | `@tailwindcss/postcss` plugin | Low |
| `drizzle.config.ts` | Points at `src/lib/db/schema/index.ts`, `dialect: "postgresql"` | Medium |
| `vercel.json` | 7 real cron declarations, once-daily/staggered for Hobby-plan compatibility — all 7 target routes exist | Medium |
| `.env.example` | Real, comprehensive, placeholder-only env template — **new since the earlier snapshot** | Low |
| `.gitignore` | Standard Next.js ignores + `.env*` except `.env.example` | Low |
| `skills-lock.json`, `.claude/skills/`, `.agents/skills/` | Neon/neon-postgres skill packages — **new in commit `1d1eef9`** | Low |

## Where to make common changes

Unchanged guidance from the earlier snapshot, still accurate:

- **Add a new page/route:** create `src/app/<route>/page.tsx`. Every `nav.ts` route
  already has one — a genuinely new route would be additive to the current 15.
- **Change auth behavior:** `src/proxy.ts` (route matching + the admin gate) and
  `layout.tsx`'s `ClerkProvider`. Per-component gating uses
  `<Show when="signed-in">`/`<Show when="signed-out">` (this Clerk SDK version
  doesn't export `SignedIn`/`SignedOut` — see `CONTRIBUTING.md`) or `useUser()`
  (client) or `auth()` (server).
- **Change the DB schema:** edit the relevant file under `src/lib/db/schema/`, run
  `npm run db:generate`. **The schema has already been pushed to a real, live
  database** (per the `1d1eef9` commit) — treat this as a production schema now,
  not a green-field one.
- **Add an env var:** reference via `process.env.X` in a `server-only`-marked
  module, document it in `.env.example` and `CLAUDE.md`'s env var table (both now
  real and current — keep them in sync).
- **Change styling/theme:** CSS custom properties + accent variants in
  `globals.css`; the accent option list in `src/lib/theme.ts`.
- **Change deployment/cron config:** `vercel.json` — every declared schedule now
  has a real matching route; keep that 1:1 mapping intact.
- **Add a new external integration:** follow the existing provider pattern.
- **Add an admin action:** follow `src/lib/actions/admin.ts`'s `requireAdmin()` +
  `logAudit()` pattern.
