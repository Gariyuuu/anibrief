"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { removeAnimeListEntry } from "@/lib/actions/animeList";
import { removeMangaListEntry } from "@/lib/actions/mangaList";

export function RemoveFromListButton({ kind, mediaId }: { kind: "anime" | "manga"; mediaId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      try {
        if (kind === "anime") {
          await removeAnimeListEntry(mediaId);
        } else {
          await removeMangaListEntry(mediaId);
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove");
      }
    });
  }

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        disabled={pending}
        onClick={handleRemove}
        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted transition-colors hover:border-negative/50 hover:text-negative disabled:opacity-60"
      >
        <Trash2 className="h-3 w-3" /> {pending ? "Removing…" : "Remove"}
      </button>
      {error && <p className="text-[11px] text-negative">{error}</p>}
    </div>
  );
}
