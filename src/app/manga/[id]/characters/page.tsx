import { notFound } from "next/navigation";
import Image from "next/image";
import { getAnimeDetail } from "@/lib/providers/anilist/getAnimeDetail";
import { AnimeDetailHeader } from "@/components/anime/AnimeDetailHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users } from "lucide-react";

export const revalidate = 1800;

export default async function MangaCharactersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decoded = decodeURIComponent(id);
  const detail = await getAnimeDetail(decoded);
  if (!detail) notFound();
  const { media, raw } = detail;
  const edges = raw.characters?.edges ?? [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <AnimeDetailHeader media={media} active={`/manga/${encodeURIComponent(media.id)}/characters`} kind="manga" />
      {edges.length === 0 ? (
        <EmptyState icon={Users} title="No character data" description="AniList doesn't have character data for this title yet." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {edges.map((edge) => (
            <Card key={edge.node.id} className="flex items-center gap-2.5 p-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
                {edge.node.image?.large && <Image src={edge.node.image.large} alt="" fill sizes="48px" className="object-cover" />}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{edge.node.name.full}</p>
                <p className="text-xs text-muted capitalize">{edge.role.toLowerCase()}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
