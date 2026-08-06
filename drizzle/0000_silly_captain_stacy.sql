CREATE TABLE IF NOT EXISTS "notification_permission_state" (
	"clerk_user_id" text PRIMARY KEY NOT NULL,
	"push_subscription" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"clerk_user_id" text PRIMARY KEY NOT NULL,
	"username" text,
	"bio" text,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"region" text,
	"language" text DEFAULT 'en' NOT NULL,
	"accent_theme" text DEFAULT 'sakura' NOT NULL,
	"color_mode" text DEFAULT 'dark' NOT NULL,
	"preferred_genres" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"blocked_genres" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"streaming_subscriptions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"spoiler_mode" text DEFAULT 'allow_watched' NOT NULL,
	"brief_mode" text DEFAULT 'standard' NOT NULL,
	"brief_categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"excluded_topics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"email_digest_enabled" boolean DEFAULT false NOT NULL,
	"week_starts_monday" boolean DEFAULT false NOT NULL,
	"hour12" boolean DEFAULT true NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"analytics_opt_out" boolean DEFAULT false NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "import_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"source_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"items_total" integer DEFAULT 0 NOT NULL,
	"items_committed" integer DEFAULT 0 NOT NULL,
	"mapping_preview" jsonb,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_anime_list" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"media_id" text NOT NULL,
	"media_title" text NOT NULL,
	"cover_image" text,
	"status" text DEFAULT 'planning' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"score" real,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"notes" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"rewatch_count" integer DEFAULT 0 NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_follows" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"target_label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_manga_list" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"media_id" text NOT NULL,
	"media_title" text NOT NULL,
	"cover_image" text,
	"status" text DEFAULT 'planning' NOT NULL,
	"progress_chapters" integer DEFAULT 0 NOT NULL,
	"score" real,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"notes" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"alert_id" text,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"url" text,
	"dedupe_key" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"type" text NOT NULL,
	"target_id" text NOT NULL,
	"target_label" text NOT NULL,
	"frequency" text DEFAULT 'immediate' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "briefings" (
	"date" text PRIMARY KEY NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"summary" text NOT NULL,
	"summary_is_ai_generated" text DEFAULT 'false' NOT NULL,
	"stats" jsonb NOT NULL,
	"sections" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calendar_reminders" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"title" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"media_id" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saved_news" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"article_url" text NOT NULL,
	"headline" text NOT NULL,
	"publisher" text NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"action" text NOT NULL,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "announcement_banner" (
	"id" text PRIMARY KEY DEFAULT 'current' NOT NULL,
	"message" text,
	"tone" text DEFAULT 'neutral' NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"kind" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"config" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feature_flags" (
	"key" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "provider_health" (
	"provider" text PRIMARY KEY NOT NULL,
	"configured" boolean DEFAULT false NOT NULL,
	"last_success_at" timestamp with time zone,
	"last_error_at" timestamp with time zone,
	"last_error" text,
	"request_count_24h" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"job_name" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"items_processed" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"lock_key" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trend_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"media_id" text NOT NULL,
	"window" text NOT NULL,
	"popularity" integer,
	"average_score" real,
	"favourites" integer,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_anime_list_user_media_idx" ON "user_anime_list" USING btree ("clerk_user_id","media_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_follows_unique_idx" ON "user_follows" USING btree ("clerk_user_id","target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_manga_list_user_media_idx" ON "user_manga_list" USING btree ("clerk_user_id","media_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "notifications_dedupe_idx" ON "notifications" USING btree ("clerk_user_id","dedupe_key");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_alerts_unique_idx" ON "user_alerts" USING btree ("clerk_user_id","type","target_id");