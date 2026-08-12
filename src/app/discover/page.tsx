import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { AniListProvider } from "@/lib/providers/anilist";
import { AnimeGrid } from "@/components/anime/AnimeGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils/cn";
import { ANILIST_GENRES } from "@/lib/constants/genres";

export const metadata: Metadata = { title: "Discover" };
export const revalidate = 172800; // 2 days

/**
 * Mood/tag names referenced below were verified live against AniList's
 * `MediaTagCollection` before being hard-coded — none are guessed. The
 * genre list itself lives in `@/lib/constants/genres` (shared with
 * Settings' content-preferences chips).
 */
const GENRES: readonly string[] = ANILIST_GENRES;

interface Mood {
  id: string;
  label: string;
  genres: string[];
  tags: string[];
  /** Shown in the UI so the mapping is transparent rather than a black box. */
  note?: string;
}

const MOODS: Mood[] = [
  { id: "hype", label: "Hype", genres: ["Action"], tags: ["Super Power"] },
  { id: "relaxing", label: "Relaxing", genres: ["Slice of Life"], tags: ["Iyashikei"] },
  { id: "emotional", label: "Emotional", genres: ["Drama"], tags: ["Tragedy"] },
  { id: "dark", label: "Dark", genres: ["Horror", "Psychological"], tags: ["Gore"] },
  { id: "funny", label: "Funny", genres: ["Comedy"], tags: ["Slapstick"] },
  { id: "romantic", label: "Romantic", genres: ["Romance"], tags: [] },
  {
    id: "mind-games",
    label: "Mind games",
    genres: ["Psychological", "Thriller"],
    tags: ["Detective"],
    note: "AniList files \"Psychological\" as a genre, not a tag — used as such here.",
  },
  { id: "mystery", label: "Mystery", genres: ["Mystery"], tags: ["Detective"] },
  { id: "motivational", label: "Motivational", genres: ["Sports"], tags: ["Coming of Age"] },
  {
    id: "visually-stunning",
    label: "Visually stunning",
    genres: ["Fantasy", "Sci-Fi"],
    tags: [],
    note: "AniList has no \"visual quality\" tag — approximated as the highest-rated Fantasy/Sci-Fi titles.",
  },
];

interface Decade {
  id: string;
  label: string;
  greater?: number;
  lesser?: number;
}

const DECADES: Decade[] = [
  { id: "2020s", label: "2020s", greater: 20200101, lesser: 20291231 },
  { id: "2010s", label: "2010s", greater: 20100101, lesser: 20191231 },
  { id: "2000s", label: "2000s", greater: 20000101, lesser: 20091231 },
  { id: "1990s", label: "1990s", greater: 19900101, lesser: 19991231 },
  { id: "earlier", label: "Before 1990", lesser: 19900101 },
];

type Mode = "mood" | "genre" | "studio" | "decade" | "hidden-gems" | "short";

const MODE_TABS: { id: Mode; label: string }[] = [
  { id: "mood", label: "Mood" },
  { id: "genre", label: "Genre" },
  { id: "studio", label: "Studio" },
  { id: "decade", label: "Decade" },
  { id: "hidden-gems", label: "Hidden gems" },
  { id: "short", label: "Short & sweet" },
];

