import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getAnimeDetail } from "@/lib/providers/anilist/getAnimeDetail";
import { AnimeDetailHeader } from "@/components/anime/AnimeDetailHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users } from "lucide-react";

export const revalidate = 86400; // 24h

export default async function AnimeCharactersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decoded = decodeURIComponent(id);
  const detail = await getAnimeDetail(decoded);
  if (!detail) notFound();
  const { media, raw } = detail;
  const edges = raw.characters?.edges ?? [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <AnimeDetailHeader media={media} active={`/anime/${encodeURIComponent(media.id)}/characters`} kind="anime" />
      {edges.length === 0 ? (
        <EmptyState icon={Users} title="No character data" description="AniList doesn't have character/voice-actor data for this title yet." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {edges.map((edge) => (
            <Card key={edge.node.id} className="flex items-center justify-between gap-3 p-3">
              <Link href={`/characters/${encodeURIComponent(`anilist:${edge.node.id}`)}`} className="flex min-w-0 items-center gap-2.5 hover:text-accent">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
                  {edge.node.image?.large && <Image src={edge.node.image.large} alt="" fill sizes="48px" className="object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{edge.node.name.full}</p>
                  <p className="text-xs text-muted capitalize">{edge.role.toLowerCase()}</p>
                </div>
              </Link>
              {edge.voiceActors[0] && (
                <Link
                  href={`/people/${encodeURIComponent(`anilist:${edge.voiceActors[0].id}`)}`}
                  className="flex shrink-0 items-center gap-2.5 text-right hover:text-accent"
                >
                  <div>
                    <p className="text-sm">{edge.voiceActors[0].name.full}</p>
                    <p className="text-xs text-muted">Japanese</p>
                  </div>
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
                    {edge.voiceActors[0].image?.large && <Image src={edge.voiceActors[0].image.large} alt="" fill sizes="48px" className="object-cover" />}
                  </div>
                </Link>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
