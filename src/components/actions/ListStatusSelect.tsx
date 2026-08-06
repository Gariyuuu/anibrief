"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addOrUpdateAnimeListEntry } from "@/lib/actions/animeList";
import { addOrUpdateMangaListEntry } from "@/lib/actions/mangaList";
import type { AnimeListStatus, MangaListStatus } from "@/lib/types/userList";

const ANIME_STATUSES: { id: AnimeListStatus; label: string }[] = [
  { id: "watching", label: "Watching" },
  { id: "planning", label: "Planning" },
  { id: "completed", label: "Completed" },
  { id: "paused", label: "Paused" },
  { id: "dropped", label: "Dropped" },
  { id: "rewatching", label: "Rewatching" },
];

const MANGA_STATUSES: { id: MangaListStatus; label: string }[] = [
  { id: "reading", label: "Reading" },
  { id: "planning", label: "Planning" },
  { id: "completed", label: "Completed" },
  { id: "paused", label: "Paused" },
  { id: "dropped", label: "Dropped" },
  { id: "rereading", label: "Rereading" },
];

/** Inline status changer for a My List entry — calls the real list server action on change, then refreshes so counts/filters stay accurate. */
export function ListStatusSelect({
  kind,
  mediaId,
  mediaTitle,
  coverImage,
  status,
  progress,
  score,
}: {
  kind: "anime" | "manga";
  mediaId: string;
  mediaTitle: string;
  coverImage: string | null;
  status: string;
  progress: number;
  score: number | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const options = kind === "anime" ? ANIME_STATUSES : MANGA_STATUSES;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    const previous = value;
    setValue(next);
    setError(null);
    startTransition(async () => {
      try {
        if (kind === "anime") {
          await addOrUpdateAnimeListEntry({
            mediaId,
            mediaTitle,
            coverImage,
            status: next as AnimeListStatus,
            progress,
            score,
          });
        } else {
          await addOrUpdateMangaListEntry({
            mediaId,
            mediaTitle,
            coverImage,
            status: next as MangaListStatus,
            progressChapters: progress,
            score,
          });
        }
        router.refresh();
      } catch (err) {
        setValue(previous);
        setError(err instanceof Error ? err.message : "Failed to update status");
      }
    });
  }

  return (
    <div className="flex flex-col gap-0.5">
      <select
        value={value}
        disabled={pending}
        onChange={handleChange}
        className="rounded-md border border-border bg-surface px-2 py-1 text-xs outline-none focus:border-accent disabled:opacity-60"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-[11px] text-negative">{error}</p>}
    </div>
  );
}
