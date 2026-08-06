import type { Metadata } from "next";
import { Cake, Users } from "lucide-react";
import { AniListProvider } from "@/lib/providers/anilist";
import { PersonCard } from "@/components/people/PersonCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { upcomingBirthdays } from "@/lib/utils/birthdays";

export const metadata: Metadata = { title: "People" };
export const revalidate = 1800;

function SearchForm({ q }: { q?: string }) {
  return (
    <form action="/people" className="flex gap-2">
      <input
        name="q"
        defaultValue={q}
        placeholder="Search voice actors, directors, authors…"
        className="w-full max-w-sm rounded-md border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent"
      />
      <button type="submit" className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-accent/50">
        Search
      </button>
    </form>
  );
}

export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;

  if (q) {
    const results = await AniListProvider.searchStaff(q);
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">People</h1>
          <p className="mt-1 text-sm text-muted">Voice actors, directors, authors, composers, and studios from AniList.</p>
        </div>
        <SearchForm q={q} />
        {results.length === 0 ? (
          <EmptyState icon={Users} title="No people found" description={`No AniList staff matched "${q}".`} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((p) => (
              <PersonCard key={p.id} person={p} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const [bornToday, popular] = await Promise.all([
    AniListProvider.getStaffBirthdaysToday(),
    AniListProvider.getPopularStaff(100),
  ]);
  const upcoming = upcomingBirthdays(popular, 14);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">People</h1>
        <p className="mt-1 text-sm text-muted">Voice actors, directors, authors, composers, and studios from AniList.</p>
      </div>
      <SearchForm q={q} />

      <section>
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
          <Cake className="h-4 w-4 text-accent" /> Born today
        </h2>
        {bornToday.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No tracked staff birthdays today.</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {bornToday.map((p) => (
              <PersonCard key={p.id} person={p} meta="Today" />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold">Upcoming birthdays among AniList&apos;s most-favorited staff</h2>
        <p className="mt-1 text-xs text-muted">
          AniList only supports birthday filtering for the current day, not date ranges. This list is computed from
          the site&apos;s 100 most-favorited staff — a partial, popularity-biased preview, not everyone with an
          upcoming birthday.
        </p>
        {upcoming.length === 0 ? (
          <p className="mt-2 text-sm text-muted">None of the most-favorited staff have a birthday in the next 14 days.</p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {upcoming.map(({ person, daysUntil }) => (
              <PersonCard key={person.id} person={person} meta={daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
