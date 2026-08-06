"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/lib/db/client";
import { userSpotifyConnections } from "@/lib/db/schema";
import { refreshAccessToken } from "@/lib/providers/spotify/oauth";
import { logger } from "@/lib/utils/logger";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Sign in to manage your Spotify connection.");
  if (!isDatabaseConfigured()) throw new Error("Spotify connections aren't available yet — DATABASE_URL isn't configured for this deployment.");
  return userId;
}

/** No tokens ever leave the server — this is the only shape the client sees. */
export async function getSpotifyConnectionStatus(userId: string): Promise<{ connected: boolean; spotifyUserId: string | null }> {
  if (!isDatabaseConfigured()) return { connected: false, spotifyUserId: null };
  const [row] = await db().select().from(userSpotifyConnections).where(eq(userSpotifyConnections.clerkUserId, userId)).limit(1);
  return row ? { connected: true, spotifyUserId: row.spotifyUserId } : { connected: false, spotifyUserId: null };
}

export async function disconnectSpotify() {
  const userId = await requireUser();
  await db().delete(userSpotifyConnections).where(eq(userSpotifyConnections.clerkUserId, userId));
  revalidatePath("/music");
  revalidatePath("/settings");
}

/** Returns a valid access token for the signed-in user's connection, refreshing it first if it's expired (or about to). Throws a user-readable error if there's no connection. */
async function getValidAccessToken(userId: string): Promise<{ accessToken: string; spotifyUserId: string }> {
  const [row] = await db().select().from(userSpotifyConnections).where(eq(userSpotifyConnections.clerkUserId, userId)).limit(1);
  if (!row) throw new Error("Spotify isn't connected. Connect your account first.");

  const EARLY_REFRESH_MS = 30_000;
  if (row.expiresAt.getTime() - EARLY_REFRESH_MS > Date.now()) {
    return { accessToken: row.accessToken, spotifyUserId: row.spotifyUserId };
  }

  const refreshed = await refreshAccessToken(row.refreshToken);
  await db()
    .update(userSpotifyConnections)
    .set({
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      expiresAt: refreshed.expiresAt,
      scope: refreshed.scope,
    })
    .where(eq(userSpotifyConnections.clerkUserId, userId));

  return { accessToken: refreshed.accessToken, spotifyUserId: row.spotifyUserId };
}

/**
 * Creates a real playlist on the signed-in user's own Spotify account (via
 * their connected OAuth grant) and adds the given track URIs to it, then
 * returns the playlist's real, live Spotify URL. Requires an existing
 * connection — the UI is expected to show a "Connect Spotify" button
 * instead of calling this when `getSpotifyConnectionStatus` says
 * `connected: false`.
 */
export async function createSpotifyPlaylist(input: {
  name: string;
  description?: string;
  trackUris: string[];
}): Promise<{ playlistUrl: string }> {
  const userId = await requireUser();
  if (input.trackUris.length === 0) throw new Error("Select at least one Spotify track first.");

  const { accessToken, spotifyUserId } = await getValidAccessToken(userId);

  const createRes = await fetch(`https://api.spotify.com/v1/users/${spotifyUserId}/playlists`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name,
      description: input.description ?? "Created with AniBrief",
      public: false,
    }),
  });
  if (!createRes.ok) {
    logger.error("createSpotifyPlaylist: create request failed", { status: createRes.status });
    throw new Error("Spotify rejected the playlist creation request.");
  }
  const playlist = (await createRes.json()) as { id: string; external_urls: { spotify: string } };

  // Spotify caps "add items" at 100 URIs per request.
  for (let i = 0; i < input.trackUris.length; i += 100) {
    const chunk = input.trackUris.slice(i, i + 100);
    const addRes = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ uris: chunk }),
    });
    if (!addRes.ok) {
      logger.error("createSpotifyPlaylist: add-tracks request failed", { status: addRes.status });
      throw new Error("The playlist was created, but adding tracks to it failed partway through.");
    }
  }

  revalidatePath("/music");
  return { playlistUrl: playlist.external_urls?.spotify ?? `https://open.spotify.com/playlist/${playlist.id}` };
}
