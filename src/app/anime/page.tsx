import type { Metadata } from "next";
import Link from "next/link";
import { AniListProvider, type MediaSort } from "@/lib/providers/anilist";
import { AnimeGrid } from "@/components/anime/AnimeGrid";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Anime" };
export const revalidate = 86400; // 24h

const SORT_OPTIONS: { id: MediaSort; label: string }[] = [
  { id: "POPULARITY_DESC", label: "Popularity" },
  { id: "SCORE_DESC", label: "Top rated" },
  { id: "TRENDING_DESC", label: "Trending" },
  { id: "FAVOURITES_DESC", label: "Most favorited" },
];

export default async function AnimeBrowsePage({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string }> }) {
  const { q, sort = "POPULARITY_DESC" } = await searchParams;

  const result = q
    ? await AniListProvider.searchMedia(q, "ANIME", { perPage: 30 })
    : await AniListProvider.browse({ type: "ANIME", sort: [sort as MediaSort], perPage: 30 });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Anime</h1>
        <p className="mt-1 text-sm text-muted">Browse and search AniList&apos;s full anime catalog.</p>
      </div>

      <form action="/anime" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search anime titles…"
          className="w-full max-w-sm rounded-md border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent"
        />
        <button type="submit" className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-accent/50">
          Search
        </button>
      </form>

      {!q && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
          <span className="text-xs font-medium text-muted">Sort:</span>
          {SORT_OPTIONS.map((opt) => (
            <Link
              key={opt.id}
              href={`/anime?sort=${opt.id}`}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs",
                sort === opt.id ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:text-foreground"
              )}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      )}

      <AnimeGrid items={result.items} emptyMessage={q ? `No anime matched "${q}".` : undefined} />
    </div>
  );
}