const pillBase = "rounded-full border px-2.5 py-1 text-xs transition-colors";
const pillInactive = "border-border text-muted hover:border-accent/50 hover:text-foreground";
const pillActive = "border-accent bg-accent/10 text-accent";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; mood?: string; genre?: string; studio?: string; decade?: string }>;
}) {
  const params = await searchParams;
  const mode: Mode = isMode(params.mode) ? params.mode : params.genre ? "genre" : "mood";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Discover</h1>
        <p className="mt-1 text-sm text-muted">
          Six honest ways into AniList&apos;s catalog — every list below is a live, documented query, not a
          precomputed or invented recommendation.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1 border-b border-border pb-3">
        {MODE_TABS.map((t) => (
          <Link
            key={t.id}
            href={`/discover?mode=${t.id}`}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              mode === t.id ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {mode === "mood" && <MoodSection selectedId={params.mood} />}
      {mode === "genre" && <GenreSection selectedGenre={params.genre} />}
      {mode === "studio" && <StudioSection query={params.studio} />}
      {mode === "decade" && <DecadeSection selectedId={params.decade} />}
      {mode === "hidden-gems" && <HiddenGemsSection />}
      {mode === "short" && <ShortSection />}
    </div>
  );
}

function isMode(value: string | undefined): value is Mode {
  return !!value && MODE_TABS.some((t) => t.id === value);
}

async function MoodSection({ selectedId }: { selectedId?: string }) {
  const mood = MOODS.find((m) => m.id === selectedId) ?? MOODS[0];
  const { items } = await AniListProvider.browse({
    type: "ANIME",
    genres: mood.genres,
    tags: mood.tags.length ? mood.tags : undefined,
    sort: ["SCORE_DESC"],
    perPage: 24,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        {MOODS.map((m) => (
          <Link
            key={m.id}
            href={`/discover?mode=mood&mood=${m.id}`}
            className={cn(pillBase, mood.id === m.id ? pillActive : pillInactive)}
          >
            {m.label}
          </Link>
        ))}
      </div>
      <p className="text-xs text-muted">
        <span className="font-medium text-foreground">{mood.label}</span> maps to AniList genres{" "}
        {mood.genres.map((g) => `"${g}"`).join(", ")}
        {mood.tags.length > 0 && <> and tags {mood.tags.map((t) => `"${t}"`).join(", ")}</>}, sorted by average
        score. {mood.note}
      </p>
      <AnimeGrid items={items} emptyMessage="No titles matched this mood's genre/tag combo right now." />
    </div>
  );
}

async function GenreSection({ selectedGenre }: { selectedGenre?: string }) {
  const genre = selectedGenre?.trim();
  const isKnownGenre = !!genre && GENRES.includes(genre);
  // Anime detail pages link both genres and tags through this same `?genre=`
  // param (see /anime/[id]/page.tsx) — if the value isn't one of AniList's
  // fixed genres, treat it as a tag search instead of silently failing.
  const items = genre
    ? (
        await AniListProvider.browse({
          type: "ANIME",
          genres: isKnownGenre ? [genre] : undefined,
          tags: !isKnownGenre ? [genre] : undefined,
          sort: ["SCORE_DESC"],
          perPage: 30,
        })
      ).items
    : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        {GENRES.map((g) => (
          <Link
            key={g}
            href={`/discover?mode=genre&genre=${encodeURIComponent(g)}`}
            className={cn(pillBase, genre === g ? pillActive : pillInactive)}
          >
            {g}
          </Link>
        ))}
      </div>
      {genre ? (
        <>
          <p className="text-xs text-muted">
            {isKnownGenre ? (
              <>
                Titles tagged with the AniList genre <span className="font-medium text-foreground">{genre}</span>,
                sorted by average score.
              </>
            ) : (
              <>
                &quot;{genre}&quot; isn&apos;t one of AniList&apos;s fixed genres — searched as a tag instead, sorted
                by average score.
              </>
            )}
          </p>
          <AnimeGrid items={items} emptyMessage={`Nothing matched "${genre}".`} />
        </>
      ) : (
        <EmptyState icon={SearchX} title="Pick a genre" description="Choose a genre above to browse matching titles." />
      )}
    </div>
  );
}

async function StudioSection({ query }: { query?: string }) {
  const studioQuery = query?.trim();
  const result = studioQuery ? await AniListProvider.searchStudio(studioQuery, { perPage: 30 }) : null;

  return (
    <div className="flex flex-col gap-4">
      <form action="/discover" className="flex gap-2">
        <input type="hidden" name="mode" value="studio" />
        <input
          name="studio"
          defaultValue={studioQuery}
          placeholder="Search a studio, e.g. Kyoto Animation, MAPPA…"
          className="w-full max-w-sm rounded-md border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent"
        />
        <button type="submit" className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-accent/50">
          Search
        </button>
      </form>
      <p className="text-xs text-muted">
        Uses AniList&apos;s real <code className="rounded bg-border/40 px-1 py-0.5">Studio(search: …)</code> query —
        it resolves to a single best-match studio, so try the studio&apos;s exact or near-exact name.
      </p>
      {!studioQuery ? (
        <EmptyState icon={SearchX} title="Search for a studio" description="Enter a studio name above to see its anime, sorted by popularity." />
      ) : !result?.studio ? (
        <EmptyState icon={SearchX} title="No studio found" description={`AniList had no studio matching "${studioQuery}". Try the exact studio name.`} />
      ) : (
        <>
          <p className="text-sm text-foreground">
            Showing anime from{" "}
            <a href={result.studio.sourceUrl} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">
              {result.studio.name}
            </a>
            {" "}({result.items.length} of {result.total} on AniList).
          </p>
          <AnimeGrid items={result.items} emptyMessage="This studio has no anime credits on AniList." />
        </>
      )}
    </div>
  );
}

async function DecadeSection({ selectedId }: { selectedId?: string }) {
  const decade = DECADES.find((d) => d.id === selectedId) ?? DECADES[0];
  const { items } = await AniListProvider.browse({
    type: "ANIME",
    startDateGreater: decade.greater,
    startDateLesser: decade.lesser,
    sort: ["POPULARITY_DESC"],
    perPage: 30,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        {DECADES.map((d) => (
          <Link
            key={d.id}
            href={`/discover?mode=decade&decade=${d.id}`}
            className={cn(pillBase, decade.id === d.id ? pillActive : pillInactive)}
          >
            {d.label}
          </Link>
        ))}
      </div>
      <p className="text-xs text-muted">
        Anime from <span className="font-medium text-foreground">{decade.label}</span>, by AniList popularity —
        filtered via AniList&apos;s real <code className="rounded bg-border/40 px-1 py-0.5">startDate_greater</code>/
        <code className="rounded bg-border/40 px-1 py-0.5">startDate_lesser</code> arguments.
      </p>
      <AnimeGrid items={items} emptyMessage="No titles found for this range." />
    </div>
  );
}

async function HiddenGemsSection() {
  // AniList has no direct "hidden gem" filter, and no server-side way to
  // filter by popularity relative to score. So: fetch a large, honestly
  // labeled pool of high-scoring anime, compute that pool's own popularity
  // median, and keep only the below-median-popularity half — no invented
  // threshold, just a stat computed from the fetched data itself.
  const { items: pool } = await AniListProvider.browse({
    type: "ANIME",
    sort: ["SCORE_DESC"],
    perPage: 50,
  });

  const scored = pool.filter((m) => m.averageScore != null && m.averageScore > 75 && m.popularity != null);
  const popularities = [...scored.map((m) => m.popularity as number)].sort((a, b) => a - b);
  const median = popularities.length ? popularities[Math.floor(popularities.length / 2)] : 0;
  const items = scored
    .filter((m) => (m.popularity as number) < median)
    .sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted">
        Pulled from the top {pool.length} highest-scored anime on AniList right now, kept to those with{" "}
        <span className="font-medium text-foreground">averageScore &gt; 75</span> and popularity below this
        pool&apos;s own median ({median.toLocaleString()} users on-list) — a threshold computed from the fetched
        data, not a hardcoded number.
      </p>
      <AnimeGrid items={items} emptyMessage="Couldn't find a below-median-popularity set in this pool — try again shortly." />
    </div>
  );
}

async function ShortSection() {
  const { items } = await AniListProvider.browse({
    type: "ANIME",
    episodesLesser: 14,
    sort: ["POPULARITY_DESC"],
    perPage: 30,
  });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted">
        Anime with 13 or fewer episodes (AniList&apos;s real <code className="rounded bg-border/40 px-1 py-0.5">episodes_lesser</code>{" "}
        filter), sorted by popularity — good for a single sitting or a weekend.
      </p>
      <AnimeGrid items={items} emptyMessage="No short titles matched right now." />
    </div>
  );
}
