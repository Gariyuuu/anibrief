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
import { EmptyState } from "@/components/ui/EmptyState";
import { BookOpen } from "lucide-react";

export const revalidate = 1800;

async function loadCharacter(id: string) {
  const decoded = decodeURIComponent(id);
  const { source, numericId } = parseInternalId(decoded);
  if (source !== "anilist" || Number.isNaN(numericId)) return null;
  return AniListProvider.getCharacterById(numericId);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const result = await loadCharacter(id);
  return { title: result ? result.character.name : "Character" };
}

export default async function CharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await loadCharacter(id);
  if (!result) notFound();
  const { character } = result;

  const { userId } = await auth();
  const follows = userId ? await getUserFollows(userId) : [];
  const alreadyFollowing = follows.some((f) => f.targetType === "character" && f.targetId === character.id);

  const dob = character.dateOfBirth;
  const hasFullBirthday = Boolean(dob?.year && dob?.month && dob?.day);
  const hasPartialBirthday = Boolean(!hasFullBirthday && dob?.month && dob?.day);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg border border-border">
          {character.image ? (
            <Image src={character.image} alt="" fill sizes="128px" className="object-cover" />
          ) : (
            <div className="h-full w-full bg-border" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{character.name}</h1>
          {character.nativeName && <p className="text-sm text-muted">{character.nativeName}</p>}
          {character.alternateNames.length > 0 && (
            <p className="mt-0.5 text-xs text-muted">Also known as: {character.alternateNames.join(", ")}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone="accent">Character</Badge>
            {typeof character.favourites === "number" && (
              <Badge tone="neutral">{character.favourites.toLocaleString()} favorites</Badge>
            )}
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
            {!hasFullBirthday && !hasPartialBirthday && <Badge tone="neutral">Birthday unknown</Badge>}
          </div>

          <div className="mt-3">
            <FollowButton targetType="character" targetId={character.id} targetLabel={character.name} initialFollowing={alreadyFollowing} />
          </div>
        </div>
      </div>

      {character.description && (
        <Card className="p-4">
          <h2 className="text-sm font-semibold">About</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-muted">{character.description}</p>
        </Card>
      )}

      <Card className="p-4">
        <h2 className="text-sm font-semibold">Appears in</h2>
        {character.media.length === 0 ? (
          <div className="mt-3">
            <EmptyState icon={BookOpen} title="No linked media" description="AniList doesn't list any anime or manga appearances for this character yet." />
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {character.media.map((appearance, i) => (
              <Link
                key={`${appearance.mediaId}-${i}`}
                href={`/${appearance.mediaKind}/${encodeURIComponent(appearance.mediaId)}`}
                className="truncate rounded-md border border-border px-2.5 py-1.5 text-xs hover:border-accent/50 hover:text-accent"
              >
                {appearance.mediaTitle}
              </Link>
            ))}
          </div>
        )}
      </Card>

      <a href={character.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted hover:text-accent">
        View on AniList →
      </a>
    </div>
  );
}
