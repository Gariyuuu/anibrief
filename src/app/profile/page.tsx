import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { Show, SignInButton } from "@clerk/nextjs";
import { Heart, LogIn, Settings, UserCircle } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { AnimeGrid } from "@/components/anime/AnimeGrid";
import { UnfollowChip } from "@/components/actions/UnfollowChip";
import { getOrCreateProfile } from "@/lib/actions/profile";
import { getUserAnimeList } from "@/lib/actions/animeList";
import { getUserMangaList } from "@/lib/actions/mangaList";
import { getUserFollows } from "@/lib/actions/follows";
import { AniListProvider } from "@/lib/providers/anilist";
import type { NormalizedMedia } from "@/lib/types/media";

export const metadata: Metadata = { title: "Profile" };

const FOLLOW_GROUPS: { type: "studio" | "person" | "tag" | "genre"; label: string }[] = [
  { type: "studio", label: "Studios" },
  { type: "person", label: "People" },
  { type: "tag", label: "Tags" },
  { type: "genre", label: "Genres" },
];

export default async function ProfilePage() {
  const user = await currentUser();

  let profile: Awaited<ReturnType<typeof getOrCreateProfile>> = null;
  let animeCount = 0;
  let mangaCount = 0;
  let completedCount = 0;
  let favorites: NormalizedMedia[] = [];
  let follows: Awaited<ReturnType<typeof getUserFollows>> = [];

  if (user) {
    const [p, animeList, mangaList, followList] = await Promise.all([
      getOrCreateProfile(user.id),
      getUserAnimeList(user.id),
      getUserMangaList(user.id),
      getUserFollows(user.id),
    ]);
    profile = p;
    follows = followList;
    animeCount = animeList.length;
    mangaCount = mangaList.length;
    completedCount =
      animeList.filter((e) => e.status === "completed").length + mangaList.filter((e) => e.status === "completed").length;

    const favoriteIds = [
      ...animeList.filter((e) => e.isFavorite).map((e) => e.mediaId),
      ...mangaList.filter((e) => e.isFavorite).map((e) => e.mediaId),
    ];
    // Real lookups against AniList for each favorited id — not stubbed cards,
    // so genre/score/etc shown here are genuinely the current AniList data.
    const results = await Promise.all(
      favoriteIds.map(async (id) => {
        const numericId = Number(id.split(":")[1]);
        if (Number.isNaN(numericId)) return null;
        return AniListProvider.getMediaById(numericId);
      })
    );
    favorites = results.filter((m): m is NormalizedMedia => m !== null);
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted">Your account, favorites, and follows.</p>
      </div>

      <Show when="signed-out">
        <EmptyState
          icon={LogIn}
          title="Sign in to view your profile"
          description="Your favorites, follows, and personalization live here once you're signed in."
          action={
            <SignInButton mode="modal">
              <Button>Sign in</Button>
            </SignInButton>
          }
        />
      </Show>

      <Show when="signed-in">
        <div className="flex flex-col gap-6">
          {user && (
            <Card className="flex flex-wrap items-center gap-4 p-4">
              <Avatar src={user.imageUrl} alt={user.fullName ?? user.username ?? "You"} size={56} />
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold">{user.fullName ?? user.username ?? "Anonymous"}</p>
                <p className="text-sm text-muted">{user.primaryEmailAddress?.emailAddress ?? "No email on file"}</p>
                {profile?.bio && <p className="mt-1 text-sm text-foreground/90">{profile.bio}</p>}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {profile?.timezone && <Badge>{profile.timezone}</Badge>}
                  {profile?.region && <Badge>{profile.region}</Badge>}
                  {profile && <Badge tone={profile.isPublic ? "positive" : "neutral"}>{profile.isPublic ? "Public profile" : "Private profile"}</Badge>}
                </div>
              </div>
              <Button href="/settings" variant="secondary">
                <Settings className="h-3.5 w-3.5" /> Edit settings
              </Button>
            </Card>
          )}

          {!profile && (
            <EmptyState
              icon={UserCircle}
              title="Personalization isn't saved yet"
              description="This deployment doesn't have a database configured, so favorites, follows, and preferences can't be persisted right now."
            />
          )}

          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 text-center">
              <p className="text-xl font-semibold">{animeCount}</p>
              <p className="text-xs text-muted">Anime tracked</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-xl font-semibold">{mangaCount}</p>
              <p className="text-xs text-muted">Manga tracked</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-xl font-semibold">{completedCount}</p>
              <p className="text-xs text-muted">Completed</p>
            </Card>
          </div>

          <section>
            <div className="mb-2 flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold">Favorites</h2>
            </div>
            {favorites.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="No favorites yet"
                description="Star an entry from My List to feature it here."
                action={
                  <Button href="/my-list" variant="secondary" size="sm">
                    Go to My List
                  </Button>
                }
              />
            ) : (
              <AnimeGrid items={favorites} />
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold">Following</h2>
            {follows.length === 0 ? (
              <EmptyState
                icon={UserCircle}
                title="Not following anything yet"
                description="Follow studios, people, tags, or genres from their pages to see personalized news and updates."
              />
            ) : (
              <div className="flex flex-col gap-3">
                {FOLLOW_GROUPS.map((group) => {
                  const items = follows.filter((f) => f.targetType === group.type);
                  if (items.length === 0) return null;
                  return (
                    <div key={group.type}>
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">{group.label}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {items.map((f) => (
                          <UnfollowChip key={f.id} targetType={group.type} targetId={f.targetId} targetLabel={f.targetLabel} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <p className="text-xs text-muted">
            <Link href="/settings" className="text-accent hover:underline">
              Full settings, including privacy and visibility
            </Link>{" "}
            live on the Settings page — this is a self-view only; public profile pages by username aren&apos;t built yet.
          </p>
        </div>
      </Show>
    </div>
  );
}
