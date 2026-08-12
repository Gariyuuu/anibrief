import { notFound } from "next/navigation";
import Link from "next/link";
import { getAnimeDetail } from "@/lib/providers/anilist/getAnimeDetail";
import { AnimeDetailHeader } from "@/components/anime/AnimeDetailHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Share2 } from "lucide-react";

export const revalidate = 172800; // 2 days

export default async function AnimeRelationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAnimeDetail(decodeURIComponent(id));
  if (!detail) notFound();
  const { media } = detail;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <AnimeDetailHeader media={media} active={`/anime/${encodeURIComponent(media.id)}/relations`} kind="anime" />
      {media.relations.length === 0 ? (
        <EmptyState icon={Share2} title="No related media" description="AniList doesn't list sequels, prequels, or adaptations for this title." />
      ) : (
        <div className="flex flex-col gap-2">
          {media.relations.map((rel) => (
            <Link key={`${rel.relation}-${rel.mediaId}`} href={`/anime/${encodeURIComponent(rel.mediaId)}`}>
              <Card className="flex items-center justify-between p-3 hover:border-accent/50">
                <span className="text-sm font-medium">{rel.title}</span>
                <span className="text-xs uppercase tracking-wide text-muted">{rel.relation.replace(/_/g, " ")}</span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
