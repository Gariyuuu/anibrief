"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { AddToListButton } from "@/components/actions/AddToListButton";
import { RemindMeButton } from "@/components/actions/RemindMeButton";
import { formatCountdown, formatLocalTime, browserTimeZone } from "@/lib/utils/dates";
import { getStreamingAvailability } from "@/lib/providers/streaming";
import type { AiringEntry } from "@/lib/types/media";

export function EpisodeTimeline({ entries }: { entries: AiringEntry[] }) {
  const [tz, setTz] = useState("UTC");
  const [, forceTick] = useState(0);

  useEffect(() => {
    // "UTC" is the SSR-safe default; correct it once the real zone is
    // available client-side (see AiringByDay.tsx for the same pattern).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTz(browserTimeZone());
    const id = setInterval(() => forceTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  if (entries.length === 0) {
    return <EmptyState icon={Clock} title="No episodes today" description="Nothing in AniList's tracked schedule airs today — check the full Airing page for the coming week." />;
  }

  const sorted = [...entries].sort((a, b) => new Date(a.airingAt).getTime() - new Date(b.airingAt).getTime());

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((entry) => {
        const streaming = getStreamingAvailability(entry.anime);
        return (
          <Card key={`${entry.mediaId}-${entry.episode}`} className="flex items-center gap-3 p-3">
            <Link href={`/anime/${encodeURIComponent(entry.mediaId)}`} className="relative h-16 w-11 shrink-0 overflow-hidden rounded">
              {entry.anime.coverImage ? (
                <Image src={entry.anime.coverImage} alt="" fill sizes="44px" className="object-cover" />
              ) : (
                <div className="h-full w-full bg-border" />
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/anime/${encodeURIComponent(entry.mediaId)}`} className="line-clamp-1 text-sm font-medium hover:text-accent">
                {entry.anime.titles.preferred}
              </Link>
              <p className="mt-0.5 text-xs text-muted" suppressHydrationWarning>
                Episode {entry.episode} · {formatLocalTime(entry.airingAt, tz)} · {formatCountdown(entry.airingAt)}
              </p>
              {streaming.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {streaming.slice(0, 3).map((s) => (
                    <a
                      key={s.platform}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted hover:text-accent"
                    >
                      {s.platform}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <AddToListButton kind="anime" mediaId={entry.mediaId} mediaTitle={entry.anime.titles.preferred} coverImage={entry.anime.coverImage} />
              <RemindMeButton mediaId={entry.mediaId} mediaTitle={entry.anime.titles.preferred} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
