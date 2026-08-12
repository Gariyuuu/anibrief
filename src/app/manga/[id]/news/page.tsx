import { notFound } from "next/navigation";
import { getAnimeDetail } from "@/lib/providers/anilist/getAnimeDetail";
import { AnimeDetailHeader } from "@/components/anime/AnimeDetailHeader";
import { NewsList } from "@/components/news/NewsList";
import { NewsFeedProvider } from "@/lib/providers/news";

export const revalidate = 86400; // 24h

export default async function MangaNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAnimeDetail(decodeURIComponent(id));
  if (!detail) notFound();
  const { media } = detail;
  const articles = await NewsFeedProvider.searchNews(media.titles.preferred);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <AnimeDetailHeader media={media} active={`/manga/${encodeURIComponent(media.id)}/news`} kind="manga" />
      <NewsList articles={articles} compact />
    </div>
  );
}
