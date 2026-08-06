import Link from "next/link";
import { Mark } from "@/components/brand/Mark";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 text-lg font-semibold tracking-tight">
      <Mark className="h-6 w-6 text-foreground" />
      <span>
        Ani<span className="text-accent">Brief</span>
      </span>
    </Link>
  );
}
