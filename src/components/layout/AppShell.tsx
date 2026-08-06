"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Menu, X, Search, Bell } from "lucide-react";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { NavLinks } from "@/components/layout/NavLinks";
import { MobileNav } from "@/components/layout/MobileNav";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AccentPicker } from "@/components/layout/AccentPicker";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";

export function AppShell({ children, banner }: { children: ReactNode; banner?: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="mx-auto flex min-h-screen max-w-[1440px]">
      <CommandPalette />

      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border p-4 md:flex">
        <Logo />
        <div className="mt-6 flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <p className="mt-4 border-t border-border pt-3 text-[11px] leading-snug text-muted">
          Independent discovery &amp; tracking service. Not affiliated with AniList, MyAnimeList, or Crunchyroll.
        </p>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="w-64 border-r border-border bg-background p-4">
            <div className="flex items-center justify-between">
              <Logo />
              <Button variant="ghost" className="px-2" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="mt-6">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col pb-14 md:pb-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2 md:hidden">
            <Button variant="ghost" className="px-2" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "/" }))}
            className="hidden flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-muted hover:border-accent/50 sm:flex sm:max-w-sm"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
            Search anime, manga…
            <kbd className="ml-auto rounded border border-border px-1.5 py-0.5 text-[10px]">⌘K</kbd>
          </button>

          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="secondary"
              className="px-2 sm:hidden"
              aria-label="Search"
              onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "/" }))}
            >
              <Search className="h-4 w-4" />
            </Button>
            <AccentPicker />
            <ThemeToggle />
            <Show when="signed-in">
              <Link
                href="/alerts"
                aria-label="Notifications"
                className="inline-flex items-center justify-center rounded-md border border-border bg-surface-raised px-2 py-1.5 text-foreground hover:bg-border/40"
              >
                <Bell className="h-4 w-4" />
              </Link>
              <UserButton />
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button variant="primary" size="sm">
                  Sign in
                </Button>
              </SignInButton>
            </Show>
          </div>
        </header>
        {banner}
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>

      <MobileNav />
    </div>
  );
}
