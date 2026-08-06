export type CalendarEventType =
  | "episode"
  | "premiere"
  | "finale"
  | "movie"
  | "manga_volume"
  | "music_release"
  | "birthday"
  | "anniversary"
  | "user_reminder";

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  date: string; // ISO datetime
  mediaId: string | null;
  personId: string | null;
  url: string | null;
  description: string | null;
}
