import type { Metadata } from "next";
import Link from "next/link";
import { Archive as ArchiveIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { listBriefingDates, archiveIsPersistent } from "@/lib/briefing/store";
import { formatDigestDate } from "@/lib/utils/dates";

export const metadata: Metadata = { title: "Daily Brief Archive" };
export const dynamic = "force-dynamic";

export default async function DailyBriefArchivePage() {
  const dates = await listBriefingDates(60);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Daily Brief Archive</h1>
        <p className="mt-1 text-sm text-muted">
          {archiveIsPersistent
            ? "Past briefings, generated once per day."
            : "DATABASE_URL isn't set, so the archive only holds briefings generated since this server last restarted."}
        </p>
      </div>
      {dates.length === 0 ? (
        <EmptyState icon={ArchiveIcon} title="No archived briefs yet" description="Visit the Daily Brief page to generate today's briefing." />
      ) : (
        <div className="flex flex-col gap-2">
          {dates.map((date) => (
            <Link key={date} href={`/daily-brief/archive/${date}`}>
              <Card className="p-3 text-sm font-medium hover:border-accent/50">{formatDigestDate(`${date}T00:00:00Z`)}</Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
