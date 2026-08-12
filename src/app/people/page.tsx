import type { Metadata } from "next";
import { Cake, Users } from "lucide-react";
import { AniListProvider } from "@/lib/providers/anilist";
import { PersonCard } from "@/components/people/PersonCard";
import { CharacterCard } from "@/components/people/CharacterCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { upcomingBirthdays } from "@/lib/utils/birthdays";

export const metadata: Metadata = { title: "People" };
export const revalidate = 172800; // 2 days

type DirectoryType = "people" | "characters";

const TABS: TabItem[] = [
  { href: "/people?type=people", label: "People" },
  { href: "/people?type=characters", label: "Characters" },
];

function SearchForm({ q, type }: { q?: string; type: DirectoryType }) {
  return (
    <form action="/people" className="flex gap-2">
      <input type="hidden" name="type" value={type} />
      <input
        name="q"
        defaultValue={q}
        placeholder={type === "people" ? "Search voice actors, directors, authors…" : "Search characters…"}
        className="w-full max-w-sm rounded-md border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent"
      />
      <button type="submit" className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-accent/50">
        Search
      </button>
    </form>
  );
}

const PERPAGE = 24;

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
}) {
  const { q, type: rawType, page: rawPage } = await searchParams;
  const type: DirectoryType = rawType === "characters" ? "characters" : "people";
  const page = Math.max(1, Number(rawPage) || 1);

  const commonSearchParams = { q, type, page: rawPage };

  if (type === "characters") {
    const result = q
      ? await AniListProvider.searchCharacters(q, { page, perPage: PERPAGE })
      : await AniListProvider.getPopularCharacters({ page, perPage: PERPAGE });

    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">People</h1>
          <p className="mt-1 text-sm text-muted">Voice actors, directors, authors, composers, and characters from AniList.</p>
        </div>
        <Tabs items={TABS} active="/people?type=characters" />
        <SearchForm q={q} type={type} />
        {!q && <p className="text-xs text-muted">Browsing AniList&apos;s most-favorited characters.</p>}

        {result.items.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No characters found"
            description={q ? `No AniList characters matched "${q}".` : "No characters available right now."}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((c) => (
                <CharacterCard key={c.id} character={c} />
              ))}
            </div>
            <Pagination page={page} hasNextPage={result.hasNextPage} basePath="/people" searchParams={commonSearchParams} />
          </>
        )}
      </div>
    );
  }

  // type === "people"
  if (q) {
    const result = await AniListProvider.searchStaff(q, { page, perPage: PERPAGE });
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">People</h1>
          <p className="mt-1 text-sm text-muted">Voice actors, directors, authors, composers, and characters from AniList.</p>
        </div>
        <Tabs items={TABS} active="/people?type=people" />
        <SearchForm q={q} type={type} />
        {result.items.length === 0 ? (
          <EmptyState icon={Users} title="No people found" description={`No AniList staff matched "${q}".`} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((p) => (
                <PersonCard key={p.id} person={p} />
              ))}
            </div>
            <Pagination page={page} hasNextPage={result.hasNextPage} basePath="/people" searchParams={commonSearchParams} />
          </>
        )}
      </div>
    );
  }

  const [bornToday, popularForBirthdays, browsePage] = await Promise.all([
    AniListProvider.getStaffBirthdaysToday(),
    AniListProvider.getPopularStaff({ perPage: 100 }),
    AniListProvider.getPopularStaff({ page, perPage: PERPAGE }),
  ]);
  const upcoming = upcomingBirthdays(popularForBirthdays.items, 14);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">People</h1>
        <p className="mt-1 text-sm text-muted">Voice actors, directors, authors, composers, and characters from AniList.</p>
      </div>
      <Tabs items={TABS} active="/people?type=people" />
      <SearchForm q={q} type={type} />

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

      <section>
        <h2 className="text-sm font-semibold">Browse all people</h2>
        <p className="mt-1 text-xs text-muted">Sorted by most favorited on AniList.</p>
        {browsePage.items.length === 0 ? (
          <EmptyState icon={Users} title="No people available" description="Nothing to show right now." />
        ) : (
          <>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {browsePage.items.map((p) => (
                <PersonCard key={p.id} person={p} />
              ))}
            </div>
            <Pagination page={page} hasNextPage={browsePage.hasNextPage} basePath="/people" searchParams={commonSearchParams} />
          </>
        )}
      </section>
    </div>
  );
}
