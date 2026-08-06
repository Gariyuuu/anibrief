import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { CheckCircle2, XCircle, AlertCircle, Database, Radio, Flag, Megaphone, Bell, FileText } from "lucide-react";
import { db, isDatabaseConfigured } from "@/lib/db/client";
import { syncJobs, dataSources, featureFlags, announcementBanner } from "@/lib/db/schema";
import { getProviderHealth, type ProviderStatus } from "@/lib/admin/providerHealth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataSourceToggle } from "@/components/admin/DataSourceToggle";
import { FeatureFlagToggle } from "@/components/admin/FeatureFlagToggle";
import { AnnouncementBannerForm } from "@/components/admin/AnnouncementBannerForm";
import { TestNotificationButton } from "@/components/admin/TestNotificationButton";

export const metadata: Metadata = { title: "Admin" };

function StatusBadge({ status }: { status: ProviderStatus }) {
  if (status === "healthy") {
    return (
      <Badge tone="positive" className="gap-1">
        <CheckCircle2 className="h-3 w-3" /> Healthy
      </Badge>
    );
  }
  if (status === "error") {
    return (
      <Badge tone="negative" className="gap-1">
        <XCircle className="h-3 w-3" /> Error
      </Badge>
    );
  }
  return (
    <Badge tone="neutral" className="gap-1">
      <AlertCircle className="h-3 w-3" /> Not configured
    </Badge>
  );
}

