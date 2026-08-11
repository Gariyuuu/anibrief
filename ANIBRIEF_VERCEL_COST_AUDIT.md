# AniBrief Vercel Cost Incident

## Incident 2 (2026-08-11): cache-miss storm → Function invocation spike

**This is a different incident from the one below** (that one was Image
Optimization billing, fixed in `6e158cb`; this one is Function invocations,
via a retry-storm bug plus an incomplete crawler block from that same fix).
Cost: ~$10.

**Observed:** Data/edge cache hit rates dropped to near zero on the per-id
detail routes while invocations spiked; total incoming request volume stayed
flat; same deployment served traffic before/throughout (rules out a bad
deploy); outbound calls to `graphql.anilist.co` spiked, almost all 429s,
already elevated before the spike; inbound traffic was dominated by Meta's
`meta-externalagent` crawler at a steady rate (not a traffic increase).

**Root cause (two compounding bugs, not one):**
1. `src/lib/providers/anilist/client.ts` retried every AniList call 3×
   (800ms/1600ms backoff) **including on 429**. AniList's shared budget is
   ~30 req/min for the whole app; retrying a 429 spends more of an
   already-exhausted budget and prolongs the outage for every other
   concurrent render. A failed render is never cached (Next only caches `ok`
   fetches), so the next request for that same page repeated the entire
   3× storm — this is why cache hit rate collapsed toward zero while
   invocations spiked with flat incoming traffic.
2. The Incident 1 `robots.ts` fix blocked the per-id **tab** subroutes
   (`characters`, `staff`, `relations`, …) but left `/anime/[id]`,
   `/manga/[id]`, `/people/[id]`, and `/characters/[id]` **themselves**
   crawlable — the actual unbounded id space. `meta-externalagent` walking
   those mints a guaranteed-fresh, guaranteed-AniList-hitting render for
   every previously-unseen id, all day, every day.

**Fixes applied:**
- `src/lib/utils/retry.ts` — `withRetry` now accepts `shouldRetry(error)`;
  a 429 is no longer retried, it fails fast.
- `src/lib/providers/anilist/client.ts` — a 429 now trips a process-wide
  60s cooldown (`rateLimitedUntil`); any call during that window fails
  immediately without hitting AniList at all, capping outbound calls during
  a rate-limit event instead of every concurrent render retrying it.
- `src/app/robots.ts` — disallow is now `/anime/*`, `/manga/*`, `/people/*`,
  `/characters/*` (the whole unbounded subtree, not just the tabs). Bounded
  browse/list pages (`/anime`, `/manga`, `/people`, `/discover`, `/seasonal`,
  `/news`, `/airing`, `/calendar`, `/music`, `/`) stay crawlable.
- `src/proxy.ts` — active enforcement: known AI-training/scraper user agents
  (`meta-externalagent`, `GPTBot`, `CCBot`, `Bytespider`, `ClaudeBot`,
  `anthropic-ai`, `PerplexityBot`, `Amazonbot`, `Google-Extended`) get a 403
  on the unbounded-catalog routes, since `robots.txt` only restrains bots
  that choose to honor it — this was flagged as "the next layer" in
  Incident 1's "Remaining Risks" and never built until now. Real search
  crawlers (Googlebot/Bingbot) are not blocked.

**Verification:** `npm run typecheck && npm run lint && npm run test && npm
run build` all pass, 52 routes. Not yet deployed/observed in production —
watch the next AniList rate-limit event (if any) to confirm invocations no
longer spike.

**Residual risk:** the circuit-breaker cooldown is per-Lambda-instance
in-memory state, not shared across concurrent instances — under Vercel's
scale-out, multiple instances can each independently rate-limit-and-cooldown
rather than sharing one global cooldown. This is a real gap, not a full
guarantee; it still caps each instance's amplification to ~1 retry-storm
instead of unbounded ones, and the robots.txt + UA-block layer is the
actual hard cap on request volume regardless.

---


## Observed Problem

Approximately $15 of unexpected Vercel usage generated rapidly, including usage
while the owner was not actively using AniBrief. Vercel's account-level billing
showed extremely high Image Optimization usage (hundreds of thousands of image
transformations), with AniBrief identified as the primary offending project.

## Root Cause

**Every remote image in the app (AniList posters/character/staff art, YouTube
thumbnails, Spotify album art) was being routed through Vercel's Image
Optimization pipeline, against an effectively unbounded, constantly-refreshing
catalog of unique image URLs, using a `next.config.ts` that accepted Next's full
default 8-width `deviceSizes` array.** Combined with fully public, fully dynamic
per-id detail routes (no `generateStaticParams`, no auth, no `robots.txt`), this
meant that:

1. Every unique anime/manga/character/staff/person image AniBrief had never
   rendered before produced a **new**, billed transformation on first request —
   there was no way to "warm the cache" against AniList's catalog because it is
   effectively unbounded (tens of thousands of media entries, each with a unique
   banner, cover, and cast of unique character/staff portraits).
