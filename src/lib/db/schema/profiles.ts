import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * App-specific user settings that Clerk doesn't store. Keyed by Clerk's
 * user id (a string like "user_xxx") rather than a local users table —
 * Clerk is the source of truth for identity (email, name, avatar); this
 * table only holds AniBrief preferences.
 */
export const profiles = pgTable("profiles", {
  clerkUserId: text("clerk_user_id").primaryKey(),
  username: text("username").unique(),
  bio: text("bio"),
  timezone: text("timezone").notNull().default("UTC"),
  region: text("region"),
  language: text("language").notNull().default("en"),
  accentTheme: text("accent_theme").notNull().default("sakura"),
  colorMode: text("color_mode").notNull().default("dark"), // "light" | "dark" | "system"
  preferredGenres: jsonb("preferred_genres").$type<string[]>().notNull().default([]),
  blockedGenres: jsonb("blocked_genres").$type<string[]>().notNull().default([]),
  streamingSubscriptions: jsonb("streaming_subscriptions").$type<string[]>().notNull().default([]),
  spoilerMode: text("spoiler_mode").notNull().default("allow_watched"), // "hide_all" | "blur_titles" | "allow_watched" | "allow_all"
  briefMode: text("brief_mode").notNull().default("standard"), // "quick" | "standard" | "deep"
  briefCategories: jsonb("brief_categories").$type<string[]>().notNull().default([]),
  excludedTopics: jsonb("excluded_topics").$type<string[]>().notNull().default([]),
  emailDigestEnabled: boolean("email_digest_enabled").notNull().default(false),
  weekStartsMonday: boolean("week_starts_monday").notNull().default(false),
  hour12: boolean("hour12").notNull().default(true),
  isPublic: boolean("is_public").notNull().default(true),
  analyticsOptOut: boolean("analytics_opt_out").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationPermissionState = pgTable("notification_permission_state", {
  clerkUserId: text("clerk_user_id").primaryKey(),
  pushSubscription: jsonb("push_subscription"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
