"use server";

import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, isDatabaseConfigured } from "@/lib/db/client";
import { dataSources, featureFlags, announcementBanner, notifications, adminAuditLogs } from "@/lib/db/schema";
import { isAdminUser } from "@/lib/utils/adminAccess";

// Server Actions are independently callable regardless of which page
// rendered the button that triggers them, so every action here re-checks
// admin status itself rather than trusting the page-level gate in
// src/app/admin/layout.tsx.
async function requireAdmin(): Promise<string> {
  const { userId } = await auth();
  if (!userId || !(await isAdminUser(userId))) {
    throw new Error("Admin access required.");
  }
  return userId;
}

async function logAudit(clerkUserId: string, action: string, details?: Record<string, unknown>) {
  if (!isDatabaseConfigured()) return;
  await db()
    .insert(adminAuditLogs)
    .values({ id: randomUUID(), clerkUserId, action, details: details ?? null });
}

export async function toggleDataSource(id: string, enabled: boolean) {
  const userId = await requireAdmin();
  if (!isDatabaseConfigured()) throw new Error("DATABASE_URL isn't configured for this deployment.");

  await db().update(dataSources).set({ enabled, updatedAt: new Date() }).where(eq(dataSources.id, id));
  await logAudit(userId, "toggle_data_source", { id, enabled });
  revalidatePath("/admin");
}

export async function toggleFeatureFlag(key: string, enabled: boolean) {
  const userId = await requireAdmin();
  if (!isDatabaseConfigured()) throw new Error("DATABASE_URL isn't configured for this deployment.");

  await db().update(featureFlags).set({ enabled }).where(eq(featureFlags.key, key));
  await logAudit(userId, "toggle_feature_flag", { key, enabled });
  revalidatePath("/admin");
}

export async function updateAnnouncementBanner(input: {
  message: string;
  tone: "neutral" | "positive" | "negative";
  active: boolean;
}) {
  const userId = await requireAdmin();
  if (!isDatabaseConfigured()) throw new Error("DATABASE_URL isn't configured for this deployment.");

  await db()
    .insert(announcementBanner)
    .values({ id: "current", message: input.message, tone: input.tone, active: input.active, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: announcementBanner.id,
      set: { message: input.message, tone: input.tone, active: input.active, updatedAt: new Date() },
    });
  await logAudit(userId, "update_announcement_banner", input);
  revalidatePath("/admin");
  revalidatePath("/");
}

/** Inserts one row into `notifications` for the calling admin, so they can verify /alerts renders it. */
export async function sendTestNotification() {
  const userId = await requireAdmin();
  if (!isDatabaseConfigured()) throw new Error("DATABASE_URL isn't configured for this deployment.");

  await db()
    .insert(notifications)
    .values({
      id: randomUUID(),
      clerkUserId: userId,
      title: "Test notification",
      body: "This is a test notification sent from the Admin dashboard.",
      url: "/alerts",
      dedupeKey: `admin_test:${Date.now()}`,
    });
  await logAudit(userId, "send_test_notification");
  revalidatePath("/alerts");
}
