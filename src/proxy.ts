import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/utils/adminAccess";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

// /admin also redirects non-admins at the page/layout level (src/app/admin/layout.tsx),
// but that check alone isn't sufficient here: in this Next.js version, a `redirect()`
// thrown partway through an async Server Component layout does not reliably stop an
// already-in-flight sibling page render from being serialized into the response (a
// streaming-RSC timing quirk, confirmed by inspecting a raw response body that still
// contained full admin page content despite the layout's redirect firing). Blocking
// the request here in middleware — before any rendering starts — is the actual fix;
// the layout-level check stays as defense-in-depth for client-side navigations.
// Reuses the same isAdminUser() check (ADMIN_USER_IDS env allowlist, or profiles.isAdmin
// as a fallback) rather than duplicating the logic — Neon's HTTP driver is
// fetch-based and Edge-runtime-safe, so calling it from middleware is fine, and it
// already degrades to `false` (not a throw) when DATABASE_URL isn't configured.
export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    const { userId } = await auth();
    if (!(await isAdminUser(userId))) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
