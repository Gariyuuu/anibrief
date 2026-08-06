import "server-only";
import { AniListProvider } from "@/lib/providers/anilist";
import { NewsFeedProvider } from "@/lib/providers/news";
import { getAIProvider } from "@/lib/ai";
import { logger } from "@/lib/utils/logger";
import type { DailyBriefing } from "@/lib/types/briefing";
import type { AiringEntry } from "@/lib/types/media";
import type { NewsArticle } from "@/lib/types/news";

function dayBoundsUtc(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { startSec: Math.floor(start.getTime() / 1000), endSec: Math.floor(end.getTime() / 1000) };
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function templateSummary(params: {
  episodesToday: number;
  newsCount: number;
  birthdayCount: number;
  topBirthdayNames: string[];
  topStory: NewsArticle | null;
}): string {
  const { episodesToday, newsCount, birthdayCount, topBirthdayNames, topStory } = params;
  const parts: string[] = [];
  parts.push(
    episodesToday > 0
      ? `${episodesToday} tracked episode${episodesToday === 1 ? "" : "s"} air${episodesToday === 1 ? "s" : ""} today.`
      : "No new episodes from AniList's schedule are airing today."
  );
  if (topStory) parts.push(`Top story: "${topStory.headline}" (${topStory.publisher}).`);
  else if (newsCount > 0) parts.push(`${newsCount} anime/manga stories moved across tracked sources.`);
  if (birthdayCount > 0) {
    parts.push(
      `${birthdayCount} notable birthday${birthdayCount === 1 ? "" : "s"} today${
        topBirthdayNames.length ? `, including ${topBirthdayNames.slice(0, 3).join(", ")}` : ""
      }.`
    );
  }
  return parts.join(" ");
}

export async function buildDailyBriefing(date: string = todayIso()): Promise<DailyBriefing> {
  const { startSec, endSec } = dayBoundsUtc(new Date(`${date}T00:00:00Z`));

  const [episodesToday, episodesTomorrow, trending, staffBirthdays, characterBirthdays, news] = await Promise.all([
    AniListProvider.getAiringBetween(startSec, endSec, 50),
    AniListProvider.getAiringBetween(endSec, endSec + 24 * 60 * 60, 50),
    AniListProvider.browse({ sort: ["TRENDING_DESC"], perPage: 10 }),
    AniListProvider.getStaffBirthdaysToday(),
    AniListProvider.getCharacterBirthdaysToday(),
    NewsFeedProvider.fetchAll(15),
  ]);

  const topStory = news[0] ?? null;
  const birthdayCount = staffBirthdays.length + characterBirthdays.length;
  const topBirthdayNames = staffBirthdays.slice(0, 3).map((p) => p.name);

  const facts = templateSummary({
    episodesToday: episodesToday.length,
    newsCount: news.length,
    birthdayCount,
    topBirthdayNames,
    topStory,
  });

  let summary = facts;
  let summaryIsAiGenerated = false;

  const provider = getAIProvider();
  if (provider) {
    try {
      const prompt = `You write a tight, factual 2-3 sentence "today in anime" briefing intro. Use ONLY these facts — do not invent anything, do not add numbers not given here:
- Episodes airing today (tracked schedule): ${episodesToday.length}
- News stories today: ${news.length}${topStory ? `, top: "${topStory.headline}" (${topStory.publisher})` : ""}
- Real-person birthdays today: ${birthdayCount}${topBirthdayNames.length ? ` (${topBirthdayNames.join(", ")})` : ""}
- Trending #1 title: ${trending.items[0]?.titles.preferred ?? "n/a"}

Write in an editorial, magazine-briefing tone. No bullet points, no markdown, 2-3 sentences max.`;
      const aiText = await provider.complete(prompt, { maxTokens: 200 });
      if (aiText) {
        summary = aiText;
        summaryIsAiGenerated = true;
      }
    } catch (error) {
      logger.warn("buildDailyBriefing: AI summary failed, using template", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const briefing: DailyBriefing = {
    date,
    generatedAt: new Date().toISOString(),
    summary,
    summaryIsAiGenerated,
    stats: [
      { label: "New episodes today", value: episodesToday.length },
      { label: "News stories", value: news.length },
      { label: "Birthdays today", value: birthdayCount },
      { label: "Trending titles", value: trending.items.length },
    ],
    sections: [
      { id: "episodes", title: "New episodes", items: episodesToday as unknown[] },
      { id: "top-stories", title: "Biggest news", items: news.slice(0, 8) as unknown[] },
      { id: "trending", title: "Trending titles", items: trending.items as unknown[] },
      { id: "birthdays", title: "Birthdays & anniversaries", items: [...staffBirthdays, ...characterBirthdays] as unknown[] },
      { id: "tomorrow", title: "Tomorrow preview", items: episodesTomorrow.slice(0, 8) as unknown[] },
    ],
  };

  return briefing;
}

export function episodesSection(briefing: DailyBriefing): AiringEntry[] {
  return (briefing.sections.find((s) => s.id === "episodes")?.items as AiringEntry[]) ?? [];
}
