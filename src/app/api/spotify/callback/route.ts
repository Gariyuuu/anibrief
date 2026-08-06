import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { db, isDatabaseConfigured } from "@/lib/db/client";
import { userSpotifyConnections } from "@/lib/db/schema";
import { exchangeCodeForToken, getSpotifyUserProfile } from "@/lib/providers/spotify/oauth";
import { logger } from "@/lib/utils/logger";

const STATE_COOKIE = "spotify_oauth_state";

/**
 * GET /api/spotify/callback — Spotify redirects here after the user
 * approves (or denies) the connect request. Verifies the CSRF `state`
 * cookie set by /api/spotify/connect, exchanges the code for tokens, fetches
 * the Spotify user's own id, and upserts the connection row keyed by the
 * signed-in Clerk user. Always redirects back to /music with a clear
 * success/error indicator rather than rendering anything itself.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const musicUrl = new URL("/music", url.origin);

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", url.origin));
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  if (oauthError) {
    musicUrl.searchParams.set("spotify_error", oauthError);
    return NextResponse.redirect(musicUrl);
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    musicUrl.searchParams.set("spotify_error", "state_mismatch");
    return NextResponse.redirect(musicUrl);
  }

  if (!isDatabaseConfigured()) {
    musicUrl.searchParams.set("spotify_error", "db_not_configured");
    return NextResponse.redirect(musicUrl);
  }

  try {
    const token = await exchangeCodeForToken(code);
    const profile = await getSpotifyUserProfile(token.accessToken);

    await db()
      .insert(userSpotifyConnections)
      .values({
        clerkUserId: userId,
        spotifyUserId: profile.id,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        expiresAt: token.expiresAt,
        scope: token.scope,
      })
      .onConflictDoUpdate({
        target: userSpotifyConnections.clerkUserId,
        set: {
          spotifyUserId: profile.id,
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          expiresAt: token.expiresAt,
          scope: token.scope,
        },
      });

    musicUrl.searchParams.set("spotify_connected", "1");
    return NextResponse.redirect(musicUrl);
  } catch (error) {
    logger.error("Spotify OAuth callback failed", { error: error instanceof Error ? error.message : String(error) });
    musicUrl.searchParams.set("spotify_error", "exchange_failed");
    return NextResponse.redirect(musicUrl);
  }
}
