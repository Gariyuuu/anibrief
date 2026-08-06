import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** One row per calendar day. Mirrors daily-brief's archive-by-date pattern. */
export const briefings = pgTable("briefings", {
  date: text("date").primaryKey(), // YYYY-MM-DD
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
  summary: text("summary").notNull(),
  summaryIsAiGenerated: text("summary_is_ai_generated").notNull().default("false"),
  stats: jsonb("stats").notNull(),
  sections: jsonb("sections").notNull(),
});

export const calendarReminders = pgTable("calendar_reminders", {
  id: text("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  title: text("title").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  mediaId: text("media_id"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const savedNews = pgTable("saved_news", {
  id: text("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  articleUrl: text("article_url").notNull(),
  headline: text("headline").notNull(),
  publisher: text("publisher").notNull(),
  savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
});
