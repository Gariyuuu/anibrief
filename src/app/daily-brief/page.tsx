import type { Metadata } from "next";
import { DailyBriefView } from "@/components/briefing/DailyBriefView";
import { getTodaysBriefing } from "@/lib/briefing/getTodaysBriefing";

export const metadata: Metadata = { title: "Daily Brief" };
export const revalidate = 86400; // 24h

export default async function DailyBriefPage() {
  const briefing = await getTodaysBriefing();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return <DailyBriefView briefing={briefing} appUrl={appUrl} />;
}
