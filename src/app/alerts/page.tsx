import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";
import { LogIn } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { getUserAlerts, getUserNotifications } from "@/lib/actions/alerts";
import { NotificationsPanel } from "@/components/alerts/NotificationsPanel";
import { AlertsPanel } from "@/components/alerts/AlertsPanel";

export const metadata: Metadata = { title: "Alerts" };

export default async function AlertsPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Alerts</h1>
          <p className="mt-1 text-sm text-muted">
            Get notified about new episodes, premieres, releases, and more.
          </p>
        </div>
        <EmptyState
          icon={LogIn}
          title="Sign in to manage alerts"
          description="Alerts and notifications are tied to your account. Sign in to create alerts and see notifications here."
          action={
            <SignInButton mode="modal">
              <Button variant="primary" size="sm">
                Sign in
              </Button>
            </SignInButton>
          }
        />
      </div>
    );
  }

  const [notificationRows, alertRows] = await Promise.all([
    getUserNotifications(userId, 30),
    getUserAlerts(userId),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Alerts</h1>
        <p className="mt-1 text-sm text-muted">
          Your recent notifications, and the alerts that generate them.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Notifications</h2>
        <NotificationsPanel initialNotifications={notificationRows} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">My Alerts</h2>
        <AlertsPanel initialAlerts={alertRows} />
      </section>
    </div>
  );
}
