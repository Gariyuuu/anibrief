import type { AiringEntry } from "@/lib/types/media";
import type { NormalizedPerson } from "@/lib/types/person";
import type { CharacterBirthday } from "@/lib/providers/anilist/mappers";
import type { CalendarEvent } from "@/lib/types/calendarEvent";

export function episodeToEvent(entry: AiringEntry): CalendarEvent {
  return {
    id: `episode:${entry.mediaId}:${entry.episode}`,
    type: "episode",
    title: `${entry.anime.titles.preferred} — Episode ${entry.episode}`,
    date: entry.airingAt,
    mediaId: entry.mediaId,
    personId: null,
    url: `/anime/${encodeURIComponent(entry.mediaId)}`,
    description: null,
  };
}

/** `onDateIso` should be today's date (these only ever come from `isBirthday: true`, i.e. today). */
export function staffBirthdayToEvent(person: NormalizedPerson, onDateIso: string): CalendarEvent {
  return {
    id: `birthday:${person.id}`,
    type: "birthday",
    title: `${person.name}'s birthday`,
    date: onDateIso,
    mediaId: null,
    personId: person.id,
    url: `/people/${encodeURIComponent(person.id)}`,
    description: null,
  };
}

export function characterBirthdayToEvent(character: CharacterBirthday, onDateIso: string): CalendarEvent {
  return {
    id: `char-birthday:${character.id}`,
    type: "birthday",
    title: `${character.name}'s birthday (character)`,
    date: onDateIso,
    mediaId: null,
    personId: null,
    url: character.sourceUrl,
    description: character.mediaTitle ? `From ${character.mediaTitle}` : null,
  };
}

export interface ReminderRow {
  id: string;
  title: string;
  date: Date;
  mediaId: string | null;
  description: string | null;
}

export function reminderToEvent(reminder: ReminderRow): CalendarEvent {
  return {
    id: `reminder:${reminder.id}`,
    type: "user_reminder",
    title: reminder.title,
    date: reminder.date.toISOString(),
    mediaId: reminder.mediaId,
    personId: null,
    url: reminder.mediaId ? `/anime/${encodeURIComponent(reminder.mediaId)}` : null,
    description: reminder.description,
  };
}

/** UTC calendar day, e.g. "2026-08-06" — deterministic across server/client, no hydration mismatch. */
export function utcDayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function groupEventsByUtcDay(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  const groups: Record<string, CalendarEvent[]> = {};
  for (const event of events) {
    const key = utcDayKey(event.date);
    (groups[key] ??= []).push(event);
  }
  for (const list of Object.values(groups)) {
    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  return groups;
}