function formatDuration(startedAt: Date, finishedAt: Date | null): string {
  if (!finishedAt) return "—";
  const ms = finishedAt.getTime() - startedAt.getTime();
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export default async function AdminPage() {
  const providerHealth = await getProviderHealth();

  const dbConfigured = isDatabaseConfigured();
  const recentJobs = dbConfigured
    ? await db().select().from(syncJobs).orderBy(desc(syncJobs.startedAt)).limit(20)
    : [];
  const sources = dbConfigured ? await db().select().from(dataSources) : [];
  const flags = dbConfigured ? await db().select().from(featureFlags) : [];
  const [banner] = dbConfigured
    ? await db().select().from(announcementBanner).where(eq(announcementBanner.id, "current")).limit(1)
    : [];

  return (
    <div className="flex flex-col gap-8 pb-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-muted">
          Provider health, scheduled sync jobs, data sources, feature flags, and the site-wide announcement banner.
        </p>
      </div>

      {/* Provider health */}
      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Radio className="h-4 w-4 text-muted" /> Provider health
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {providerHealth.map((p) => (
            <Card key={p.name} className="flex flex-col gap-1.5 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{p.name}</span>
                <StatusBadge status={p.status} />
              </div>
              <p className="text-xs text-muted">{p.note}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent sync jobs */}
      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Database className="h-4 w-4 text-muted" /> Recent sync jobs
        </h2>
        {!dbConfigured ? (
          <EmptyState
            icon={Database}
            title="No database configured"
            description="DATABASE_URL isn't set for this deployment, so sync jobs aren't recorded. Cron routes still run and warm caches, but nothing is logged here."
          />
        ) : recentJobs.length === 0 ? (
          <EmptyState
            icon={Database}
            title="No sync jobs yet"
            description="Once a cron route runs (see vercel.json for schedules), its runs will show up here."
          />
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-2 font-medium">Job</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Started</th>
                  <th className="px-4 py-2 font-medium">Duration</th>
                  <th className="px-4 py-2 font-medium">Items</th>
                  <th className="px-4 py-2 font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job) => (
                  <tr key={job.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">{job.jobName}</td>
                    <td className="px-4 py-2">
                      <Badge
                        tone={job.status === "success" ? "positive" : job.status === "failed" ? "negative" : "neutral"}
                      >
                        {job.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted">{job.startedAt.toLocaleString()}</td>
                    <td className="px-4 py-2 text-xs text-muted">{formatDuration(job.startedAt, job.finishedAt)}</td>
                    <td className="px-4 py-2 text-xs">{job.itemsProcessed}</td>
                    <td className="max-w-[240px] truncate px-4 py-2 text-xs text-negative" title={job.errorMessage ?? ""}>
                      {job.errorMessage ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      {/* Data source registry */}
      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Radio className="h-4 w-4 text-muted" /> Data source registry
        </h2>
        {!dbConfigured ? (
          <EmptyState icon={Radio} title="No database configured" description="DATABASE_URL isn't set for this deployment." />
        ) : sources.length === 0 ? (
          <EmptyState
            icon={Radio}
            title="No sources registered yet"
            description={
              'News sources are currently configured in-code, in CATEGORY_QUERIES inside src/lib/providers/news/index.ts — not database-driven yet. This table exists for a future admin-managed registry; nothing has been seeded into it.'
            }
          />
        ) : (
          <Card className="flex flex-col divide-y divide-border p-0">
            {sources.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-xs text-muted">
                    {s.id} · {s.kind}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={s.enabled ? "positive" : "neutral"}>{s.enabled ? "Enabled" : "Disabled"}</Badge>
                  <DataSourceToggle id={s.id} enabled={s.enabled} />
                </div>
              </div>
            ))}
          </Card>
        )}
      </section>

      {/* Announcement banner */}
      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Megaphone className="h-4 w-4 text-muted" /> Announcement banner
        </h2>
        {!dbConfigured ? (
          <EmptyState icon={Megaphone} title="No database configured" description="DATABASE_URL isn't set for this deployment." />
        ) : (
          <Card className="p-4">
            <AnnouncementBannerForm
              initialMessage={banner?.message ?? ""}
              initialTone={(banner?.tone as "neutral" | "positive" | "negative") ?? "neutral"}
              initialActive={banner?.active ?? false}
            />
          </Card>
        )}
      </section>

      {/* Feature flags */}
      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Flag className="h-4 w-4 text-muted" /> Feature flags
        </h2>
        {!dbConfigured ? (
          <EmptyState icon={Flag} title="No database configured" description="DATABASE_URL isn't set for this deployment." />
        ) : flags.length === 0 ? (
          <EmptyState icon={Flag} title="No feature flags yet" description="No rows exist in feature_flags yet." />
        ) : (
          <Card className="flex flex-col divide-y divide-border p-0">
            {flags.map((f) => (
              <div key={f.key} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium">{f.key}</p>
                  {f.description && <p className="text-xs text-muted">{f.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={f.enabled ? "positive" : "neutral"}>{f.enabled ? "On" : "Off"}</Badge>
                  <FeatureFlagToggle flagKey={f.key} enabled={f.enabled} />
                </div>
              </div>
            ))}
          </Card>
        )}
      </section>

      {/* Notification test */}
      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Bell className="h-4 w-4 text-muted" /> Notification test
        </h2>
        <Card className="p-4">
          {!dbConfigured ? (
            <p className="text-sm text-muted">DATABASE_URL isn&apos;t set for this deployment, so notifications can&apos;t be written.</p>
          ) : (
            <TestNotificationButton />
          )}
        </Card>
      </section>

      {/* Daily brief */}
      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <FileText className="h-4 w-4 text-muted" /> Daily brief
        </h2>
        <Card className="flex flex-col gap-2 p-4">
          <p className="text-sm text-muted">
            The daily brief is generated from live provider data (AniList, news, birthdays) by{" "}
            <code className="rounded bg-surface-raised px-1 py-0.5 text-xs">buildDailyBriefing()</code>, on a schedule via the{" "}
            <code className="rounded bg-surface-raised px-1 py-0.5 text-xs">daily-brief</code> cron job — there&apos;s no raw editor
            for it, and none is being added here, since a manual editor would let admin edits silently diverge from what
            actually happened that day.
          </p>
          <Button href="/daily-brief" variant="secondary" size="sm" className="self-start">
            View today&apos;s brief
          </Button>
        </Card>
      </section>
    </div>
  );
}
