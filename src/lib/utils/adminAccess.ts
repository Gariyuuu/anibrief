import "server-only";
import { getOrCreateProfile } from "@/lib/actions/profile";

/**
 * Admin gating for `/admin/*` and admin-only server actions.
 *
 * There is no UI yet to grant `profiles.isAdmin`, so the primary path is an
 * env-var allowlist: set `ADMIN_USER_IDS` to a comma-separated list of Clerk
 * user ids (e.g. `ADMIN_USER_IDS=user_2abc123,user_2def456`). Find your own
 * Clerk user id in the Clerk Dashboard under Users, or via `auth()`'s
 * `userId` while signed in. This is checked first and requires no DB.
 *
 * `profiles.isAdmin` is a secondary path — once at least one admin exists
 * (either via the allowlist or a direct DB edit), they'll eventually be able
 * to promote others by flipping that column. Nothing in this codebase writes
 * `isAdmin` yet, so today it only matters if you set it by hand.
 */
export function parseAdminUserIds(): string[] {
  return (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export async function isAdminUser(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  if (parseAdminUserIds().includes(userId)) return true;
  const profile = await getOrCreateProfile(userId);
  return Boolean(profile?.isAdmin);
}
