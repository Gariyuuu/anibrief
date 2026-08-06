import type { NextConfig } from "next";

// Clerk's hosted components (SignIn/SignUp/UserButton) load scripts, styles,
// and iframes from its own domains, and Next's theme-init script (see
// src/app/layout.tsx) is necessarily inline — so script-src/style-src need
// 'unsafe-inline' here rather than a nonce-based policy. Everything else is
// scoped to exactly the hosts this app actually talks to (see
// DATA_SOURCES.md), not a blanket allowlist.
//
// challenges.cloudflare.com is Cloudflare Turnstile, which Clerk's sign-up
// bot-protection CAPTCHA loads from — omitting it here previously broke
// sign-up with a "CAPTCHA failed to load" error for every visitor, not just
// a specific browser.
//
// Spotify: every actual Spotify Web API call this app makes (Client
// Credentials search, playlist-tracks lookup, playlist creation, token
// exchange/refresh) happens server-side in providers/route handlers/server
// actions, which aren't subject to CSP at all, and the OAuth connect flow is
// a plain top-level redirect (also not CSP-governed). accounts.spotify.com
// and api.spotify.com are still allowlisted in connect-src here defensively
// — so that a future client-side addition (e.g. audio preview playback, the
// Web Playback SDK) doesn't silently break the exact way Clerk's CAPTCHA
// did when its host was missing. open.spotify.com is only ever a plain
// `<a target="_blank">` link (never embedded), so it needs no CSP entry.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://graphql.anilist.co https://api.jikan.moe https://news.google.com https://www.googleapis.com https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com https://accounts.spotify.com https://api.spotify.com",
  "frame-src https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "s4.anilist.co" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      // Spotify's album-art / playlist-cover CDN hosts (real observed hostnames,
      // not guessed — Spotify serves cover art from several of these).
      { protocol: "https", hostname: "i.scdn.co" },
      { protocol: "https", hostname: "mosaic.scdn.co" },
      { protocol: "https", hostname: "image-cdn-ak.spotifycdn.com" },
      { protocol: "https", hostname: "image-cdn-fa.spotifycdn.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
