import { notFound } from "next/navigation";
import { getAnimeDetail } from "@/lib/providers/anilist/getAnimeDetail";
import { AnimeDetailHeader } from "@/components/anime/AnimeDetailHeader";
import { NewsList } from "@/components/news/NewsList";
import { NewsFeedProvider } from "@/lib/providers/news";

export const revalidate = 172800; // 2 days

export default async function AnimeNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAnimeDetail(decodeURIComponent(id));
  if (!detail) notFound();
  const { media } = detail;
  const articles = await NewsFeedProvider.searchNews(media.titles.preferred);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <AnimeDetailHeader media={media} active={`/anime/${encodeURIComponent(media.id)}/news`} kind="anime" />
      <NewsList articles={articles} compact />
    </div>
  );
}
