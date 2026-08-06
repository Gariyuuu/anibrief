CREATE TABLE IF NOT EXISTS "user_spotify_connections" (
	"clerk_user_id" text PRIMARY KEY NOT NULL,
	"spotify_user_id" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"scope" text NOT NULL,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL
);
