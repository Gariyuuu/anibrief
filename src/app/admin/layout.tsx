import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/utils/adminAccess";

// Gates the entire /admin/* subtree. Access requires the signed-in Clerk
// user id to be listed in ADMIN_USER_IDS (comma-separated, see
// src/lib/utils/adminAccess.ts), or profiles.isAdmin === true as a
// secondary path. Anyone else — including other signed-in users — is
// redirected to "/" with no indication /admin exists.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();
  if (!(await isAdminUser(userId))) {
    redirect("/");
  }

  return <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">{children}</div>;
}
