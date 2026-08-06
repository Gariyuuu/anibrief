"use server";

import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/lib/db/client";
import { userAnimeList } from "@/lib/db/schema";
import type { AnimeListStatus } from "@/lib/types/userList";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Sign in to save titles to your list.");
  if (!isDatabaseConfigured()) throw new Error("Lists aren't available yet — DATABASE_URL isn't configured for this deployment.");
  return userId;
}

export async function addOrUpdateAnimeListEntry(input: {
  mediaId: string;
  mediaTitle: string;
  coverImage: string | null;
  status?: AnimeListStatus;
  progress?: number;
  score?: number | null;
}) {
  const userId = await requireUser();

  await db()
    .insert(userAnimeList)
    .values({
      id: randomUUID(),
      clerkUserId: userId,
      mediaId: input.mediaId,
      mediaTitle: input.mediaTitle,
      coverImage: input.coverImage,
      status: input.status ?? "planning",
      progress: input.progress ?? 0,
      score: input.score ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [userAnimeList.clerkUserId, userAnimeList.mediaId],
      set: {
        status: input.status ?? "planning",
        progress: input.progress ?? 0,
        score: input.score ?? null,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/my-list");
}

export async function removeAnimeListEntry(mediaId: string) {
  const userId = await requireUser();
  await db()
    .delete(userAnimeList)
    .where(and(eq(userAnimeList.clerkUserId, userId), eq(userAnimeList.mediaId, mediaId)));
  revalidatePath("/my-list");
}

export async function toggleAnimeFavorite(mediaId: string, isFavorite: boolean) {
  const userId = await requireUser();
  await db()
    .update(userAnimeList)
    .set({ isFavorite, updatedAt: new Date() })
    .where(and(eq(userAnimeList.clerkUserId, userId), eq(userAnimeList.mediaId, mediaId)));
  revalidatePath("/my-list");
}

export async function markEpisodeWatched(mediaId: string, mediaTitle: string, coverImage: string | null, episode: number) {
  const userId = await requireUser();
  await db()
    .insert(userAnimeList)
    .values({
      id: randomUUID(),
      clerkUserId: userId,
      mediaId,
      mediaTitle,
      coverImage,
      status: "watching",
      progress: episode,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [userAnimeList.clerkUserId, userAnimeList.mediaId],
      set: { progress: episode, status: "watching", updatedAt: new Date() },
    });
  revalidatePath("/my-list");
  revalidatePath("/airing");
}

export async function getUserAnimeList(userId: string) {
  if (!isDatabaseConfigured()) return [];
  return db().select().from(userAnimeList).where(eq(userAnimeList.clerkUserId, userId));
}
