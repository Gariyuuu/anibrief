import { NewsCard } from "@/components/news/NewsCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Radio } from "lucide-react";
import type { NewsArticle } from "@/lib/types/news";

export function NewsList({ articles, compact = false }: { articles: NewsArticle[]; compact?: boolean }) {
  if (articles.length === 0) {
    return <EmptyState icon={Radio} title="No stories right now" description="Check back soon, or try a different filter." />;
  }
  return (
    <div className="flex flex-col gap-3">
      {articles.map((article) => (
        <NewsCard key={article.id} article={article} compact={compact} />
      ))}
    </div>
  );
}
