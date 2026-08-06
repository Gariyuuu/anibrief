"use client";

import { useState, useTransition } from "react";
import { toggleDataSource } from "@/lib/actions/admin";
import { Button } from "@/components/ui/Button";

export function DataSourceToggle({ id, enabled }: { id: string; enabled: boolean }) {
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
              await toggleDataSource(id, !enabled);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed to toggle source.");
            }
          });
        }}
      >
        {isPending ? "Saving…" : enabled ? "Disable" : "Enable"}
      </Button>
      {error && <span className="text-xs text-negative">{error}</span>}
    </div>
  );
}
