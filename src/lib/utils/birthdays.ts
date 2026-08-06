import type { NormalizedPerson } from "@/lib/types/person";

export interface UpcomingBirthday {
  person: NormalizedPerson;
  /** Days from `today` (UTC) until the next occurrence of this birthday. Always 1-`withinDays`. */
  daysUntil: number;
}

/**
 * Computes which people in `people` have a birthday within the next
 * `withinDays` days, based on `dateOfBirth.month`/`.day` only (AniList
 * sometimes omits `year`, and today's actual birthdays are handled
 * separately by `getStaffBirthdaysToday`, so `daysUntil` is always >= 1).
 * People without a known month+day are skipped entirely — never fabricate
 * a birthday for someone AniList hasn't recorded one for.
 */
export function upcomingBirthdays(
  people: NormalizedPerson[],
  withinDays = 14,
  today: Date = new Date()
): UpcomingBirthday[] {
  const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const year = today.getUTCFullYear();
  const results: UpcomingBirthday[] = [];

  for (const person of people) {
    const dob = person.dateOfBirth;
    if (!dob?.month || !dob?.day) continue;

    let candidate = Date.UTC(year, dob.month - 1, dob.day);
    if (candidate <= todayUTC) {
      candidate = Date.UTC(year + 1, dob.month - 1, dob.day);
    }
    const daysUntil = Math.round((candidate - todayUTC) / 86_400_000);
    if (daysUntil >= 1 && daysUntil <= withinDays) {
      results.push({ person, daysUntil });
    }
  }

  return results.sort((a, b) => a.daysUntil - b.daysUntil);
}
