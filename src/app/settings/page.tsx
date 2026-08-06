import type { Metadata } from "next";
import type { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { Show, SignInButton, UserProfile } from "@clerk/nextjs";
import { LogIn, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getOrCreateProfile } from "@/lib/actions/profile";
import { AppearanceForm } from "@/components/settings/AppearanceForm";
import { ContentPrefsForm } from "@/components/settings/ContentPrefsForm";
import { StreamingForm } from "@/components/settings/StreamingForm";
import { SpoilerForm } from "@/components/settings/SpoilerForm";
import { BriefPrefsForm } from "@/components/settings/BriefPrefsForm";
import { RegionForm } from "@/components/settings/RegionForm";
import { NotificationsForm } from "@/components/settings/NotificationsForm";
import { PrivacyForm } from "@/components/settings/PrivacyForm";
import { getSpotifyConnectionStatus } from "@/lib/actions/spotify";
import { SpotifyConnectionCard } from "@/components/music/SpotifyConnectionCard";

export const metadata: Metadata = { title: "Settings" };

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      <Card className="p-4">{children}</Card>
    </section>
  );
}

export default async function SettingsPage() {
  const { userId } = await auth();
  const profile = userId ? await getOrCreateProfile(userId) : null;
  const spotifyStatus = userId ? await getSpotifyConnectionStatus(userId) : { connected: false, spotifyUserId: null };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted">Appearance, content preferences, and account controls.</p>
      </div>

      <Show when="signed-out">
        <EmptyState
          icon={LogIn}
          title="Sign in to change settings"
          description="Preferences are tied to your account so they follow you across devices."
          action={
            <SignInButton mode="modal">
              <Button>Sign in</Button>
            </SignInButton>
          }
        />
      </Show>

      <Show when="signed-in">
        {!profile ? (
          <EmptyState
            icon={ShieldAlert}
            title="Settings can't be saved right now"
            description="This deployment doesn't have DATABASE_URL configured, so preference changes below won't persist. Appearance still updates locally in your browser."
          />
        ) : null}

        <div className="flex flex-col gap-8">
          <Section title="Appearance" description="Accent color and light/dark mode — also applies immediately in this browser.">
            <AppearanceForm initialAccent={profile?.accentTheme ?? "sakura"} initialColorMode={profile?.colorMode ?? "dark"} />
          </Section>

          <Section
            title="Content preferences"
            description="Saved to your profile now. Not yet used to filter Discover/News/Seasonal results in this build — recorded for when that wiring lands."
          >
            <ContentPrefsForm initialPreferred={profile?.preferredGenres ?? []} initialBlocked={profile?.blockedGenres ?? []} />
          </Section>

          <Section title="Streaming services" description="Which platforms you subscribe to.">
            <StreamingForm initialSubscriptions={profile?.streamingSubscriptions ?? []} />
          </Section>

          <Section title="Spoiler settings" description="How aggressively to guard spoilers where this app checks the setting.">
            <SpoilerForm initialMode={profile?.spoilerMode ?? "allow_watched"} />
          </Section>

          <Section title="Daily Brief" description="Default depth for your Daily Brief.">
            <BriefPrefsForm initialMode={profile?.briefMode ?? "standard"} />
          </Section>

          <Section title="Timezone, region &amp; language" description="Used for episode times and date formatting.">
            <RegionForm
              initialTimezone={profile?.timezone ?? "UTC"}
              initialRegion={profile?.region ?? null}
              initialLanguage={profile?.language ?? "en"}
              initialHour12={profile?.hour12 ?? true}
              initialWeekStartsMonday={profile?.weekStartsMonday ?? false}
            />
          </Section>

          <Section title="Notifications">
            <NotificationsForm initialEnabled={profile?.emailDigestEnabled ?? false} />
          </Section>

          <section className="flex flex-col gap-3">
            <div>
              <h2 className="text-sm font-semibold">Connected accounts</h2>
              <p className="mt-0.5 text-xs text-muted">Manage sign-in methods, connected accounts, and account deletion via Clerk.</p>
            </div>
            <div className="overflow-hidden rounded-lg border border-border">
              <UserProfile routing="hash" />
            </div>
          </section>

          <Section title="Spotify" description="Connect your Spotify account to save selections from the Music page as a real playlist.">
            <SpotifyConnectionCard status={spotifyStatus} />
          </Section>

          <Section
            title="Privacy"
            description="To permanently delete your account, use the “Security” tab inside Connected accounts above — Clerk handles that end-to-end."
          >
            <PrivacyForm initialIsPublic={profile?.isPublic ?? true} initialAnalyticsOptOut={profile?.analyticsOptOut ?? false} />
          </Section>
        </div>
      </Show>
    </div>
  );
}
