import { boolean, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const userAlerts = pgTable(
  "user_alerts",
  {
    id: text("id").primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    type: text("type").notNull(), // AlertType
    targetId: text("target_id").notNull(),
    targetLabel: text("target_label").notNull(),
    frequency: text("frequency").notNull().default("immediate"), // AlertFrequency
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("user_alerts_unique_idx").on(t.clerkUserId, t.type, t.targetId)]
);

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  alertId: text("alert_id"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  url: text("url"),
  // Dedup key (e.g. `new_episode:anilist:16498:12`) so the same underlying
  // event never generates two notifications, per spec §21.
  dedupeKey: text("dedupe_key").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("notifications_dedupe_idx").on(t.clerkUserId, t.dedupeKey)]);
