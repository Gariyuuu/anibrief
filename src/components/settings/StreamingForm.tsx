"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils/cn";
import { KNOWN_STREAMING_SITES } from "@/lib/providers/streaming";
import { updateProfile } from "@/lib/actions/profile";

const SITES = [...KNOWN_STREAMING_SITES];

/** Which streaming services the user subscribes to — reuses the exact same site list the streaming-availability provider matches against, so this can never drift from what titles actually show as "available on". */
export function StreamingForm({ initialSubscriptions }: { initialSubscriptions: string[] }) {
  const [subscriptions, setSubscriptions] = useState<string[]>(initialSubscriptions);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(site: string) {
    setError(null);
    const next = subscriptions.includes(site) ? subscriptions.filter((s) => s !== site) : [...subscriptions, site];
    setSubscriptions(next);
    startTransition(async () => {
      try {
        await updateProfile({ streamingSubscriptions: next });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {SITES.map((site) => (
          <button
            key={site}
            type="button"
            disabled={pending}
            onClick={() => toggle(site)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs transition-colors",
              subscriptions.includes(site) ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:text-foreground"
            )}
          >
            {site}
          </button>
        ))}
      </div>
      {saved && <p className="text-xs text-positive">Saved.</p>}
      {error && <p className="text-xs text-negative">{error}</p>}
    </div>
  );
}
