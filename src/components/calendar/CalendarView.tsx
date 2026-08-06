"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Bell, Cake, Clapperboard } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDayLabel } from "@/lib/utils/dates";
import type { CalendarEvent, CalendarEventType } from "@/lib/types/calendarEvent";

const TYPE_ICON: Record<CalendarEventType, LucideIcon> = {
  episode: Clapperboard,
  premiere: Clapperboard,
  finale: Clapperboard,
  movie: Clapperboard,
  manga_volume: Clapperboard,
  music_release: Clapperboard,
  birthday: Cake,
  anniversary: Cake,
  user_reminder: Bell,
};

type Filters = { episodes: boolean; birthdays: boolean; reminders: boolean };

const EPISODE_TYPES: CalendarEventType[] = ["episode", "premiere", "finale", "movie", "manga_volume", "music_release"];
const BIRTHDAY_TYPES: CalendarEventType[] = ["birthday", "anniversary"];

function passesFilter(type: CalendarEventType, filters: Filters): boolean {
  if (EPISODE_TYPES.includes(type)) return filters.episodes;
  if (BIRTHDAY_TYPES.includes(type)) return filters.birthdays;
  return filters.reminders;
}

export function CalendarView({
  groups,
  view,
  monthStart,
  monthEndExclusive,
}: {
  groups: Record<string, CalendarEvent[]>;
  view: "agenda" | "month";
  monthStart: string;
  monthEndExclusive: string;
}) {
  const [filters, setFilters] = useState<Filters>({ episodes: true, birthdays: true, reminders: true });

  const sortedKeys = Object.keys(groups).sort();
  const dayGroups = sortedKeys
    .map((key) => ({ key, events: groups[key].filter((e) => passesFilter(e.type, filters)) }))
    .filter((g) => g.events.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={filters.episodes}
            onChange={(e) => setFilters((f) => ({ ...f, episodes: e.target.checked }))}
          />
          Episodes
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={filters.birthdays}
            onChange={(e) => setFilters((f) => ({ ...f, birthdays: e.target.checked }))}
          />
          Birthdays
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={filters.reminders}
            onChange={(e) => setFilters((f) => ({ ...f, reminders: e.target.checked }))}
          />
          My reminders
        </label>
      </div>

      {view === "month" ? (
        <MonthGrid groups={groups} filters={filters} monthStart={monthStart} monthEndExclusive={monthEndExclusive} />
      ) : dayGroups.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nothing to show"
          description="No events match the current filters this month."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {dayGroups.map(({ key, events }) => (
            <section key={key}>
              <h3 className="mb-2 text-sm font-semibold text-foreground" suppressHydrationWarning>
                {formatDayLabel(`${key}T12:00:00Z`)}
              </h3>
              <div className="flex flex-col gap-2">
                {events.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function EventRow({ event }: { event: CalendarEvent }) {
  const Icon = TYPE_ICON[event.type];
  const content = (
    <Card className="flex items-center gap-3 p-3 hover:border-accent/50">
      <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{event.title}</p>
        {event.description && <p className="truncate text-xs text-muted">{event.description}</p>}
      </div>
    </Card>
  );

  if (!event.url) return content;
  return event.url.startsWith("/") ? (
    <Link href={event.url}>{content}</Link>
  ) : (
    <a href={event.url} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  );
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function MonthGrid({
  groups,
  filters,
  monthStart,
  monthEndExclusive,
}: {
  groups: Record<string, CalendarEvent[]>;
  filters: Filters;
  monthStart: string;
  monthEndExclusive: string;
}) {
  const start = new Date(monthStart);
  const end = new Date(monthEndExclusive);
  const daysInMonth = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  const startWeekday = start.getUTCDay();

  const cells: { key: string | null; day: number | null }[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ key: null, day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), d));
    cells.push({ key: date.toISOString().slice(0, 10), day: d });
  }

  return (
    <div className="grid grid-cols-7 gap-1 text-xs">
      {WEEKDAY_LABELS.map((d) => (
        <div key={d} className="px-1 py-1 text-center font-medium text-muted">
          {d}
        </div>
      ))}
      {cells.map((cell, i) => {
        if (!cell.key) return <div key={`empty-${i}`} />;
        const events = (groups[cell.key] ?? []).filter((e) => passesFilter(e.type, filters));
        return (
          <div key={cell.key} className="min-h-16 rounded-md border border-border p-1">
            <p className="text-[11px] text-muted">{cell.day}</p>
            <div className="mt-0.5 flex flex-col gap-0.5">
              {events.slice(0, 3).map((e) => (
                <span
                  key={e.id}
                  className="truncate rounded bg-accent/10 px-1 py-0.5 text-[10px] text-accent"
                  title={e.title}
                >
                  {e.title}
                </span>
              ))}
              {events.length > 3 && <span className="text-[10px] text-muted">+{events.length - 3} more</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
