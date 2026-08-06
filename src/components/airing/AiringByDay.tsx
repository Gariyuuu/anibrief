"use client";

import { useEffect, useState } from "react";
import { EpisodeTimeline } from "@/components/home/EpisodeTimeline";
import { browserTimeZone, formatDayLabel } from "@/lib/utils/dates";
import type { AiringEntry } from "@/lib/types/media";

export function AiringByDay({ entries }: { entries: AiringEntry[] }) {
  const [tz, setTz] = useState("UTC");
  // "UTC" is the SSR-safe default; the real zone only exists client-side, so
  // this corrects it once after mount rather than in a lazy useState
  // initializer (which would run during SSR, where browserTimeZone() throws).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setTz(browserTimeZone()), []);

  const groups = new Map<string, AiringEntry[]>();
  for (const entry of entries) {
    const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(
      new Date(entry.airingAt)
    );
    if (!groups.has(dayKey)) groups.set(dayKey, []);
    groups.get(dayKey)!.push(entry);
  }

  const sortedKeys = Array.from(groups.keys()).sort();

  if (sortedKeys.length === 0) {
    return <EpisodeTimeline entries={[]} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {sortedKeys.map((key) => (
        <section key={key}>
          <h3 className="mb-2 text-sm font-semibold text-foreground" suppressHydrationWarning>
            {formatDayLabel(`${key}T12:00:00Z`)}
          </h3>
          <EpisodeTimeline entries={groups.get(key)!} />
        </section>
      ))}
    </div>
  );
}
