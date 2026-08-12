import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { Show } from "@clerk/nextjs";
import { AniListProvider } from "@/lib/providers/anilist";
import { getUserReminders } from "@/lib/actions/calendarReminders";
import {
  characterBirthdayToEvent,
  episodeToEvent,
  groupEventsByUtcDay,
  reminderToEvent,
  staffBirthdayToEvent,
} from "@/lib/utils/calendarEvents";
import { CalendarView } from "@/components/calendar/CalendarView";
import { AddReminderForm } from "@/components/calendar/AddReminderForm";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Calendar" };
export const revalidate = 86400; // 24h

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view: rawView } = await searchParams;
  const view = rawView === "month" ? "month" : "agenda";

  const { userId } = await auth();

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEndExclusive = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const startSec = Math.floor(monthStart.getTime() / 1000);
  const endSec = Math.floor(monthEndExclusive.getTime() / 1000);
  const todayIso = `${now.toISOString().slice(0, 10)}T00:00:00.000Z`;

  const [airing, staffBirthdays, characterBirthdays, reminders] = await Promise.all([
    AniListProvider.getAiringBetween(startSec, endSec, 200),
    AniListProvider.getStaffBirthdaysToday(),
    AniListProvider.getCharacterBirthdaysToday(),
    userId ? getUserReminders(userId) : Promise.resolve([]),
  ]);

  const events = [
    ...airing.map(episodeToEvent),
    ...staffBirthdays.map((p) => staffBirthdayToEvent(p, todayIso)),
    ...characterBirthdays.map((c) => characterBirthdayToEvent(c, todayIso)),
    ...reminders.map((r) => reminderToEvent(r)),
  ];

  const groups = groupEventsByUtcDay(events);

  const tabs: { id: "agenda" | "month"; label: string }[] = [
    { id: "agenda", label: "Agenda" },
    { id: "month", label: "Month" },
  ];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="mt-1 text-sm text-muted">
            Airing episodes this month (AniList&apos;s live schedule), today&apos;s tracked birthdays, and your
            reminders — all in one place. Episode dates are shown in UTC day buckets; times within each day use your
            local timezone.
          </p>
        </div>
        <Button href="/api/calendar/ics" variant="secondary" size="sm">
          <Download className="h-3.5 w-3.5" /> Export .ics
        </Button>
      </div>

      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/calendar?view=${t.id}`}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium",
              view === t.id ? "border-accent text-foreground" : "border-transparent text-muted hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <Show when="signed-in">
        <AddReminderForm />
      </Show>
      <Show when="signed-out">
        <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted">
          Sign in to add your own reminders to this calendar.
        </p>
      </Show>

      <CalendarView
        groups={groups}
        view={view}
        monthStart={monthStart.toISOString()}
        monthEndExclusive={monthEndExclusive.toISOString()}
      />
    </div>
  );
}
