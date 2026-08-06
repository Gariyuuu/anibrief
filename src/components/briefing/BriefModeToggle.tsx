"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { EpisodeTimeline } from "@/components/home/EpisodeTimeline";
import { TrendingList } from "@/components/home/TrendingList";
import { BirthdayStrip } from "@/components/home/BirthdayStrip";
import { NewsList } from "@/components/news/NewsList";
import { ErrorState } from "@/components/ui/ErrorState";
import type { AiringEntry, NormalizedMedia } from "@/lib/types/media";
import type { NewsArticle } from "@/lib/types/news";
import type { NormalizedPerson } from "@/lib/types/person";
import type { CharacterBirthday } from "@/lib/providers/anilist/mappers";

export type BriefMode = "quick" | "standard" | "deep";

const modes: { id: BriefMode; label: string; hint: string }[] = [
  { id: "quick", label: "Quick", hint: "~2 min" },
  { id: "standard", label: "Standard", hint: "~5 min" },
  { id: "deep", label: "Deep", hint: "~10 min" },
];

const sectionVisibility: Record<BriefMode, string[]> = {
  quick: ["episodes", "top-stories"],
  standard: ["episodes", "top-stories", "birthdays", "trending", "industry"],
  deep: ["episodes", "top-stories", "birthdays", "trending", "industry", "tomorrow", "music", "manga", "trailers"],
};

interface DailyBriefSectionsProps {
  episodes: AiringEntry[];
  tomorrow: AiringEntry[];
  topStories: NewsArticle[];
  trending: NormalizedMedia[];
  staffBirthdays: NormalizedPerson[];
  characterBirthdays: CharacterBirthday[];
  industryNews: NewsArticle[];
  mangaNews: NewsArticle[];
}

/**
 * All section data is fetched server-side and passed in as plain
 * (serializable) props — a function can't cross the server/client
 * component boundary, so this owns the mode state AND the section
 * rendering itself rather than taking a server-rendered render-prop.
 */
export function DailyBriefSections({
  episodes,
  tomorrow,
  topStories,
  trending,
  staffBirthdays,
  characterBirthdays,
  industryNews,
  mangaNews,
}: DailyBriefSectionsProps) {
  const [mode, setMode] = useState<BriefMode>("standard");
  const visible = new Set(sectionVisibility[mode]);

  return (
    <div>
      <div className="mb-4 inline-flex rounded-lg border border-border bg-surface p-0.5">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              mode === m.id ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
            )}
          >
            {m.label} <span className="opacity-70">{m.hint}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        {visible.has("episodes") && (
          <section>
            <h2 className="mb-2 text-sm font-semibold">New episodes</h2>
            <EpisodeTimeline entries={episodes} />
          </section>
        )}
        {visible.has("top-stories") && (
          <section>
            <h2 className="mb-2 text-sm font-semibold">Biggest news</h2>
            <NewsList articles={topStories.slice(0, mode === "quick" ? 3 : 8)} compact />
          </section>
        )}
        {visible.has("birthdays") && (
          <section>
            <BirthdayStrip people={staffBirthdays} characters={characterBirthdays} />
          </section>
        )}
        {visible.has("trending") && (
          <section>
            <TrendingList items={trending} />
          </section>
        )}
        {visible.has("industry") && (
          <section>
            <h2 className="mb-2 text-sm font-semibold">Industry watch</h2>
            <NewsList articles={industryNews} compact />
          </section>
        )}
        {visible.has("music") && (
          <section>
            <h2 className="mb-2 text-sm font-semibold">Music releases</h2>
            <ErrorState
              reason="not_configured"
              message="No live music-metadata provider is configured for this deployment — see the Music page for a curated reference set instead of live releases."
            />
          </section>
        )}
        {visible.has("manga") && (
          <section>
            <h2 className="mb-2 text-sm font-semibold">Manga releases</h2>
            <NewsList articles={mangaNews.slice(0, 5)} compact />
          </section>
        )}
        {visible.has("trailers") && (
          <section>
            <h2 className="mb-2 text-sm font-semibold">Trailers</h2>
            <ErrorState
              reason="not_configured"
              message="YOUTUBE_API_KEY isn't set for this deployment, so trailer search is unavailable — see ENVIRONMENT_VARIABLES.md."
            />
          </section>
        )}
        {visible.has("tomorrow") && (
          <section>
            <h2 className="mb-2 text-sm font-semibold">Tomorrow preview</h2>
            <EpisodeTimeline entries={tomorrow} />
          </section>
        )}
      </div>
    </div>
  );
}
