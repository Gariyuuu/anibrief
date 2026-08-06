import type { NormalizedMedia } from "@/lib/types/media";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchX } from "lucide-react";

export function AnimeGrid({ items, emptyMessage }: { items: NormalizedMedia[]; emptyMessage?: string }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="No results"
        description={emptyMessage ?? "Nothing matched these filters yet — try widening them."}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map((media) => (
        <AnimeCard key={media.id} media={media} />
      ))}
    </div>
  );
}
