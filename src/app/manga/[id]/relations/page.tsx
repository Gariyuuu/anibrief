import { notFound } from "next/navigation";
import Link from "next/link";
import { getAnimeDetail } from "@/lib/providers/anilist/getAnimeDetail";
import { AnimeDetailHeader } from "@/components/anime/AnimeDetailHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Share2 } from "lucide-react";

export const revalidate = 86400; // 24h

export default async function MangaRelationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAnimeDetail(decodeURIComponent(id));
  if (!detail) notFound();
  const { media, raw } = detail;
  const edges = raw.relations?.edges ?? [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <AnimeDetailHeader media={media} active={`/manga/${encodeURIComponent(media.id)}/relations`} kind="manga" />
      {edges.length === 0 ? (
        <EmptyState icon={Share2} title="No related media" description="AniList doesn't list sequels, prequels, or adaptations for this title." />
      ) : (
        <div className="flex flex-col gap-2">
          {edges.map((edge) => {
            const section = edge.node.type === "ANIME" ? "anime" : "manga";
            const mediaId = `anilist:${edge.node.id}`;
            return (
              <Link key={`${edge.relationType}-${edge.node.id}`} href={`/${section}/${encodeURIComponent(mediaId)}`}>
                <Card className="flex items-center justify-between p-3 hover:border-accent/50">
                  <span className="text-sm font-medium">{edge.node.title.romaji ?? "Untitled"}</span>
                  <span className="text-xs uppercase tracking-wide text-muted">{edge.relationType.replace(/_/g, " ")}</span>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
