"use server";

import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/lib/db/client";
import { calendarReminders } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Sign in to create reminders.");
  if (!isDatabaseConfigured()) throw new Error("Reminders aren't available yet — DATABASE_URL isn't configured for this deployment.");
  return userId;
}

export async function createReminder(input: {
  title: string;
  date: string; // ISO datetime
  mediaId?: string | null;
  description?: string | null;
}) {
  const userId = await requireUser();
  await db()
    .insert(calendarReminders)
    .values({
      id: randomUUID(),
      clerkUserId: userId,
      title: input.title,
      date: new Date(input.date),
      mediaId: input.mediaId ?? null,
      description: input.description ?? null,
    });
  revalidatePath("/calendar");
}

export async function deleteReminder(id: string) {
  const userId = await requireUser();
  await db()
    .delete(calendarReminders)
    .where(and(eq(calendarReminders.clerkUserId, userId), eq(calendarReminders.id, id)));
  revalidatePath("/calendar");
}

export async function getUserReminders(userId: string) {
  if (!isDatabaseConfigured()) return [];
  return db().select().from(calendarReminders).where(eq(calendarReminders.clerkUserId, userId));
}
