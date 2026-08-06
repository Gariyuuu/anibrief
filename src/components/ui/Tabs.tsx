"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export interface TabItem {
  href: string;
  label: string;
}

export function Tabs({ items, active }: { items: TabItem[]; active: string }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-border">
      {items.map((item) => {
        const isActive = item.href === active;
        return (
          <Link
            key={item.href}
            href={item.href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              isActive ? "border-accent text-foreground" : "border-transparent text-muted hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
