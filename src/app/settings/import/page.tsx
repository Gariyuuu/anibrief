import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";
import { LogIn } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { ImportWizard } from "@/components/import/ImportWizard";

export const metadata: Metadata = { title: "Import your list" };

export default async function ImportPage() {
  const { userId } = await auth();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import your list</h1>
        <p className="mt-1 text-sm text-muted">
          Upload a CSV or JSON export of your anime list to add entries to My List here. Title matching against
          AniList is a one-time, best-effort text match — not a live or two-way sync — so review the preview before
          committing, and re-upload later if you want to pick up changes.
        </p>
      </div>

      {!userId ? (
        <EmptyState
          icon={LogIn}
          title="Sign in to import a list"
          description="Imports are tied to your account. Sign in, then come back here to upload a file."
          action={
            <SignInButton mode="modal">
              <Button variant="primary" size="sm">
                Sign in
              </Button>
            </SignInButton>
          }
        />
      ) : (
        <ImportWizard />
      )}
    </div>
  );
}
