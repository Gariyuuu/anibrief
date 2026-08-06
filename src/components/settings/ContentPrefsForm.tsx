"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils/cn";
import { ANILIST_GENRES } from "@/lib/constants/genres";
import { updateProfile } from "@/lib/actions/profile";

/** Preferred/blocked genre chips — mutually exclusive per genre (picking one side clears the other). Saves on every click. */
export function ContentPrefsForm({
  initialPreferred,
  initialBlocked,
}: {
  initialPreferred: string[];
  initialBlocked: string[];
}) {
  const [preferred, setPreferred] = useState<string[]>(initialPreferred);
  const [blocked, setBlocked] = useState<string[]>(initialBlocked);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function save(nextPreferred: string[], nextBlocked: string[]) {
    startTransition(async () => {
      try {
        await updateProfile({ preferredGenres: nextPreferred, blockedGenres: nextBlocked });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  function togglePreferred(genre: string) {
    setError(null);
    const nextPreferred = preferred.includes(genre) ? preferred.filter((g) => g !== genre) : [...preferred, genre];
    const nextBlocked = blocked.filter((g) => g !== genre);
    setPreferred(nextPreferred);
    setBlocked(nextBlocked);
    save(nextPreferred, nextBlocked);
  }

  function toggleBlocked(genre: string) {
    setError(null);
    const nextBlocked = blocked.includes(genre) ? blocked.filter((g) => g !== genre) : [...blocked, genre];
    const nextPreferred = preferred.filter((g) => g !== genre);
    setBlocked(nextBlocked);
    setPreferred(nextPreferred);
    save(nextPreferred, nextBlocked);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-medium text-muted">Genres you like</p>
        <div className="flex flex-wrap gap-1.5">
          {ANILIST_GENRES.map((g) => (
            <button
              key={g}
              type="button"
              disabled={pending}
              onClick={() => togglePreferred(g)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                preferred.includes(g) ? "border-positive bg-positive/15 text-positive" : "border-border text-muted hover:text-foreground"
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-muted">Genres to hide</p>
        <div className="flex flex-wrap gap-1.5">
          {ANILIST_GENRES.map((g) => (
            <button
              key={g}
              type="button"
              disabled={pending}
              onClick={() => toggleBlocked(g)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                blocked.includes(g) ? "border-negative bg-negative/15 text-negative" : "border-border text-muted hover:text-foreground"
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
      {saved && <p className="text-xs text-positive">Saved.</p>}
      {error && <p className="text-xs text-negative">{error}</p>}
    </div>
  );
}
