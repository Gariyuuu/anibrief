"use client";

import { useState, useTransition } from "react";
import { toggleFeatureFlag } from "@/lib/actions/admin";
import { Button } from "@/components/ui/Button";

export function FeatureFlagToggle({ flagKey, enabled }: { flagKey: string; enabled: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={enabled ? "secondary" : "outline"}
        size="sm"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await toggleFeatureFlag(flagKey, !enabled);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed to toggle flag.");
            }
          });
        }}
      >
        {isPending ? "Saving…" : enabled ? "Turn off" : "Turn on"}
      </Button>
      {error && <span className="text-xs text-negative">{error}</span>}
    </div>
  );
}
