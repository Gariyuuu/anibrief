import type { AiringSeason } from "@/lib/types/media";

const SEASON_ORDER: AiringSeason[] = ["WINTER", "SPRING", "SUMMER", "FALL"];

export function currentSeason(date = new Date()): { season: AiringSeason; year: number } {
  const month = date.getUTCMonth(); // 0-11
  const year = date.getUTCFullYear();
  if (month <= 1 || month === 11) return { season: "WINTER", year: month === 11 ? year + 1 : year };
  if (month <= 4) return { season: "SPRING", year };
  if (month <= 7) return { season: "SUMMER", year };
  return { season: "FALL", year };
}

export function adjacentSeason(season: AiringSeason, year: number, delta: 1 | -1): { season: AiringSeason; year: number } {
  const idx = SEASON_ORDER.indexOf(season);
  const nextIdx = (idx + delta + SEASON_ORDER.length) % SEASON_ORDER.length;
  const yearDelta = idx + delta < 0 ? -1 : idx + delta > SEASON_ORDER.length - 1 ? 1 : 0;
  return { season: SEASON_ORDER[nextIdx], year: year + yearDelta };
}

export function seasonLabel(season: AiringSeason, year: number): string {
  return `${season.charAt(0) + season.slice(1).toLowerCase()} ${year}`;
}
