import "server-only";
import { logger } from "@/lib/utils/logger";

/**
 * Spotify's Client Credentials flow — an app-level (not user-level) OAuth
 * token, valid only for Spotify's public read endpoints (search, playlist
 * contents). It carries no user identity and can never be used to create or
 * modify anything on a user's behalf — that requires the separate
 * Authorization Code flow in src/lib/providers/spotify/oauth.ts.
 *
 * Tokens last ~1hr (`expires_in`, seconds); cached in-memory per server
 * instance and refreshed on demand a few seconds before expiry, mirroring
 * how SpotifyProvider and every other provider in this codebase never
 * throws to its caller.
 */
let cachedToken: { token: string; expiresAt: number } | null = null;

export function spotifyCredentialsConfigured(): boolean {
  return Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
}

export async function getAppAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const EARLY_REFRESH_MS = 10_000;
  if (cachedToken && cachedToken.expiresAt - EARLY_REFRESH_MS > Date.now()) {
    return cachedToken.token;
  }

  try {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Spotify token request failed: ${res.status}`);
    const json = (await res.json()) as { access_token: string; expires_in: number };
    cachedToken = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
    return cachedToken.token;
  } catch (error) {
    logger.error("Spotify getAppAccessToken failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