2. `AnimeCard.tsx`'s poster `sizes="(max-width: 640px) 33vw, (max-width: 1024px)
   20vw, 160px"` and `AnimeDetailHeader.tsx`'s banner `<Image fill />` (no
   `sizes` at all, defaulting to `100vw`) both contain a `vw` unit, which forces
   Next to generate a srcset across the **entire** `deviceSizes` array (8 widths
   up to 3840px) rather than the small `imageSizes` array — a poster displayed at
   ~160px was eligible to generate a 3840px-wide optimized variant.
3. Default `formats: ['image/avif', 'image/webp']` doubles that again into up to
   16 cached variants per unique image.
4. `AnimeGrid` (used on 7 pages: `/anime`, `/manga`, `/discover`, `/seasonal`,
   `/profile`, and the "relations" section of every `/anime/[id]` and
   `/manga/[id]`) renders up to 30 `AnimeCard`s per page load — so a single page
   view could mint up to `30 × 8 × 2 = 480` new transformations.
5. This ran with **zero bot protection**: no `robots.txt` existed, so any
   crawler or scraper following AniList-catalog links through
   characters/staff/relations tabs could walk deep into the id space, hitting
   pages the owner never visited and minting brand-new billed image
   transformations the whole time — this is why usage continued while the
   owner was away.

## Evidence

**Files/components:**
- `next.config.ts` — `images.remotePatterns` allowed `s4.anilist.co`,
  `img.youtube.com`, `i.ytimg.com`, `i.scdn.co`, `mosaic.scdn.co`,
  `image-cdn-ak.spotifycdn.com`, `image-cdn-fa.spotifycdn.com`; no
  `deviceSizes`/`imageSizes`/`formats` override (Next defaults used); no
  `unoptimized`.
- `src/components/anime/AnimeCard.tsx:25-31` — `sizes="(max-width: 640px) 33vw,
  (max-width: 1024px) 20vw, 160px"` on a poster thumbnail.
- `src/components/anime/AnimeDetailHeader.tsx:34` — banner `<Image fill />`
  with no `sizes` prop (defaults to `100vw`), rendered on every anime/manga
  detail page.
- `src/components/anime/AnimeGrid.tsx` — renders up to 30 `AnimeCard`s per
  page; used from `src/app/{anime,manga,discover,seasonal,profile}/page.tsx`
  and both `anime/[id]/page.tsx` / `manga/[id]/page.tsx`.
- No `src/app/robots.ts`, no `public/robots.txt` existed before this fix —
  every dynamic id route was fully open to any crawler.
- No `generateStaticParams` anywhere in the repo — every `/anime/[id]`,
  `/manga/[id]`, `/people/[id]`, `/characters/[id]` (and their tab subroutes)
  is rendered on-demand for any id, real or not.

