import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { buildAuthorizeUrl } from "@/lib/providers/spotify/oauth";

const STATE_COOKIE = "spotify_oauth_state";

/**
 * GET /api/spotify/connect — starts the Spotify Authorization Code flow.
 * Requires sign-in first (this connects Spotify *to* an AniBrief account),
 * then redirects to Spotify's own consent screen with a CSRF `state` value
 * stashed in a short-lived, httpOnly cookie for the callback to verify.
 */
export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect_url", "/api/spotify/connect");
    return NextResponse.redirect(signInUrl);
  }

  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    const musicUrl = new URL("/music", request.url);
    musicUrl.searchParams.set("spotify_error", "not_configured");
    return NextResponse.redirect(musicUrl);
  }

  const state = randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(buildAuthorizeUrl(state));
}
