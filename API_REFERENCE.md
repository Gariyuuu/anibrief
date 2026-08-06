# API_REFERENCE.md

> Snapshot: 2026-08-06 05:59:28 MST. No secrets appear in any example
> below — all example values are placeholders.

## Route Handlers (real HTTP endpoints)

### `GET /api/search`

- **Source file:** `src/app/api/search/route.ts`.
- **Purpose:** Server-side proxy so the (server-only) AniList client can
  be queried from the client-side command palette without exposing
  provider internals or making AniList calls directly from the browser.
- **Auth/authz:** None — public, unauthenticated.
- **Params:** query string `q` (string). Requests with `q` missing or
  trimmed length `< 2` short-circuit to an empty result (no AniList call
  made).
- **Request:** none (GET, no body).
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
  Up to 6 anime + 4 manga results (`perPage` hardcoded in the route).
- **Status codes:** always `200` in the current implementation — even
  an AniList failure returns `200` with empty arrays, because
  `AniListProvider.searchMedia` itself never throws (see
  `ARCHITECTURE.md`'s error-handling section). There is no explicit
  error status path in this route.
- **Validation:** trims and length-checks `q` only; no other input
  validation (no `zod` schema — see `SECURITY.md`).
- **Side effects:** none (read-only).
- **DB ops:** none.
- **External calls:** `AniListProvider.searchMedia(q, "ANIME", {perPage:
  6})` and `("MANGA", {perPage: 4})` in parallel, each hitting AniList's
  public GraphQL endpoint (`https://graphql.anilist.co`).
- **Errors:** any AniList/network failure is caught inside the provider
  and surfaces as an empty result set, not an HTTP error — callers
  cannot currently distinguish "no matches" from "search backend down."

## Next.js file-convention "routes" (not general-purpose APIs)

These respond to specific Next.js-internal requests (favicon fetch, OG
image crawl, PWA manifest fetch) rather than being general APIs. Listed
for completeness since they are technically served over HTTP.

| Path | Source file | Returns |
|---|---|---|
| `/icon` | `src/app/icon.tsx` | 32×32 PNG (generated) |
| `/apple-icon` | `src/app/apple-icon.tsx` | 180×180 PNG (generated) |
| `/opengraph-image` | `src/app/opengraph-image.tsx` | 1200×630 PNG (generated) |
| `/manifest.webmanifest` | `src/app/manifest.ts` | PWA manifest JSON |
| `/pwa-icon/192` | `src/app/pwa-icon/192/route.tsx` | 192×192 PNG (generated) |
| `/pwa-icon/512` | `src/app/pwa-icon/512/route.tsx` | 512×512 PNG (generated), reuses the `/pwa-icon/192` GET handler's pattern at 512 size |

None of these take params, require auth, or touch the DB.

## Server Actions (`"use server"` — not HTTP routes, but the app's
mutation surface)

Called directly from client components via Next's server-action RPC
mechanism, not `fetch`. All 5 files share the same `requireUser()`
pattern: throws `Error("Sign in to ...")` if no Clerk session, throws
`Error("... isn't available yet — DATABASE_URL isn't configured for
this deployment.")` if `!isDatabaseConfigured()`.

### `src/lib/actions/animeList.ts`

| Action | Auth | DB op | Side effects |
|---|---|---|---|
| `addOrUpdateAnimeListEntry(input)` | required | `INSERT ... ON CONFLICT (clerk_user_id, media_id) DO UPDATE` on `user_anime_list` | `revalidatePath("/my-list")` |
| `removeAnimeListEntry(mediaId)` | required | `DELETE` on `user_anime_list` | `revalidatePath("/my-list")` |
| `toggleAnimeFavorite(mediaId, isFavorite)` | required | `UPDATE` on `user_anime_list` | `revalidatePath("/my-list")` |
| `markEpisodeWatched(mediaId, mediaTitle, coverImage, episode)` | required | `INSERT ... ON CONFLICT DO UPDATE` (sets `status: "watching"`) | `revalidatePath("/my-list")`, `revalidatePath("/airing")` |
| `getUserAnimeList(userId)` | none enforced internally (caller must pass a `userId`; not gated by the caller's own session) | `SELECT` on `user_anime_list` | none |

**Note:** `getUserAnimeList` takes a `userId` parameter directly rather
than deriving it from `auth()` — if ever called from a context where the
caller controls `userId`, this would let one user read another user's
list. In the current snapshot it has zero callers, so this is a latent
risk, not an active vulnerability — flagged in `SECURITY.md`.

### `src/lib/actions/mangaList.ts`

Same shape as `animeList.ts` minus `markEpisodeWatched`/
`toggleAnimeFavorite`: `addOrUpdateMangaListEntry`,
`removeMangaListEntry`, `getUserMangaList(userId)` (same `userId`-param
caveat as above). Table: `user_manga_list`.

### `src/lib/actions/alerts.ts`

| Action | Auth | DB op |
|---|---|---|
| `createAlert(input)` | required | `INSERT ... ON CONFLICT DO NOTHING` on `user_alerts` |
| `deleteAlert(id)` | required | `DELETE` on `user_alerts` (scoped to `clerk_user_id`) |
| `getUserAlerts(userId)` | not internally enforced (same caveat) | `SELECT` on `user_alerts` |
| `getUserNotifications(userId, limit=30)` | not internally enforced | `SELECT` on `notifications`, ordered by `created_at desc` |
| `markNotificationRead(id)` | required | `UPDATE` on `notifications` (scoped to `clerk_user_id`) |

### `src/lib/actions/follows.ts`

| Action | Auth | DB op |
|---|---|---|
| `followTarget(targetType, targetId, targetLabel)` | required | `INSERT ... ON CONFLICT DO NOTHING` on `user_follows` |
| `unfollowTarget(targetType, targetId)` | required | `DELETE` on `user_follows` |
| `getUserFollows(userId)` | not internally enforced | `SELECT` on `user_follows` |

### `src/lib/actions/profile.ts`

| Action | Auth | DB op |
|---|---|---|
| `getOrCreateProfile(userId)` | not internally enforced (no `requireUser()` call — only checks `isDatabaseConfigured()`) | `SELECT`, then `INSERT ... RETURNING` if no row exists |
| `updateProfile(patch)` | required (calls `auth()` directly, not via `requireUser()`) | `INSERT ... ON CONFLICT (clerk_user_id) DO UPDATE`, then `revalidatePath("/settings")` + `revalidatePath("/profile")` |

**Note:** `getOrCreateProfile` takes a raw `userId` param with **no auth
check of its own** — it will create a profile row for whatever id is
passed. Zero callers exist in this snapshot, so no active exposure, but
flagged in `SECURITY.md` as needing a caller-side or internal auth check
before it's wired to any UI.

## What does NOT exist

- No `/api/cron/*` routes despite 7 being declared in `vercel.json`
  (`refresh-airing`, `refresh-news`, `refresh-seasonal`, `birthdays`,
  `trend-snapshot`, `daily-brief`, `notifications`).
- No webhook endpoints (no Clerk webhook handler, no Stripe/payment
  webhook, nothing under `src/app/api/webhooks/` or similar).
- No GraphQL endpoint of AniBrief's own (AniList's GraphQL API is
  consumed, not exposed).
- No `/api/anime/[id]` or similar detail-fetch route — the (not yet
  built) `/anime/[id]` page would call `AniListProvider` directly from a
  Server Component rather than through an API route, per the pattern
  every other planned page would presumably follow.
- No authentication endpoints of AniBrief's own — Clerk's hosted
  endpoints (not part of this codebase) handle sign-in/up entirely.
