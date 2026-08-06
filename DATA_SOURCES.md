# Data Sources

AniBrief never scrapes or streams copyrighted video/manga/music. Every provider below either
calls a public/official API for metadata, or aggregates publicly available RSS headlines with
full attribution and a link back to the original source. See the footer disclaimer and
`src/lib/providers/` for the code.

Every provider follows the same shape: a `.configured` boolean, typed async methods that never
throw for "not configured" (they log and return `null`/`[]`), and — where relevant — real
implementations gated purely on whether a credential is present. The UI never fetches a
third-party API directly; it always goes through `src/lib/providers/<name>/index.ts`.

## Primary: AniList (`src/lib/providers/anilist/`)

**No API key required** — `https://graphql.anilist.co` is AniList's public, unauthenticated
GraphQL endpoint (subject to their rate limit, roughly 30 req/min; the provider caches every
query via Next's `fetch` `revalidate` option, from 5 minutes for search to an hour for
birthdays, to stay well under it).

Powers: anime + manga metadata, seasonal browsing, airing schedules, characters, voice actors,
staff (directors/composers/producers), studios, genres/tags, popularity/score, recommendations,
related media, trailer links (when AniList has one), and real-person birthdays (`isBirthday:
true` — AniList only supports filtering by the *current* day, not a date range; the "upcoming
birthdays" feature works around that honestly by paging popular staff and computing proximity
from `dateOfBirth`, rather than pretending AniList can do a range query it can't).

Typed queries live in `src/lib/providers/anilist/queries.ts`; raw response shapes in
`rawTypes.ts`; mapping into this app's `NormalizedMedia`/`NormalizedPerson` types happens in
`mappers.ts`. Add new queries there rather than inlining GraphQL in page files.

## MyAnimeList official API (`src/lib/providers/mal/`)

Modular but **not implemented in this deployment** — the official MAL API needs a registered
OAuth client (`MAL_CLIENT_ID`/`MAL_CLIENT_SECRET`, see https://myanimelist.net/apiconfig).
`MyAnimeListProvider.configured` is `false` without it, and every method returns `null` with a
logged reason rather than throwing. AniList already covers ranking/popularity/seasonal data in
the meantime, so nothing in the UI is blocked on this.

## Jikan (`src/lib/providers/jikan/`)

Optional **supplementary** fallback for public MyAnimeList data via `https://api.jikan.moe/v4`
(also no key required). Jikan explicitly rate-limits aggressively (~3 req/s, 60/min) and asks
API consumers not to hammer it, so this module runs every call through a tiny in-process
1-req/second queue and treats failures as non-fatal (logs a warning, returns `null`). It is
never called from the client and never used as a primary data path — only for supplementary MAL
numbers AniList doesn't expose (e.g. `JikanProvider.getRankingByMalId`).

## News (`src/lib/providers/news/`)

Aggregates anime/manga/music/industry/streaming/games/movies/people news via free, keyless
Google News RSS search (the same technique the sibling MarketBrief project uses for financial
news), fanned out across a handful of category-specific queries defined in-code in
`CATEGORY_QUERIES` (a future `data_sources` DB table — already in the schema — can make this
admin-editable without changing the provider's interface). Every article keeps its original
`url`, `publisher`, and `publishedAt`; **no article body is ever republished**, only the
headline and whatever short snippet the RSS feed itself provides.

- Reliability labeling (`src/lib/providers/news/reliability.ts`): a curated allowlist of
  established anime/entertainment outlets marks matches "reputable"; everything else is shown
  but unlabeled — never silently hidden.
- Rumor detection: a keyword heuristic (`reportedly`, `sources say`, `unconfirmed`, `leaked`,
  `allegedly`, ...) flags likely-unconfirmed stories so the News page's Rumors tab and each
  article's "Unconfirmed" badge are honest about what's speculative vs. reported.
- Duplicate clustering (`src/lib/dedup/clusterNews.ts`): near-identical headlines within a
  72-hour window (URL match, or Jaccard similarity ≥ 0.55 on normalized headline tokens) collapse
  into one story with every source's original link preserved and expandable — never a single
  merged/rewritten article.

## YouTube (`src/lib/providers/youtube/`)

Real implementation, gated on `YOUTUBE_API_KEY` (Google Cloud Console → enable "YouTube Data API
v3"). Without a key, trailer/PV search returns `[]` and the UI shows an explicit "not
configured" state rather than a guessed/possibly-wrong video embed. When configured, results
carry the real video ID, channel name, and thumbnail — this app never fabricates or guesses a
YouTube video ID, since an unverified guess risks silently pointing at the wrong (or no) video.

## Music (`src/lib/providers/music/`)

No Spotify/MusicBrainz/YouTube-Music credential is configured in this deployment. Rather than
leaving the Music hub empty, `MusicProvider` serves a small, hand-curated set of real,
publicly-documented OP/ED song and artist credits (`MusicProvider.configured` is `false`, and
the Music page leads with a visible "not a live sync" notice). Listen links point to a YouTube
*search* for the track, not a specific video ID, for the same reason as the YouTube provider
above — an unverified guessed ID is worse than an honest search link.

## Streaming availability (`src/lib/providers/streaming/`)

Not a separate API — derived directly from AniList's `externalLinks` field, which AniList
populates from titles' officially-declared streaming platforms (Crunchyroll, Netflix, Hulu,
etc.). Real, licensed-source data; nothing scraped or inferred.

## Provider health & the `data_sources` / `provider_health` tables

The DB schema (`src/lib/db/schema/admin.ts`) has tables reserved for admin-editable source
registries and stored health snapshots. The current admin dashboard computes provider health
*live* (a cheap real request/config check per provider) rather than depending on a
cron-populated table, so it stays accurate even before the scheduled jobs have run.

## Legal notes

- No pirated streaming or manga links are ever shown — every link goes to the source's own site
  (AniList, the publisher, the official streaming platform, or the original news article).
- AniBrief is not affiliated with, endorsed by, or partnered with AniList, MyAnimeList,
  Crunchyroll, YouTube, or any publisher/studio — see the footer disclaimer in
  `src/components/layout/AppShell.tsx`.
- Attribution (source name + link) is preserved everywhere a third-party source's data is shown.
