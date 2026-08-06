"use client";

import { useState, useTransition } from "react";
import { Trash2, BellPlus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { deleteAlert } from "@/lib/actions/alerts";
import { humanizeAlertType, humanizeFrequency } from "@/lib/utils/alertLabels";
import { CreateAlertForm } from "@/components/alerts/CreateAlertForm";
import type { userAlerts } from "@/lib/db/schema";

type AlertRow = typeof userAlerts.$inferSelect;

export function AlertsPanel({ initialAlerts }: { initialAlerts: AlertRow[] }) {
  const [alerts, setAlerts] = useState(initialAlerts);
  // createAlert() doesn't return the inserted row, so after a successful create
  // CreateAlertForm triggers router.refresh(); when that lands, `initialAlerts`
  // changes identity and this adjusts local state during render (the pattern
  // react.dev recommends over an effect for "reset state when a prop changes").
  const [prevInitialAlerts, setPrevInitialAlerts] = useState(initialAlerts);
  if (initialAlerts !== prevInitialAlerts) {
    setPrevInitialAlerts(initialAlerts);
    setAlerts(initialAlerts);
  }
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleDelete(id: string) {
    setPendingId(id);
    startTransition(async () => {
      try {
        await deleteAlert(id);
        setAlerts((prev) => prev.filter((a) => a.id !== id));
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {alerts.length === 0 ? (
        <EmptyState
          icon={BellPlus}
          title="No alerts yet"
          description="Create one below to get notified about new episodes, premieres, releases, and more."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {alerts.map((a) => (
            <Card key={a.id} className="flex items-center gap-3 p-3">
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Badge tone="accent">{humanizeAlertType(a.type)}</Badge>
                  <Badge tone="neutral">{humanizeFrequency(a.frequency)}</Badge>
                </div>
                <p className="text-sm text-foreground">{a.targetLabel}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                disabled={pendingId === a.id}
                onClick={() => handleDelete(a.id)}
                aria-label={`Delete alert for ${a.targetLabel}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {pendingId === a.id ? "Removing…" : "Delete"}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <CreateAlertForm />
    </div>
  );
}
