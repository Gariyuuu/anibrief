import { formatDistanceToNowStrict, format, isToday, isTomorrow } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export function formatRelativeTime(iso: string): string {
  return `${formatDistanceToNowStrict(new Date(iso))} ago`;
}

export function formatCountdown(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return "airing now";
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `in ${days}d ${hours % 24}h`;
  if (hours > 0) return `in ${hours}h ${mins % 60}m`;
  return `in ${mins}m`;
}

export function formatDayLabel(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEEE, MMM d");
}

export function formatLocalTime(iso: string, timeZone: string, hour12 = true): string {
  return formatInTimeZone(new Date(iso), timeZone, hour12 ? "h:mm a" : "HH:mm");
}

export function formatDigestDate(iso: string): string {
  return format(new Date(iso), "EEEE, MMMM d, yyyy");
}

export const DEFAULT_TIMEZONE = "UTC";

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}
