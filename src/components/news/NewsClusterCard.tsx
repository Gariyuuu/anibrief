"use client";

import { useState } from "react";
import { ExternalLink, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/utils/dates";
import { classifyReliability } from "@/lib/providers/news/reliability";
import type { NewsCluster } from "@/lib/types/news";

const categoryLabel: Record<string, string> = {
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

/** One card per underlying event; other outlets covering it collapse into an expandable list with every original link preserved (spec §9). */
export function NewsClusterCard({ cluster }: { cluster: NewsCluster }) {
  const [expanded, setExpanded] = useState(false);
  const primary = cluster.articles[0];
  const others = cluster.articles.slice(1);
  const reliability = classifyReliability(primary.publisher);

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="font-medium uppercase tracking-wide text-accent">{categoryLabel[cluster.category]}</span>
        <span>&middot;</span>
        <span>{primary.publisher}</span>
        <span>&middot;</span>
        <span suppressHydrationWarning>{formatRelativeTime(primary.publishedAt)}</span>
        {reliability === "reputable" && <Badge tone="positive">Reputable</Badge>}
        {primary.isRumor && <Badge tone="negative">Unconfirmed</Badge>}
      </div>
      <h3 className="mt-2 text-base font-semibold leading-snug">
        <a href={primary.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1 hover:underline">
          {primary.headline}
          <ExternalLink className="mt-1 h-3 w-3 shrink-0 text-muted" />
        </a>
      </h3>
      {primary.summary && <p className="mt-2 text-sm text-foreground/90">{primary.summary}</p>}

      {others.length > 0 && (
        <div className="mt-3 border-t border-border pt-2">
          <button onClick={() => setExpanded((v) => !v)} className="flex items-center gap-1 text-xs text-muted hover:text-accent">
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
            {others.length} other source{others.length === 1 ? "" : "s"} covered this
          </button>
          {expanded && (
            <ul className="mt-2 flex flex-col gap-1.5">
              {others.map((a) => (
                <li key={a.id}>
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted hover:text-accent hover:underline">
                    {a.publisher} — {a.headline}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
