import { ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/utils/dates";
import { classifyReliability } from "@/lib/providers/news/reliability";
import type { NewsArticle } from "@/lib/types/news";

const categoryLabel: Record<NewsArticle["category"], string> = {
  anime: "Anime",
  manga: "Manga",
  music: "Music",
  industry: "Industry",
  streaming: "Streaming",
  games: "Games",
  movies: "Movies",
  people: "People",
  rumor: "Rumor",
};

export function NewsCard({ article, compact = false }: { article: NewsArticle; compact?: boolean }) {
  const reliability = classifyReliability(article.publisher);

  return (
    <Card className={compact ? "p-3" : "p-4"}>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="font-medium uppercase tracking-wide text-accent">{categoryLabel[article.category]}</span>
        <span>&middot;</span>
        <span>{article.publisher}</span>
        <span>&middot;</span>
        <span suppressHydrationWarning>{formatRelativeTime(article.publishedAt)}</span>
        {reliability === "reputable" && <Badge tone="positive">Reputable</Badge>}
        {article.isRumor && <Badge tone="negative">Unconfirmed</Badge>}
      </div>

      <h3 className={compact ? "mt-1.5 text-sm font-semibold leading-snug" : "mt-2 text-base font-semibold leading-snug"}>
        <a href={article.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1 hover:underline">
          {article.headline}
          <ExternalLink className="mt-1 h-3 w-3 shrink-0 text-muted" />
        </a>
      </h3>

      {!compact && article.summary && <p className="mt-2 text-sm text-foreground/90">{article.summary}</p>}
    </Card>
  );
}
