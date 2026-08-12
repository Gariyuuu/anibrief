import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAnimeDetail } from "@/lib/providers/anilist/getAnimeDetail";
import { AnimeDetailHeader } from "@/components/anime/AnimeDetailHeader";
import { AnimeGrid } from "@/components/anime/AnimeGrid";
import { mapMedia } from "@/lib/providers/anilist/mappers";
import { Card } from "@/components/ui/Card";

export const revalidate = 172800; // 2 days

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const detail = await getAnimeDetail(decodeURIComponent(id));
  return { title: detail?.media.titles.preferred ?? "Anime" };
}

export default async function AnimeOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAnimeDetail(decodeURIComponent(id));
  if (!detail) notFound();
  const { media, raw } = detail;

  const recommendations = (raw.recommendations?.nodes ?? [])
    .map((n) => n.mediaRecommendation)
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .map(mapMedia);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <AnimeDetailHeader media={media} active={`/anime/${encodeURIComponent(media.id)}`} kind="anime" />

      {media.description && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Synopsis</h2>
          <p className="text-sm leading-relaxed text-foreground/90">{media.description}</p>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Meta label="Episodes" value={media.episodes ?? "—"} />
        <Meta label="Duration" value={media.duration ? `${media.duration} min` : "—"} />
        <Meta label="Status" value={media.status?.replace(/_/g, " ") ?? "—"} />
        <Meta label="Season" value={media.season && media.seasonYear ? `${media.season} ${media.seasonYear}` : "—"} />
        <Meta label="Studios" value={media.studios.join(", ") || "—"} />
        <Meta label="Source" value={raw.source?.replace(/_/g, " ") ?? "—"} />
      </section>

      {media.genres.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Genres &amp; tags</h2>
          <div className="flex flex-wrap gap-1.5">
            {[...media.genres, ...media.tags.slice(0, 10)].map((g) => (
              <Link key={g} href={`/discover?genre=${encodeURIComponent(g)}`} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted hover:border-accent/50 hover:text-accent">
                {g}
              </Link>
            ))}
          </div>
        </section>
      )}

      {raw.characters && raw.characters.edges.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Characters &amp; voice actors</h2>
            <Link href={`/anime/${encodeURIComponent(media.id)}/characters`} className="text-xs text-muted hover:text-accent">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {raw.characters.edges.slice(0, 6).map((edge) => (
              <Card key={edge.node.id} className="flex items-center gap-2 p-2">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                  {edge.node.image?.large && <Image src={edge.node.image.large} alt="" fill sizes="40px" className="object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{edge.node.name.full}</p>
                  {edge.voiceActors[0] && <p className="truncate text-[11px] text-muted">{edge.voiceActors[0].name.full}</p>}
                </div>
              </Card>
            ))}
          </div>
        </section>
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