**Image hosts (all external, all already pre-sized by their own CDN):**
`s4.anilist.co` (AniList serves a fixed `large` variant, ~230px wide — smaller
than several of Next's default `deviceSizes` buckets, meaning some
transformations were literally upscaling), `img.youtube.com`/`i.ytimg.com`
(YouTube's fixed `high` thumbnail, always 480×360), `i.scdn.co` and Spotify's
CDN hosts (fixed preset sizes, e.g. 640×640/300×300/64×64 — see "Remaining
Risks" below on which one the code picks).

## Image Optimization Analysis

- **Images/page:** browse/grid pages (`/anime`, `/manga`, `/discover`,
  `/seasonal`) render up to 30 posters each; a single `/anime/[id]` detail page
  renders a banner + cover + up to a dozen related-media posters; its
  `characters`/`staff` tabs render dozens of cast portraits.
- **Possible variants per unique image:** up to 8 `deviceSizes` widths × 2
  formats (avif/webp) = **up to 16** transformations for a single poster or
  banner that would only ever need one or two real sizes.
- **Possible transformations/page:** a browse page alone could mint up to
  `30 posters × 16 = 480` new transformations on a single cold view; a
  characters/staff tab could add another few hundred for a cast-heavy title.
- Given AniList's catalog size (tens of thousands of anime/manga, each with a
  unique cast), the pool of "never-seen-before" images is effectively
  unbounded, so cache hits were rare and most traffic produced net-new billed
  transformations. **This plausibly explains hundreds of thousands of
  transformations and ~$15 of usage in a short window**, especially under any
  crawler traffic (see below).

## Background Activity

- **7 Vercel Cron jobs** (`vercel.json`) — each runs once daily, staggered,
  wrapped in an idempotency lock (`runCronJob.ts`). Cheap; not a driver of this
  incident.
- **`EpisodeTimeline.tsx`** has a client-side `setInterval(..., 60_000)` that
  only forces a local re-render (a live countdown), no network request — not a
  cost driver.
- No polling loops, no recursive `fetch`, no runaway `useEffect` dependency
  cycles were found anywhere in `src/`.
- **ISR `revalidate` windows** (5–60 min across list/detail pages) are
  reasonable and were not changed.
- The real "activity without a visitor" driver was **inbound crawler/bot
  requests** to pages that had never been rendered before, each producing new
  image transformations — not anything AniBrief's own code was doing in the
  background.

## Bot Exposure

Yes — plausibly a primary contributor. Before this fix:
- No `robots.txt` existed at all, so every dynamic route (including deep tab
  routes on every single anime/manga id) was fully crawlable by any bot, not
  just well-behaved search engines.
- No rate limiting exists anywhere in the app (a pre-existing, documented gap —
  see `CLAUDE.md`/`SECURITY.md`).
- Internal links (relations, characters, staff, cast credits) transitively
  expose large swaths of AniList's real id space, so a crawler following links
  organically could reach many thousands of distinct, never-cached pages —
  each producing brand-new image transformations — entirely independent of the
  owner's own browsing.

## Fixes Applied

1. **`next.config.ts`** — added `images.unoptimized: true`. Every remote image
   this app renders is already a small, pre-sized, CDN-compressed image from
   its own origin (AniList/YouTube/Spotify); there is no oversized original for
   Vercel to usefully shrink. This sends the original CDN URL straight to the
   browser (same bytes, same responsive `sizes`/`fill` layout, still
   lazy-loaded by default) and **removes Vercel Image Optimization billing for
   this app entirely** — the direct fix for the root cause above. No local
   (`next/image`-via-`/public`) images exist in the app, so this has no effect
   on any static asset.
2. **`src/app/robots.ts`** (new) — disallows `/api/`, `/admin`, and the
   signed-in-only personal pages (`/my-list`, `/profile`, `/settings`,
   `/alerts`), plus the per-id tab subroutes (`characters`, `staff`,
   `relations`, `statistics`, `news`, `music`) that multiply crawl surface per
   title for low standalone SEO value. Main overview pages
   (`/`, `/anime`, `/anime/[id]`, `/manga`, `/manga/[id]`, `/people`,
   `/people/[id]`, `/characters/[id]`, `/news`, `/seasonal`, `/discover`,
   `/airing`, `/calendar`, `/music`, `/daily-brief`) remain crawlable — Google
   is not blocked. No `sitemap.xml` was added, deliberately: a sitemap
   enumerating every AniList id would hand crawlers exactly the kind of
   exhaustive id list that caused this incident.

No UI, feature, caching window, or visual quality was changed. `AnimeCard`'s
and `AnimeDetailHeader`'s `sizes`/`fill` props were left as-is — they no longer
matter for cost now that optimization is off, and changing them risked touching
more surface than necessary for a pure cost fix.

## Expected Cost Reduction

- **Before:** every never-before-seen remote image (an effectively unbounded
  pool, given AniList's catalog) could mint up to 16 billed transformations on
  first render, with no bot protection gating how many "never-before-seen"
  pages got requested per day.
- **After:** zero Vercel Image Optimization transformations for this app —
  images are served directly from their origin CDN, and crawler-reachable
  surface area (which was the main channel for driving "new" images while the
  owner was away) is reduced via `robots.txt`.
- **Estimated reduction: ~100% of the Image Optimization line item** for
  AniBrief specifically, which was described as "the primary offending
  project." Function-invocation and fetch-bandwidth costs (from page renders
  and AniList/Jikan/YouTube/Spotify API calls) are unaffected by this change
  and remain low relative to what Image Optimization was generating, per the
  existing 5–60 min ISR caching already in place.

## Remaining Risks

- **Browser-side bandwidth**: `raw.album.images[0]?.url` in
  `src/lib/providers/spotify/index.ts:46` picks Spotify's **largest** cover-art
  variant (typically 640×640) even though it's displayed at 48–64px in
  `SelectableTrackCard`/`TrackSelector`. This no longer costs Vercel Image
  Optimization money (optimization is off), but it is unnecessary client
  bandwidth — worth picking a smaller preset variant from Spotify's own
  `images` array in a future pass.
- **No rate limiting** on `/api/search`, `/api/calendar/ics`, or any server
  action — a pre-existing gap (already documented in `SECURITY.md`) that could
  still let a scripted client drive up Function-invocation and external-API
  costs, independent of images.
- **`robots.txt` only restrains well-behaved crawlers.** It does not stop a
  scraper that ignores it. If usage recurs after this fix, the next layer is
  IP/UA-based rate limiting in `src/proxy.ts`.
- **Function invocations and AniList/Jikan/YouTube API calls still scale with
  crawler traffic** (page renders aren't free even with images fixed) — the
  existing 5–60 min `revalidate` windows cap this per unique path, but a
  crawler hitting many thousands of distinct never-cached ids per day would
  still generate real, if far smaller, Vercel usage.
