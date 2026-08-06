"use server";

import { randomUUID } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/lib/db/client";
import { importJobs } from "@/lib/db/schema";
import { AniListProvider } from "@/lib/providers/anilist";
import { addOrUpdateAnimeListEntry } from "@/lib/actions/animeList";
import type { AnimeListStatus } from "@/lib/types/userList";

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Sign in to import a list.");
  if (!isDatabaseConfigured()) throw new Error("Import isn't available yet — DATABASE_URL isn't configured for this deployment.");
  return userId;
}

export interface ImportRow {
  title: string;
  status?: string;
  progress?: number;
  score?: number;
}

export interface ImportPreviewEntry {
  inputTitle: string;
  matchedTitle: string | null;
  matchedMediaId: string | null;
  matchedCoverImage: string | null;
  confidence: "matched" | "no_match";
  status?: string;
  progress?: number;
  score?: number;
}

/** Loosely maps common export-file status strings (MyAnimeList/AniList exports use different
 * vocab, e.g. "Plan to Watch" vs "planning") onto AnimeListStatus. Unrecognized values default
 * to "planning" rather than failing the row. */
function mapImportStatus(input: string | undefined): AnimeListStatus {
  const s = (input ?? "").trim().toLowerCase().replace(/[\s_-]+/g, " ");
  if (["watching", "current"].includes(s)) return "watching";
  if (["completed", "complete", "finished"].includes(s)) return "completed";
  if (["paused", "on hold", "hold"].includes(s)) return "paused";
  if (["dropped"].includes(s)) return "dropped";
  if (["rewatching", "re watching"].includes(s)) return "rewatching";
  if (["planning", "plan to watch", "planned", "ptw"].includes(s)) return "planning";
  return "planning";
}

/** Runs `fn` over `items` with at most `limit` in flight at once — a plain sequential
 * Promise.all over a large import file would fire dozens of AniList requests simultaneously
 * and risk rate-limiting, so this trickles them through a small worker pool instead. */
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

/**
 * Best-effort title matching against AniList's search — NOT a real sync. Every row is looked up
 * by its raw title text and the top search result (if any) is offered as a candidate match. This
 * is why the caller must show the preview and let the user review it before committing (per the
 * product rule against claiming two-way sync before it works reliably).
 */
export async function parseImportPreview(rows: ImportRow[], sourceType: "csv" | "json") {
  const userId = await requireUser();

  const preview = await mapWithConcurrency(rows, 4, async (row): Promise<ImportPreviewEntry> => {
    const title = row.title?.trim() ?? "";
    if (!title) {
      return {
        inputTitle: row.title ?? "",
        matchedTitle: null,
        matchedMediaId: null,
        matchedCoverImage: null,
        confidence: "no_match",
        status: row.status,
        progress: row.progress,
        score: row.score,
      };
    }

    const result = await AniListProvider.searchMedia(title, "ANIME", { perPage: 1 });
    const top = result.items[0] ?? null;

    return {
      inputTitle: title,
      matchedTitle: top?.titles.preferred ?? null,
      matchedMediaId: top?.id ?? null,
      matchedCoverImage: top?.coverImage ?? null,
      confidence: top ? "matched" : "no_match",
      status: row.status,
      progress: row.progress,
      score: row.score,
    };
  });

  const jobId = randomUUID();
  await db()
    .insert(importJobs)
    .values({
      id: jobId,
      clerkUserId: userId,
      sourceType,
      status: "mapped",
      itemsTotal: rows.length,
      itemsCommitted: 0,
      mappingPreview: preview,
    });

  return { jobId, preview };
}

/** Commits every "matched" row from a previously-generated import job into the user's anime list.
 * Rows with no match are left out — they were never silently guessed at. */
export async function commitImport(jobId: string) {
  const userId = await requireUser();

  const [job] = await db()
    .select()
    .from(importJobs)
    .where(and(eq(importJobs.id, jobId), eq(importJobs.clerkUserId, userId)));

  if (!job) throw new Error("Import job not found.");

  const preview = (job.mappingPreview as ImportPreviewEntry[] | null) ?? [];

  let committed = 0;
  for (const entry of preview) {
    if (entry.confidence !== "matched" || !entry.matchedMediaId) continue;

    const progress = typeof entry.progress === "number" && Number.isFinite(entry.progress) ? Math.max(0, Math.trunc(entry.progress)) : 0;
    const score = typeof entry.score === "number" && Number.isFinite(entry.score) ? entry.score : null;

    await addOrUpdateAnimeListEntry({
      mediaId: entry.matchedMediaId,
      mediaTitle: entry.matchedTitle ?? entry.inputTitle,
      coverImage: entry.matchedCoverImage,
      status: mapImportStatus(entry.status),
      progress,
      score,
    });
    committed += 1;
  }

  await db()
    .update(importJobs)
    .set({ status: "committed", itemsCommitted: committed, completedAt: new Date() })
    .where(eq(importJobs.id, jobId));

  return { committed, total: preview.length };
}
