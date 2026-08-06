"use server";

import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/lib/db/client";
import { userFollows } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Sign in to follow.");
  if (!isDatabaseConfigured()) throw new Error("Follows aren't available yet — DATABASE_URL isn't configured for this deployment.");
  return userId;
}

export async function followTarget(targetType: "studio" | "person" | "character" | "tag" | "genre", targetId: string, targetLabel: string) {
  const userId = await requireUser();
  await db()
    .insert(userFollows)
    .values({ id: randomUUID(), clerkUserId: userId, targetType, targetId, targetLabel })
    .onConflictDoNothing();
  revalidatePath("/profile");
}

export async function unfollowTarget(targetType: "studio" | "person" | "character" | "tag" | "genre", targetId: string) {
  const userId = await requireUser();
  await db()
    .delete(userFollows)
    .where(and(eq(userFollows.clerkUserId, userId), eq(userFollows.targetType, targetType), eq(userFollows.targetId, targetId)));
  revalidatePath("/profile");
}

export async function getUserFollows(userId: string) {
  if (!isDatabaseConfigured()) return [];
  return db().select().from(userFollows).where(eq(userFollows.clerkUserId, userId));
}
