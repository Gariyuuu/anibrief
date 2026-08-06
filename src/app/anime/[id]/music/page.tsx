import { notFound } from "next/navigation";
import { getAnimeDetail } from "@/lib/providers/anilist/getAnimeDetail";
import { AnimeDetailHeader } from "@/components/anime/AnimeDetailHeader";
import { ErrorState } from "@/components/ui/ErrorState";
import { MusicProvider } from "@/lib/providers/music";
import { Card } from "@/components/ui/Card";

export const revalidate = 1800;

export default async function AnimeMusicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAnimeDetail(decodeURIComponent(id));
  if (!detail) notFound();
  const { media } = detail;

  const releases = await MusicProvider.getCuratedReleases();
  const matches = releases.filter((r) => r.relatedAnimeTitle?.toLowerCase() === media.titles.preferred.toLowerCase());

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <AnimeDetailHeader media={media} active={`/anime/${encodeURIComponent(media.id)}/music`} kind="anime" />
      {matches.length > 0 ? (
        <div className="flex flex-col gap-2">
          {matches.map((m) => (
            <Card key={m.id} className="flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-medium">{m.title}</p>
                <p className="text-xs text-muted">
                  {m.artist} · {m.themeType.replace(/_/g, " ")}
                </p>
              </div>
              <a href={m.listenLinks[0]?.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">
                Listen ↗
              </a>
            </Card>
          ))}
        </div>
      ) : (
        <ErrorState
          reason="not_configured"
          message="No live music-metadata provider is configured for this deployment, and this title isn't in the small curated reference set — see the Music page."
        />
      )}
    </div>
  );
}
