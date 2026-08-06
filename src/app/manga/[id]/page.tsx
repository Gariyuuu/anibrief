import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { getAnimeDetail } from "@/lib/providers/anilist/getAnimeDetail";
import { AnimeDetailHeader } from "@/components/anime/AnimeDetailHeader";
import { AnimeGrid } from "@/components/anime/AnimeGrid";
import { mapMedia } from "@/lib/providers/anilist/mappers";
import { Card } from "@/components/ui/Card";

export const revalidate = 1800;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const detail = await getAnimeDetail(decodeURIComponent(id));
  return { title: detail?.media.titles.preferred ?? "Manga" };
}

export default async function MangaOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAnimeDetail(decodeURIComponent(id));
  if (!detail) notFound();
  const { media, raw } = detail;

  const recommendations = (raw.recommendations?.nodes ?? [])
    .map((n) => n.mediaRecommendation)
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .map(mapMedia);

  const characterCount = raw.characters?.edges.length ?? 0;
  const countsUnavailable = media.chapters == null || media.volumes == null;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <AnimeDetailHeader media={media} active={`/manga/${encodeURIComponent(media.id)}`} kind="manga" />

      {media.description && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Synopsis</h2>
          <p className="text-sm leading-relaxed text-foreground/90">{media.description}</p>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {media.chapters != null && <Meta label="Chapters" value={media.chapters} />}
        {media.volumes != null && <Meta label="Volumes" value={media.volumes} />}
        <Meta label="Status" value={media.status?.replace(/_/g, " ") ?? "—"} />
        <Meta label="Publisher" value={media.publishers.join(", ") || "—"} />
        <Meta label="Source" value={raw.source?.replace(/_/g, " ") ?? "—"} />
        <Meta label="Format" value={media.format?.replace(/_/g, " ") ?? "—"} />
      </section>

      {media.status === "RELEASING" && countsUnavailable && (
        <p className="-mt-3 text-xs text-muted">
          This title is ongoing — AniList hasn&apos;t reported a confirmed chapter/volume count yet, so it isn&apos;t
          shown above. No next-chapter date is available from any connected source.
        </p>
      )}

      {media.genres.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Genres &amp; tags</h2>
          <div className="flex flex-wrap gap-1.5">
            {[...media.genres, ...media.tags.slice(0, 10)].map((g) => (
              <Link
                key={g}
                href={`/discover?genre=${encodeURIComponent(g)}`}
                className="rounded-full border border-border px-2.5 py-1 text-xs text-muted hover:border-accent/50 hover:text-accent"
              >
                {g}
              </Link>
            ))}
          </div>
        </section>
      )}

      {characterCount > 0 && (
        <Link href={`/manga/${encodeURIComponent(media.id)}/characters`}>
          <Card className="flex items-center justify-between p-3 hover:border-accent/50">
            <span className="inline-flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-muted" /> Characters
            </span>
            <span className="text-xs text-muted">{characterCount} listed →</span>
          </Card>
        </Link>
      )}

      {recommendations.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">If you liked this</h2>
          <AnimeGrid items={recommendations.slice(0, 6)} />
        </section>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </Card>
  );
}
