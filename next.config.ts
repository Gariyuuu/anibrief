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
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://graphql.anilist.co https://api.jikan.moe https://news.google.com https://www.googleapis.com https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
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
