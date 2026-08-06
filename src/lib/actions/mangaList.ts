"use server";

import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/lib/db/client";
import { userMangaList } from "@/lib/db/schema";
import type { MangaListStatus } from "@/lib/types/userList";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Sign in to save titles to your list.");
  if (!isDatabaseConfigured()) throw new Error("Lists aren't available yet — DATABASE_URL isn't configured for this deployment.");
  return userId;
}

export async function addOrUpdateMangaListEntry(input: {
  mediaId: string;
  mediaTitle: string;
  coverImage: string | null;
  status?: MangaListStatus;
  progressChapters?: number;
  score?: number | null;
}) {
  const userId = await requireUser();
  await db()
    .insert(userMangaList)
    .values({
      id: randomUUID(),
      clerkUserId: userId,
      mediaId: input.mediaId,
      mediaTitle: input.mediaTitle,
      coverImage: input.coverImage,
      status: input.status ?? "planning",
      progressChapters: input.progressChapters ?? 0,
      score: input.score ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [userMangaList.clerkUserId, userMangaList.mediaId],
      set: {
        status: input.status ?? "planning",
        progressChapters: input.progressChapters ?? 0,
        score: input.score ?? null,
        updatedAt: new Date(),
      },
    });
  revalidatePath("/my-list");
}

export async function removeMangaListEntry(mediaId: string) {
  const userId = await requireUser();
  await db()
    .delete(userMangaList)
    .where(and(eq(userMangaList.clerkUserId, userId), eq(userMangaList.mediaId, mediaId)));
  revalidatePath("/my-list");
}

export async function toggleMangaFavorite(mediaId: string, isFavorite: boolean) {
  const userId = await requireUser();
  await db()
    .update(userMangaList)
    .set({ isFavorite, updatedAt: new Date() })
    .where(and(eq(userMangaList.clerkUserId, userId), eq(userMangaList.mediaId, mediaId)));
  revalidatePath("/my-list");
}

export async function getUserMangaList(userId: string) {
  if (!isDatabaseConfigured()) return [];
  return db().select().from(userMangaList).where(eq(userMangaList.clerkUserId, userId));
}
