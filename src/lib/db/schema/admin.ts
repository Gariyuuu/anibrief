import { boolean, integer, jsonb, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";

export const dataSources = pgTable("data_sources", {
  id: text("id").primaryKey(), // e.g. "news:anime"
  label: text("label").notNull(),
  kind: text("kind").notNull(), // "rss" | "api"
  enabled: boolean("enabled").notNull().default(true),
  config: jsonb("config"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const providerHealth = pgTable("provider_health", {
  provider: text("provider").primaryKey(),
  configured: boolean("configured").notNull().default(false),
  lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
  lastErrorAt: timestamp("last_error_at", { withTimezone: true }),
  lastError: text("last_error"),
  requestCount24h: integer("request_count_24h").notNull().default(0),
});

export const syncJobs = pgTable("sync_jobs", {
  id: text("id").primaryKey(),
  jobName: text("job_name").notNull(),
  status: text("status").notNull().default("running"), // "running" | "success" | "partial" | "failed"
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  itemsProcessed: integer("items_processed").notNull().default(0),
  errorMessage: text("error_message"),
  // Idempotency: a running job with the same lockKey is skipped rather than duplicated (spec §25).
  lockKey: text("lock_key").notNull(),
});

export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: text("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  action: text("action").notNull(),
  details: jsonb("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const featureFlags = pgTable("feature_flags", {
  key: text("key").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  description: text("description"),
});

export const announcementBanner = pgTable("announcement_banner", {
  id: text("id").primaryKey().default("current"),
  message: text("message"),
  tone: text("tone").notNull().default("neutral"), // "neutral" | "positive" | "negative"
  active: boolean("active").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const trendSnapshots = pgTable("trend_snapshots", {
  id: text("id").primaryKey(),
  mediaId: text("media_id").notNull(),
  window: text("window").notNull(), // "24h" | "7d" | "30d" | "season"
  popularity: integer("popularity"),
  averageScore: real("average_score"),
  favourites: integer("favourites"),
  capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
});
