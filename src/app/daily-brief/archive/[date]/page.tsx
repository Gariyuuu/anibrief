import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DailyBriefView } from "@/components/briefing/DailyBriefView";
import { getBriefing } from "@/lib/briefing/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const { date } = await params;
  return { title: `Daily Brief — ${date}` };
}

export default async function ArchivedDailyBriefPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const briefing = await getBriefing(date);
  if (!briefing) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return <DailyBriefView briefing={briefing} appUrl={appUrl} isArchive />;
}
