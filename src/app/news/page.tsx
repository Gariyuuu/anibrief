import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { NewsFeedProvider } from "@/lib/providers/news";
import { classifyReliability } from "@/lib/providers/news/reliability";
import { clusterNews } from "@/lib/dedup/clusterNews";
import { NewsClusterCard } from "@/components/news/NewsClusterCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { getUserFollows } from "@/lib/actions/follows";
import { Radio, LogIn } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { NewsCategory } from "@/lib/types/news";

export const metadata: Metadata = { title: "News" };
export const revalidate = 172800; // 2 days

const TABS: { id: string; label: string }[] = [
  { id: "latest", label: "Latest" },
  { id: "top", label: "Top" },
  { id: "following", label: "Following" },
  { id: "anime", label: "Anime" },
  { id: "manga", label: "Manga" },
  { id: "music", label: "Music" },
  { id: "industry", label: "Industry" },
  { id: "streaming", label: "Streaming" },
  { id: "games", label: "Games" },
  { id: "movies", label: "Movies" },
  { id: "people", label: "People" },
  { id: "rumors", label: "Rumors" },
];

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "latest" } = await searchParams;
  const { userId } = await auth();

  let articles = await (tab === "latest" || tab === "top" || tab === "rumors" || tab === "following"
    ? NewsFeedProvider.fetchAll(20)
    : NewsFeedProvider.fetchCategory(tab as Exclude<NewsCategory, "rumor">, 60));

  if (tab === "top") {
    articles = [...articles].sort((a, b) => {
      const rankDiff = (classifyReliability(b.publisher) === "reputable" ? 1 : 0) - (classifyReliability(a.publisher) === "reputable" ? 1 : 0);
      if (rankDiff !== 0) return rankDiff;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }
  if (tab === "rumors") articles = articles.filter((a) => a.isRumor);

  let followingEmpty = false;
  if (tab === "following") {
    if (!userId) {
      followingEmpty = true;
      articles = [];
    } else {
      const follows = await getUserFollows(userId);
      const labels = follows.map((f) => f.targetLabel.toLowerCase());
      articles = labels.length ? articles.filter((a) => labels.some((l) => a.headline.toLowerCase().includes(l))) : [];
    }
  }

  const clusters = clusterNews(articles);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">News</h1>
        <p className="mt-1 text-sm text-muted">Aggregated from public RSS feeds, attributed and linked to the original source.</p>
      </div>

      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/news?tab=${t.id}`}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              tab === t.id ? "border-accent text-foreground" : "border-transparent text-muted hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "following" && followingEmpty ? (
        <EmptyState
          icon={LogIn}
          title="Sign in to see followed news"
          description="Follow studios, voice actors, or tags from their pages to build a personalized feed here."
        />
      ) : clusters.length === 0 ? (
        <EmptyState icon={Radio} title="No stories here yet" description="Try a different tab, or check back soon." />
      ) : (
        <div className="flex flex-col gap-3">
          {clusters.map((cluster) => (
            <NewsClusterCard key={cluster.id} cluster={cluster} />
          ))}
        </div>
      )}
    </div>
  );
}
