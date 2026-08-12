import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { AniListProvider } from "@/lib/providers/anilist";
import { getUserFollows } from "@/lib/actions/follows";
import { parseInternalId } from "@/lib/utils/mediaId";
import { FollowButton } from "@/components/actions/FollowButton";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { PersonRole } from "@/lib/types/person";

export const revalidate = 86400; // 24h

const ROLE_LABEL: Record<PersonRole, string> = {
  voice_actor: "Voice actor",
  author: "Author",
  artist: "Artist",
  director: "Director",
  producer: "Producer",
  composer: "Composer",
  studio: "Studio",
};

async function loadPerson(id: string) {
  const decoded = decodeURIComponent(id);
  const { source, numericId } = parseInternalId(decoded);
  if (source !== "anilist" || Number.isNaN(numericId)) return null;
  return AniListProvider.getStaffById(numericId);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const result = await loadPerson(id);
  return { title: result ? result.person.name : "Person" };
}

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await loadPerson(id);
  if (!result) notFound();
  const { person } = result;

  const { userId } = await auth();
  const follows = userId ? await getUserFollows(userId) : [];
  const alreadyFollowing = follows.some((f) => f.targetType === "person" && f.targetId === person.id);

  const dob = person.dateOfBirth;
  const hasFullBirthday = Boolean(dob?.year && dob?.month && dob?.day);
  const hasPartialBirthday = Boolean(!hasFullBirthday && dob?.month && dob?.day);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg border border-border">
          {person.image ? (
            <Image src={person.image} alt="" fill sizes="128px" className="object-cover" />
          ) : (
            <div className="h-full w-full bg-border" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{person.name}</h1>
          {person.nativeName && <p className="text-sm text-muted">{person.nativeName}</p>}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone="accent">{ROLE_LABEL[person.primaryRole]}</Badge>
            {hasFullBirthday && dob && (
              <Badge tone="neutral">
                Born{" "}
                {new Date(Date.UTC(dob.year!, dob.month! - 1, dob.day!)).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </Badge>
            )}
            {hasPartialBirthday && dob && (
              <Badge tone="neutral">
                Birthday{" "}
                {new Date(Date.UTC(2000, dob.month! - 1, dob.day!)).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  timeZone: "UTC",
                })}{" "}
                (year unknown)
              </Badge>
            )}
            {person.homeTown && <Badge tone="neutral">{person.homeTown}</Badge>}
          </div>

          <div className="mt-3">
            <FollowButton targetId={person.id} targetLabel={person.name} initialFollowing={alreadyFollowing} />
          </div>
        </div>
      </div>

      {person.description && (
        <Card className="p-4">
          <h2 className="text-sm font-semibold">About</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-muted">{person.description}</p>
        </Card>
      )}

      {person.notableRoles.length > 0 && (
        <Card className="p-4">
          <h2 className="text-sm font-semibold">Notable works</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {person.notableRoles.map((role, i) => (
              <Link
                key={`${role.mediaId}-${i}`}
                href={`/anime/${encodeURIComponent(role.mediaId)}`}
                className="truncate rounded-md border border-border px-2.5 py-1.5 text-xs hover:border-accent/50 hover:text-accent"
              >
                {role.mediaTitle}
                {role.character ? ` · ${role.character}` : ""}
              </Link>
            ))}
          </div>
        </Card>
      )}

      <a href={person.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted hover:text-accent">
        View on AniList →
      </a>
    </div>
  );
}
