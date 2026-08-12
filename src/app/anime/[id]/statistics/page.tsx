import { notFound } from "next/navigation";
import { getAnimeDetail } from "@/lib/providers/anilist/getAnimeDetail";
import { AnimeDetailHeader } from "@/components/anime/AnimeDetailHeader";
import { Card } from "@/components/ui/Card";

export const revalidate = 172800; // 2 days

export default async function AnimeStatisticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAnimeDetail(decodeURIComponent(id));
  if (!detail) notFound();
  const { media } = detail;

  const stats = [
    { label: "Average score", value: media.averageScore != null ? `${media.averageScore}/100` : "Not enough votes yet" },
    { label: "Popularity (list count)", value: media.popularity?.toLocaleString() ?? "—" },
    { label: "Favourites", value: media.favourites?.toLocaleString() ?? "—" },
    { label: "Episodes", value: media.episodes ?? "—" },
  ];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <AnimeDetailHeader media={media} active={`/anime/${encodeURIComponent(media.id)}/statistics`} kind="anime" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted">{s.label}</p>
            <p className="mt-0.5 text-lg font-semibold">{s.value}</p>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted">
        Sourced live from AniList. Score distribution, rank history, and rewatch statistics aren&apos;t available from the current
        provider set — this page won&apos;t show them rather than approximate or invent numbers.
      </p>
    </div>
  );
}
