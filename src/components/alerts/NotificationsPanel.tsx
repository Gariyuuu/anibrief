"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { markNotificationRead } from "@/lib/actions/alerts";
import { formatRelativeTime } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import type { notifications } from "@/lib/db/schema";

type NotificationRow = typeof notifications.$inferSelect;

export function NotificationsPanel({ initialNotifications }: { initialNotifications: NotificationRow[] }) {
  const [items, setItems] = useState(initialNotifications);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="No notifications yet"
        description="This list is populated by a background job that checks your alerts roughly every 30 minutes and posts here when one fires. It's expected to be empty until an alert you've created actually triggers — nothing's broken."
      />
    );
  }

  function handleMarkRead(id: string) {
    setPendingId(id);
    startTransition(async () => {
      try {
        await markNotificationRead(id);
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((n) => {
        const body = (
          <div className="flex flex-1 flex-col gap-0.5">
            <p className={cn("text-sm", !n.read && "font-semibold text-foreground")}>{n.title}</p>
            <p className="text-sm text-muted">{n.body}</p>
            <span className="text-xs text-muted" suppressHydrationWarning>
              {formatRelativeTime(new Date(n.createdAt).toISOString())}
            </span>
          </div>
        );

        return (
          <Card key={n.id} className="flex items-start gap-3 p-3">
            {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden />}
            {n.read && <span className="mt-1.5 h-2 w-2 shrink-0" aria-hidden />}
            {n.url ? (
              <Link href={n.url} className="flex flex-1 gap-3 hover:opacity-80">
                {body}
              </Link>
            ) : (
              body
            )}
            {!n.read && (
              <Button
                variant="secondary"
                size="sm"
                disabled={pendingId === n.id}
                onClick={() => handleMarkRead(n.id)}
              >
                <Check className="h-3.5 w-3.5" />
                {pendingId === n.id ? "Marking…" : "Mark read"}
              </Button>
            )}
          </Card>
        );
      })}
    </div>
  );
}
