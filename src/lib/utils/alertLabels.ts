import type { AlertType, AlertFrequency } from "@/lib/types/userList";

export const ALERT_TYPES: AlertType[] = [
  "new_episode",
  "season_premiere",
  "finale",
  "movie_release",
  "sequel_announcement",
  "adaptation_announcement",
  "trailer_release",
  "streaming_availability",
  "manga_volume",
  "ost_release",
  "voice_actor_news",
  "studio_news",
  "schedule_delay",
  "birthday",
  "anniversary",
];

export const ALERT_FREQUENCIES: AlertFrequency[] = ["immediate", "daily_digest", "weekly_digest", "off"];

/** "new_episode" -> "New episode" */
export function humanizeAlertType(type: string): string {
  const spaced = type.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function humanizeFrequency(frequency: string): string {
  return humanizeAlertType(frequency);
}
