import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAnimeDetail } from "@/lib/providers/anilist/getAnimeDetail";
import { AnimeDetailHeader } from "@/components/anime/AnimeDetailHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users } from "lucide-react";

export const revalidate = 1800;

export default async function AnimeStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAnimeDetail(decodeURIComponent(id));
  if (!detail) notFound();
  const { media, raw } = detail;
  const edges = raw.staff?.edges ?? [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <AnimeDetailHeader media={media} active={`/anime/${encodeURIComponent(media.id)}/staff`} kind="anime" />
      {edges.length === 0 ? (
        <EmptyState icon={Users} title="No staff data" description="AniList doesn't have staff data for this title yet." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {edges.map((edge) => (
            <Link key={edge.node.id} href={`/people/anilist:${edge.node.id}`}>
              <Card className="flex items-center gap-2.5 p-3 hover:border-accent/50">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
                  {edge.node.image?.large && <Image src={edge.node.image.large} alt="" fill sizes="44px" className="object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{edge.node.name.full}</p>
                  <p className="truncate text-xs text-muted">{edge.role}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
