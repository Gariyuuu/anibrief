import "server-only";

/**
 * Spotify's Authorization Code flow — separate from client.ts's app-level
 * Client Credentials token. This is the only flow that can act on a real
 * user's behalf (create playlists, add tracks), so it requires the user to
 * explicitly grant consent via Spotify's own hosted authorize screen.
 *
 * These helpers intentionally throw on failure (unlike SpotifyProvider's
 * read methods) — their callers are route handlers and server actions that
 * already wrap them in try/catch to produce a clear redirect or a
 * user-readable error, per this repo's server-action convention.
 */

const AUTH_BASE = "https://accounts.spotify.com";
const API_BASE = "https://api.spotify.com/v1";
const SCOPES = "playlist-modify-public playlist-modify-private";

export function getRedirectUri(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${appUrl}/api/spotify/callback`;
}

export function buildAuthorizeUrl(state: string): string {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) throw new Error("SPOTIFY_CLIENT_ID is not configured.");

  const url = new URL(`${AUTH_BASE}/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("redirect_uri", getRedirectUri());
  url.searchParams.set("state", state);
  return url.toString();
}

interface RawTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
}

export interface SpotifyTokenResult {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string;
}

function basicAuthHeader(): string {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("SPOTIFY_CLIENT_ID/SPOTIFY_CLIENT_SECRET are not configured.");
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

export async function exchangeCodeForToken(code: string): Promise<SpotifyTokenResult> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
  });

  const res = await fetch(`${AUTH_BASE}/api/token`, {
    method: "POST",
    headers: { Authorization: basicAuthHeader(), "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Spotify token exchange failed: ${res.status}`);
  const json = (await res.json()) as RawTokenResponse;
  if (!json.refresh_token) throw new Error("Spotify did not return a refresh token.");

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: new Date(Date.now() + json.expires_in * 1000),
    scope: json.scope ?? SCOPES,
  };
}

/** Spotify may omit `refresh_token` on a refresh response — the caller's existing one stays valid and should be reused (`existingRefreshToken` fills the gap). */
export async function refreshAccessToken(existingRefreshToken: string): Promise<SpotifyTokenResult> {
  const body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: existingRefreshToken });

  const res = await fetch(`${AUTH_BASE}/api/token`, {
    method: "POST",
    headers: { Authorization: basicAuthHeader(), "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Spotify token refresh failed: ${res.status}`);
  const json = (await res.json()) as RawTokenResponse;

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? existingRefreshToken,
    expiresAt: new Date(Date.now() + json.expires_in * 1000),
    scope: json.scope ?? SCOPES,
  };
}

export async function getSpotifyUserProfile(accessToken: string): Promise<{ id: string; displayName: string | null }> {
  const res = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Spotify profile fetch failed: ${res.status}`);
  const json = (await res.json()) as { id: string; display_name: string | null };
  return { id: json.id, displayName: json.display_name };
}
