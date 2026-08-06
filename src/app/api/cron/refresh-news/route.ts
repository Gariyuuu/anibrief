import type { NextRequest } from "next/server";
import { NewsFeedProvider } from "@/lib/providers/news";
import { runCronJob } from "@/lib/cron/runCronJob";

// Cache-warming only: pre-fetches all news categories so the RSS cache is
// warm ahead of user traffic. Vercel Cron: every 20 minutes (see vercel.json).
export async function GET(request: NextRequest) {
  return runCronJob(request, "refresh-news", "hour", async () => {
    const articles = await NewsFeedProvider.fetchAll();
    return articles.length;
  });
}
