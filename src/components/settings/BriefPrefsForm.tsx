"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils/cn";
import { updateProfile } from "@/lib/actions/profile";
import type { BriefMode } from "@/components/briefing/BriefModeToggle";

const MODES: { id: BriefMode; label: string; hint: string }[] = [
  { id: "quick", label: "Quick", hint: "~2 min — summary, episodes, top stories" },
  { id: "standard", label: "Standard", hint: "~5 min — adds birthdays, trending, industry" },
  { id: "deep", label: "Deep", hint: "~10 min — everything, including tomorrow, music, manga, trailers" },
];

/**
 * Sets the *default* depth for the Daily Brief page. Note: the Daily Brief
 * page's own BriefModeToggle currently starts every visit at "standard"
 * regardless of this setting (it's client-only local state, not wired to
 * the profile) — saved here for when that wiring is added.
 */
export function BriefPrefsForm({ initialMode }: { initialMode: string }) {
  const [mode, setMode] = useState(initialMode);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function select(id: BriefMode) {
    setMode(id);
    setError(null);
    startTransition(async () => {
      try {
        await updateProfile({ briefMode: id });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="inline-flex flex-wrap rounded-lg border border-border bg-surface p-0.5">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={pending}
            title={m.hint}
            onClick={() => select(m.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              mode === m.id ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted">{MODES.find((m) => m.id === mode)?.hint}</p>
      {saved && <p className="text-xs text-positive">Saved.</p>}
      {error && <p className="text-xs text-negative">{error}</p>}
    </div>
  );
}
