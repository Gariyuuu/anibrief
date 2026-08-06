"use client";

import { useState, useTransition } from "react";
import { sendTestNotification } from "@/lib/actions/admin";
import { Button } from "@/components/ui/Button";

export function TestNotificationButton() {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant="secondary"
        size="sm"
        disabled={isPending}
        onClick={() => {
          setStatus(null);
          startTransition(async () => {
            try {
              await sendTestNotification();
              setStatus({ ok: true, message: "Sent — check /alerts." });
            } catch (e) {
              setStatus({ ok: false, message: e instanceof Error ? e.message : "Failed to send." });
            }
          });
        }}
      >
        {isPending ? "Sending…" : "Send test notification to myself"}
      </Button>
      {status && <span className={status.ok ? "text-xs text-positive" : "text-xs text-negative"}>{status.message}</span>}
    </div>
  );
}
