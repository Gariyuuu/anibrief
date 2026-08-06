"use server";

import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/lib/db/client";
import { userAlerts, notifications } from "@/lib/db/schema";
import type { AlertFrequency, AlertType } from "@/lib/types/userList";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Sign in to create alerts.");
  if (!isDatabaseConfigured()) throw new Error("Alerts aren't available yet — DATABASE_URL isn't configured for this deployment.");
  return userId;
}

export async function createAlert(input: {
  type: AlertType;
  targetId: string;
  targetLabel: string;
  frequency?: AlertFrequency;
}) {
  const userId = await requireUser();
  await db()
    .insert(userAlerts)
    .values({
      id: randomUUID(),
      clerkUserId: userId,
      type: input.type,
      targetId: input.targetId,
      targetLabel: input.targetLabel,
      frequency: input.frequency ?? "immediate",
    })
    .onConflictDoNothing();
  revalidatePath("/alerts");
}

export async function deleteAlert(id: string) {
  const userId = await requireUser();
  await db().delete(userAlerts).where(and(eq(userAlerts.clerkUserId, userId), eq(userAlerts.id, id)));
  revalidatePath("/alerts");
}

export async function getUserAlerts(userId: string) {
  if (!isDatabaseConfigured()) return [];
  return db().select().from(userAlerts).where(eq(userAlerts.clerkUserId, userId));
}

export async function getUserNotifications(userId: string, limit = 30) {
  if (!isDatabaseConfigured()) return [];
  return db()
    .select()
    .from(notifications)
    .where(eq(notifications.clerkUserId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markNotificationRead(id: string) {
  const userId = await requireUser();
  await db()
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.clerkUserId, userId), eq(notifications.id, id)));
  revalidatePath("/alerts");
}
