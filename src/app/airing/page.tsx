import type { Metadata } from "next";
import Link from "next/link";
import { AniListProvider } from "@/lib/providers/anilist";
import { AiringByDay } from "@/components/airing/AiringByDay";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Airing Schedule" };
export const revalidate = 86400; // 24h

const RANGE_DAYS: Record<string, number> = { today: 1, tomorrow: 1, week: 7 };

export default async function AiringPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range = "week" } = await searchParams;
  const days = RANGE_DAYS[range] ?? 7;

  const now = new Date();
  const todayStartSec = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 1000);
  const rangeStart = range === "tomorrow" ? todayStartSec + 86400 : todayStartSec;
  const rangeEnd = rangeStart + days * 86400;

  const entries = await AniListProvider.getAiringBetween(rangeStart, rangeEnd, 200);

  const tabs = [
    { id: "today", label: "Today" },
    { id: "tomorrow", label: "Tomorrow" },
    { id: "week", label: "This week" },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Airing Schedule</h1>
        <p className="mt-1 text-sm text-muted">
          From AniList&apos;s live schedule, converted to your local timezone. Japanese broadcast time and international
          streaming availability may differ — check each title&apos;s streaming links.
        </p>
      </div>
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/airing?range=${t.id}`}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium",
              range === t.id ? "border-accent text-foreground" : "border-transparent text-muted hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
        <Link href="/calendar" className="ml-auto self-center px-3 py-2 text-xs text-muted hover:text-accent">
          Full calendar →
        </Link>
      </div>
      <AiringByDay entries={entries} />
    </div>
  );
}
