import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import type { NormalizedPerson } from "@/lib/types/person";

/** Grid card for a real AniList staff member — used by search results and the birthday sections. */
export function PersonCard({ person, meta }: { person: NormalizedPerson; meta?: string }) {
  return (
    <Link href={`/people/${encodeURIComponent(person.id)}`}>
      <Card className="flex h-full items-center gap-3 p-3 hover:border-accent/50">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full">
          {person.image ? (
            <Image src={person.image} alt="" fill sizes="56px" className="object-cover" />
          ) : (
            <div className="h-full w-full bg-border" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{person.name}</p>
          {person.nativeName && <p className="truncate text-xs text-muted">{person.nativeName}</p>}
          {meta && <p className="mt-0.5 truncate text-xs text-accent">{meta}</p>}
        </div>
      </Card>
    </Link>
  );
}
