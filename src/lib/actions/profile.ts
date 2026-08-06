"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";

export async function getOrCreateProfile(userId: string) {
  if (!isDatabaseConfigured()) return null;
  const [existing] = await db().select().from(profiles).where(eq(profiles.clerkUserId, userId)).limit(1);
  if (existing) return existing;
  const [created] = await db().insert(profiles).values({ clerkUserId: userId }).returning();
  return created;
}

export async function updateProfile(patch: Partial<typeof profiles.$inferInsert>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Sign in to update settings.");
  if (!isDatabaseConfigured()) throw new Error("Settings aren't persisted yet — DATABASE_URL isn't configured for this deployment.");

  await db()
    .insert(profiles)
    .values({ clerkUserId: userId, ...patch, updatedAt: new Date() })
    .onConflictDoUpdate({ target: profiles.clerkUserId, set: { ...patch, updatedAt: new Date() } });

  revalidatePath("/settings");
  revalidatePath("/profile");
}
