import { Compass } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-16">
      <EmptyState
        icon={Compass}
        title="Nothing here"
        description="This page, title, or profile doesn't exist — it may have been removed, or the link is wrong."
        action={
          <div className="mt-2 flex gap-2">
            <Button href="/" size="sm">
              Go home
            </Button>
            <Button href="/discover" variant="secondary" size="sm">
              Discover anime
            </Button>
          </div>
        }
      />
    </div>
  );
}
