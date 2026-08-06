import Link from "next/link";
import { Sparkles, Archive } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatTile } from "@/components/home/StatTile";
import { DailyBriefSections } from "@/components/briefing/BriefModeToggle";
import { BriefActions } from "@/components/briefing/BriefActions";
import { formatDigestDate } from "@/lib/utils/dates";
import type { DailyBriefing } from "@/lib/types/briefing";
import type { NewsArticle } from "@/lib/types/news";
import type { NormalizedMedia, AiringEntry } from "@/lib/types/media";
import type { NormalizedPerson } from "@/lib/types/person";
import type { CharacterBirthday } from "@/lib/providers/anilist/mappers";

export function DailyBriefView({ briefing, appUrl, isArchive = false }: { briefing: DailyBriefing; appUrl: string; isArchive?: boolean }) {
  const episodes = (briefing.sections.find((s) => s.id === "episodes")?.items as AiringEntry[]) ?? [];
  const tomorrow = (briefing.sections.find((s) => s.id === "tomorrow")?.items as AiringEntry[]) ?? [];
  const topStories = (briefing.sections.find((s) => s.id === "top-stories")?.items as NewsArticle[]) ?? [];
  const trending = (briefing.sections.find((s) => s.id === "trending")?.items as NormalizedMedia[]) ?? [];
  const birthdayItems = (briefing.sections.find((s) => s.id === "birthdays")?.items as (NormalizedPerson | CharacterBirthday)[]) ?? [];
  const staffBirthdays = birthdayItems.filter((b): b is NormalizedPerson => "primaryRole" in b);
  const characterBirthdays = birthdayItems.filter((b): b is CharacterBirthday => !("primaryRole" in b));
  const industryNews = topStories.filter((a) => a.category === "industry" || a.category === "streaming");
  const mangaNews = topStories.filter((a) => a.category === "manga");

  const shareUrl = `${appUrl}/daily-brief${isArchive ? `/archive/${briefing.date}` : ""}`;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{formatDigestDate(`${briefing.date}T00:00:00Z`)}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Daily Brief</h1>
        </div>
        <div className="flex items-center gap-2">
          {briefing.summaryIsAiGenerated && (
            <Badge tone="accent">
              <Sparkles className="mr-1 h-3 w-3" /> AI summary
            </Badge>
          )}
          {!isArchive && (
            <Link href="/daily-brief/archive" className="inline-flex items-center gap-1 text-xs text-muted hover:text-accent">
              <Archive className="h-3.5 w-3.5" /> Archive
            </Link>
          )}
          {isArchive && (
            <Link href="/daily-brief" className="text-xs text-muted hover:text-accent">
              ← Today&apos;s brief
            </Link>
          )}
        </div>
      </div>

      <Card className="p-5">
        <p className="text-sm leading-relaxed text-foreground/90">{briefing.summary}</p>
        <div className="mt-4">
          <BriefActions date={briefing.date} summary={briefing.summary} shareUrl={shareUrl} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {briefing.stats.map((stat) => (
          <StatTile key={stat.label} stat={stat} />
        ))}
      </div>

      <DailyBriefSections
        episodes={episodes}
        tomorrow={tomorrow}
        topStories={topStories}
        trending={trending}
        staffBirthdays={staffBirthdays}
        characterBirthdays={characterBirthdays}
        industryNews={industryNews}
        mangaNews={mangaNews}
      />
    </div>
  );
}
