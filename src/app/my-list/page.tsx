import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { Show, SignInButton } from "@clerk/nextjs";
import { ListChecks, LogIn } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import { ListStatusSelect } from "@/components/actions/ListStatusSelect";
import { RemoveFromListButton } from "@/components/actions/RemoveFromListButton";
import { FavoriteToggleButton } from "@/components/actions/FavoriteToggleButton";
import { getUserAnimeList } from "@/lib/actions/animeList";
import { getUserMangaList } from "@/lib/actions/mangaList";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "My List" };

type ListType = "anime" | "manga";

const ANIME_STATUSES = [
  { id: "watching", label: "Watching" },
  { id: "planning", label: "Planning" },
  { id: "completed", label: "Completed" },
  { id: "paused", label: "Paused" },
  { id: "dropped", label: "Dropped" },
  { id: "rewatching", label: "Rewatching" },
] as const;

const MANGA_STATUSES = [
  { id: "reading", label: "Reading" },
  { id: "planning", label: "Planning" },
  { id: "completed", label: "Completed" },
  { id: "paused", label: "Paused" },
  { id: "dropped", label: "Dropped" },
  { id: "rereading", label: "Rereading" },
] as const;

interface ListRow {
  id: string;
  mediaId: string;
  mediaTitle: string;
  coverImage: string | null;
  status: string;
  progress: number;
  score: number | null;
  isFavorite: boolean;
}

export default async function MyListPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string }>;
}) {
  const { userId } = await auth();
  const params = await searchParams;
  const type: ListType = params.type === "manga" ? "manga" : "anime";
  const statusDefs = type === "anime" ? ANIME_STATUSES : MANGA_STATUSES;
  const statusFilter = params.status && statusDefs.some((s) => s.id === params.status) ? params.status : "all";

  let rows: ListRow[] = [];
  if (userId) {
    if (type === "anime") {
      const list = await getUserAnimeList(userId);
      rows = list.map((e) => ({
        id: e.id,
        mediaId: e.mediaId,
        mediaTitle: e.mediaTitle,
        coverImage: e.coverImage,
        status: e.status,
        progress: e.progress,
        score: e.score,
        isFavorite: e.isFavorite,
      }));
    } else {
      const list = await getUserMangaList(userId);
      rows = list.map((e) => ({
        id: e.id,
        mediaId: e.mediaId,
        mediaTitle: e.mediaTitle,
        coverImage: e.coverImage,
        status: e.status,
        progress: e.progressChapters,
        score: e.score,
        isFavorite: e.isFavorite,
      }));
    }
  }

  const filtered = statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My List</h1>
        <p className="mt-1 text-sm text-muted">Titles you&apos;re tracking, with live status, progress, and score.</p>
      </div>

      <Show when="signed-out">
        <EmptyState
          icon={LogIn}
          title="Sign in to build your list"
          description="Track what you're watching or reading, rate it, and mark favorites — synced to your account."
          action={
            <SignInButton mode="modal">
              <Button>Sign in</Button>
            </SignInButton>
          }
        />
      </Show>

      <Show when="signed-in">
        <div className="flex flex-col gap-4">
          <Tabs
            items={[
              { href: "/my-list?type=anime", label: "Anime" },
              { href: "/my-list?type=manga", label: "Manga" },
            ]}
            active={`/my-list?type=${type}`}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/my-list?type=${type}`}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs",
                statusFilter === "all" ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:text-foreground"
              )}
            >
              All ({rows.length})
            </Link>
            {statusDefs.map((s) => (
              <Link
                key={s.id}
                href={`/my-list?type=${type}&status=${s.id}`}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs",
                  statusFilter === s.id ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:text-foreground"
                )}
              >
                {s.label} ({rows.filter((r) => r.status === s.id).length})
              </Link>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title={rows.length === 0 ? `No ${type} on your list yet` : "Nothing in this status"}
              description={
                rows.length === 0
                  ? `Add titles from any ${type} page — the "Add to list" button is on every ${type} card and detail page.`
                  : "Try a different status filter."
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filtered.map((entry) => (
                <Card key={entry.id} className="flex gap-3 p-3">
                  <Link
                    href={`/${type}/${encodeURIComponent(entry.mediaId)}`}
                    className="relative h-24 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-surface-raised"
                  >
                    {entry.coverImage ? (
                      <Image src={entry.coverImage} alt={entry.mediaTitle} fill sizes="64px" className="object-cover" />
                    ) : null}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/${type}/${encodeURIComponent(entry.mediaId)}`}
                        className="line-clamp-2 text-sm font-medium leading-snug hover:text-accent"
                      >
                        {entry.mediaTitle}
                      </Link>
                      <FavoriteToggleButton kind={type} mediaId={entry.mediaId} isFavorite={entry.isFavorite} />
                    </div>
                    <p className="text-xs text-muted">
                      {type === "anime" ? `Episode ${entry.progress}` : `Chapter ${entry.progress}`}
                      {entry.score != null ? ` · ${entry.score}/10` : ""}
                    </p>
                    <div className="mt-auto flex items-center gap-2">
                      <ListStatusSelect
                        kind={type}
                        mediaId={entry.mediaId}
                        mediaTitle={entry.mediaTitle}
                        coverImage={entry.coverImage}
                        status={entry.status}
                        progress={entry.progress}
                        score={entry.score}
                      />
                      <RemoveFromListButton kind={type} mediaId={entry.mediaId} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Show>
    </div>
  );
}
