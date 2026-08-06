import type { Metadata } from "next";
import Link from "next/link";
import { AniListProvider, type MediaSort } from "@/lib/providers/anilist";
import { AnimeGrid } from "@/components/anime/AnimeGrid";
import { currentSeason, adjacentSeason, seasonLabel } from "@/lib/utils/season";
import { cn } from "@/lib/utils/cn";
import type { AiringSeason, MediaFormat } from "@/lib/types/media";

export const metadata: Metadata = { title: "Seasonal Anime" };
export const revalidate = 3600;

const SORT_OPTIONS: { id: MediaSort; label: string }[] = [
  { id: "POPULARITY_DESC", label: "Popularity" },
  { id: "SCORE_DESC", label: "Average score" },
  { id: "TRENDING_DESC", label: "Trending" },
  { id: "FAVOURITES_DESC", label: "Most favorited" },
  { id: "START_DATE_DESC", label: "Newest" },
];

const FORMATS: MediaFormat[] = ["TV", "TV_SHORT", "MOVIE", "OVA", "ONA", "SPECIAL"];

export default async function SeasonalPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string; year?: string; sort?: string; format?: string }>;
}) {
  const params = await searchParams;
  const { season: curSeason, year: curYear } = currentSeason();

  const season = (params.season as AiringSeason) ?? curSeason;
  const year = params.year ? Number(params.year) : curYear;
  const sort = (params.sort as MediaSort) ?? "POPULARITY_DESC";
  const format = params.format as MediaFormat | undefined;

  const prev = adjacentSeason(season, year, -1);
  const next = adjacentSeason(season, year, 1);

  const { items, total } = await AniListProvider.browse({
    type: "ANIME",
    season,
    seasonYear: year,
    sort: [sort],
    formats: format ? [format] : undefined,
    perPage: 48,
  });

  const genreCounts = new Map<string, number>();
  const studioCounts = new Map<string, number>();
  for (const item of items) {
    for (const g of item.genres) genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
    for (const s of item.studios) studioCounts.set(s, (studioCounts.get(s) ?? 0) + 1);
  }
  const topGenres = [...genreCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  function seasonHref(s: AiringSeason, y: number) {
    return `/seasonal?season=${s}&year=${y}${sort !== "POPULARITY_DESC" ? `&sort=${sort}` : ""}${format ? `&format=${format}` : ""}`;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{seasonLabel(season, year)}</h1>
          <p className="mt-1 text-sm text-muted">{total.toLocaleString()} titles tracked by AniList this season.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link href={seasonHref(prev.season, prev.year)} className="rounded-md border border-border px-2.5 py-1 hover:border-accent/50">
            ← {seasonLabel(prev.season, prev.year)}
          </Link>
          <Link
            href={seasonHref(curSeason, curYear)}
            className={cn("rounded-md border px-2.5 py-1", season === curSeason && year === curYear ? "border-accent text-accent" : "border-border hover:border-accent/50")}
          >
            Current
          </Link>
          <Link href={seasonHref(next.season, next.year)} className="rounded-md border border-border px-2.5 py-1 hover:border-accent/50">
            {seasonLabel(next.season, next.year)} →
          </Link>
        </div>
      </div>

      {topGenres.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
          <span className="font-medium">Genre mix (this page):</span>
          {topGenres.map(([g, c]) => (
            <span key={g} className="rounded-full border border-border px-2 py-0.5">
              {g} ({c})
            </span>
          ))}
          <span className="ml-2 font-medium">{studioCounts.size} studios represented</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <span className="text-xs font-medium text-muted">Sort:</span>
        {SORT_OPTIONS.map((opt) => (
          <Link
            key={opt.id}
            href={`/seasonal?season=${season}&year=${year}&sort=${opt.id}${format ? `&format=${format}` : ""}`}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs",
              sort === opt.id ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:text-foreground"
            )}
          >
            {opt.label}
          </Link>
        ))}
        <span className="ml-3 text-xs font-medium text-muted">Format:</span>
        <Link
          href={`/seasonal?season=${season}&year=${year}&sort=${sort}`}
          className={cn("rounded-full border px-2.5 py-1 text-xs", !format ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:text-foreground")}
        >
          All
        </Link>
        {FORMATS.map((f) => (
          <Link
            key={f}
            href={`/seasonal?season=${season}&year=${year}&sort=${sort}&format=${f}`}
            className={cn("rounded-full border px-2.5 py-1 text-xs", format === f ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:text-foreground")}
          >
            {f}
          </Link>
        ))}
      </div>

      <AnimeGrid items={items} />
    </div>
  );
}
