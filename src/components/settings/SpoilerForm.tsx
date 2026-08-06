"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils/cn";
import { updateProfile } from "@/lib/actions/profile";

const SPOILER_MODES: { id: string; label: string; hint: string }[] = [
  { id: "hide_all", label: "Hide all spoilers", hint: "Blur and withhold spoiler-tagged content everywhere." },
  { id: "blur_titles", label: "Blur spoiler titles", hint: "Blur spoiler-tagged titles/tags, but not synopses." },
  { id: "allow_watched", label: "Allow for watched titles", hint: "Show spoilers only for titles already on your completed list." },
  { id: "allow_all", label: "Show everything", hint: "No spoiler protection." },
];

export function SpoilerForm({ initialMode }: { initialMode: string }) {
  const [mode, setMode] = useState(initialMode);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function select(id: string) {
    setMode(id);
    setError(null);
    startTransition(async () => {
      try {
        await updateProfile({ spoilerMode: id });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Spoiler visibility">
        {SPOILER_MODES.map((m) => (
          <label
            key={m.id}
            className={cn(
              "flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
              mode === m.id ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"
            )}
          >
            <input
              type="radio"
              name="spoilerMode"
              value={m.id}
              checked={mode === m.id}
              disabled={pending}
              onChange={() => select(m.id)}
              className="mt-0.5"
            />
            <span>
              <span className="block font-medium">{m.label}</span>
              <span className="block text-xs text-muted">{m.hint}</span>
            </span>
          </label>
        ))}
      </div>
      {saved && <p className="text-xs text-positive">Saved.</p>}
      {error && <p className="text-xs text-negative">{error}</p>}
    </div>
  );
}
