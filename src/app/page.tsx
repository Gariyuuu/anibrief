import { HeroBrief } from "@/components/home/HeroBrief";
import { EpisodeTimeline } from "@/components/home/EpisodeTimeline";
import { TrendingList } from "@/components/home/TrendingList";
import { BirthdayStrip } from "@/components/home/BirthdayStrip";
import { NewsList } from "@/components/news/NewsList";
import { getTodaysBriefing } from "@/lib/briefing/getTodaysBriefing";
import { episodesSection } from "@/lib/briefing/buildBriefing";
import type { NewsArticle } from "@/lib/types/news";
import type { NormalizedMedia } from "@/lib/types/media";
import type { NormalizedPerson } from "@/lib/types/person";
import type { CharacterBirthday } from "@/lib/providers/anilist/mappers";

export const revalidate = 86400; // 24h

export default async function HomePage() {
  const briefing = await getTodaysBriefing();
  const episodes = episodesSection(briefing);
  const topStories = (briefing.sections.find((s) => s.id === "top-stories")?.items as NewsArticle[]) ?? [];
  const trending = (briefing.sections.find((s) => s.id === "trending")?.items as NormalizedMedia[]) ?? [];
  const birthdayItems = (briefing.sections.find((s) => s.id === "birthdays")?.items as (NormalizedPerson | CharacterBirthday)[]) ?? [];
  const staffBirthdays = birthdayItems.filter((b): b is NormalizedPerson => "primaryRole" in b);
  const characterBirthdays = birthdayItems.filter((b): b is CharacterBirthday => !("primaryRole" in b));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <HeroBrief briefing={briefing} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Today&apos;s episodes</h2>
            <EpisodeTimeline entries={episodes} />
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Top stories</h2>
            <NewsList articles={topStories} compact />
          </section>
        </div>
        <div className="flex flex-col gap-6">
          <TrendingList items={trending} />
          <BirthdayStrip people={staffBirthdays} characters={characterBirthdays} />
        </div>
      </div>
    </div>
  );
}
