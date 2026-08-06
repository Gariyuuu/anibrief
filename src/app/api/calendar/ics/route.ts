import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { AniListProvider } from "@/lib/providers/anilist";
import { getUserReminders } from "@/lib/actions/calendarReminders";
import { episodeToEvent, reminderToEvent } from "@/lib/utils/calendarEvents";
import type { CalendarEvent } from "@/lib/types/calendarEvent";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function icsEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** `YYYYMMDDTHHMMSSZ`, per RFC 5545. */
function toIcsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function absoluteUrl(url: string): string {
  return url.startsWith("/") ? `${APP_URL}${url}` : url;
}

function buildVevent(event: CalendarEvent, dtstamp: string): string {
  const lines = [
    "BEGIN:VEVENT",
    `UID:${event.id}@anibrief`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${toIcsDate(event.date)}`,
    `SUMMARY:${icsEscape(event.title)}`,
  ];
  if (event.description) lines.push(`DESCRIPTION:${icsEscape(event.description)}`);
  if (event.url) lines.push(`URL:${absoluteUrl(event.url)}`);
  lines.push("END:VEVENT");
  return lines.join("\r\n");
}

/**
 * GET /api/calendar/ics — downloadable .ics of episodes airing in the next
 * 30 days plus the signed-in user's own reminders. Built by hand (no
 * external ics library needed) per RFC 5545's minimal VEVENT shape.
 */
export async function GET() {
  const { userId } = await auth();

  const now = new Date();
  const startSec = Math.floor(now.getTime() / 1000);
  const endSec = startSec + 30 * 86400;

  const [airing, reminders] = await Promise.all([
    AniListProvider.getAiringBetween(startSec, endSec, 200),
    userId ? getUserReminders(userId) : Promise.resolve([]),
  ]);

  const events: CalendarEvent[] = [...airing.map(episodeToEvent), ...reminders.map(reminderToEvent)];
  const dtstamp = toIcsDate(now.toISOString());

  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AniBrief//Calendar//EN",
    "CALSCALE:GREGORIAN",
    ...events.map((e) => buildVevent(e, dtstamp)),
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="anibrief-calendar.ics"',
    },
  });
}
