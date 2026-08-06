import { boolean, integer, jsonb, pgTable, real, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/** mediaId matches NormalizedMedia.id, e.g. "anilist:16498" — source-tagged so multiple providers never collide. */
export const userAnimeList = pgTable(
  "user_anime_list",
  {
    id: text("id").primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    mediaId: text("media_id").notNull(),
    mediaTitle: text("media_title").notNull(),
    coverImage: text("cover_image"),
    status: text("status").notNull().default("planning"), // AnimeListStatus
    progress: integer("progress").notNull().default(0),
    score: real("score"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    notes: text("notes"),
    isPublic: boolean("is_public").notNull().default(true),
    rewatchCount: integer("rewatch_count").notNull().default(0),
    isFavorite: boolean("is_favorite").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("user_anime_list_user_media_idx").on(t.clerkUserId, t.mediaId)]
);

export const userMangaList = pgTable(
  "user_manga_list",
  {
    id: text("id").primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    mediaId: text("media_id").notNull(),
    mediaTitle: text("media_title").notNull(),
    coverImage: text("cover_image"),
    status: text("status").notNull().default("planning"), // MangaListStatus
    progressChapters: integer("progress_chapters").notNull().default(0),
    score: real("score"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    notes: text("notes"),
    isPublic: boolean("is_public").notNull().default(true),
    isFavorite: boolean("is_favorite").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("user_manga_list_user_media_idx").on(t.clerkUserId, t.mediaId)]
);

export const userFollows = pgTable(
  "user_follows",
  {
    id: text("id").primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    targetType: text("target_type").notNull(), // "studio" | "person" | "tag" | "genre"
    targetId: text("target_id").notNull(),
    targetLabel: text("target_label").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("user_follows_unique_idx").on(t.clerkUserId, t.targetType, t.targetId)]
);

export const importJobs = pgTable("import_jobs", {
  id: text("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  sourceType: text("source_type").notNull(), // "anilist" | "myanimelist" | "csv" | "json"
  status: text("status").notNull().default("pending"), // "pending" | "mapped" | "committed" | "failed"
  itemsTotal: integer("items_total").notNull().default(0),
  itemsCommitted: integer("items_committed").notNull().default(0),
  mappingPreview: jsonb("mapping_preview"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
