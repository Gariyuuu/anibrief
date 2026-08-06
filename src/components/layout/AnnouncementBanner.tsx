import { eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/lib/db/client";
import { announcementBanner } from "@/lib/db/schema";
import { cn } from "@/lib/utils/cn";

const toneClasses: Record<string, string> = {
  neutral: "bg-surface-raised text-foreground border-border",
  positive: "bg-positive/10 text-positive border-positive/30",
  negative: "bg-negative/10 text-negative border-negative/30",
};

/** Renders the single admin-managed announcement banner (id: "current"), or nothing if inactive/unset/no DB. */
export async function AnnouncementBanner() {
  if (!isDatabaseConfigured()) return null;

  const [banner] = await db().select().from(announcementBanner).where(eq(announcementBanner.id, "current")).limit(1);
  if (!banner || !banner.active || !banner.message) return null;

  return (
    <div className={cn("border-b px-4 py-2 text-center text-sm sm:px-6", toneClasses[banner.tone] ?? toneClasses.neutral)}>
      {banner.message}
    </div>
  );
}
