import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * One row per user who has connected their Spotify account via OAuth
 * (Authorization Code flow — see src/lib/providers/spotify/oauth.ts).
 * Stores only what's needed to call the Spotify Web API on the user's
 * behalf (create a playlist, add tracks) — never the user's password.
 * Access tokens expire quickly; refreshToken is used to mint new ones.
 */
export const userSpotifyConnections = pgTable("user_spotify_connections", {
  clerkUserId: text("clerk_user_id").primaryKey(),
  spotifyUserId: text("spotify_user_id").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  scope: text("scope").notNull(),
  connectedAt: timestamp("connected_at", { withTimezone: true }).notNull().defaultNow(),
});
