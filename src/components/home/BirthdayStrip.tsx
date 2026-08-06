import Link from "next/link";
import Image from "next/image";
import { Cake } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { NormalizedPerson } from "@/lib/types/person";
import type { CharacterBirthday } from "@/lib/providers/anilist/mappers";

export function BirthdayStrip({ people, characters }: { people: NormalizedPerson[]; characters: CharacterBirthday[] }) {
  if (people.length === 0 && characters.length === 0) {
    return (
      <Card className="p-4">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
          <Cake className="h-4 w-4 text-accent" /> Birthdays today
        </h2>
        <p className="mt-2 text-sm text-muted">No tracked birthdays today.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold">
        <Cake className="h-4 w-4 text-accent" /> Birthdays today
      </h2>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {people.map((p) => (
          <Link key={p.id} href={`/people/${encodeURIComponent(p.id)}`} className="flex w-16 shrink-0 flex-col items-center gap-1 text-center">
            <div className="relative h-14 w-14 overflow-hidden rounded-full border border-border">
              {p.image ? <Image src={p.image} alt="" fill sizes="56px" className="object-cover" /> : <div className="h-full w-full bg-border" />}
            </div>
            <p className="line-clamp-2 text-[11px] leading-tight">{p.name}</p>
            <Badge tone="accent" className="text-[9px]">Real person</Badge>
          </Link>
        ))}
        {characters.map((c) => (
          <a key={c.id} href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex w-16 shrink-0 flex-col items-center gap-1 text-center">
            <div className="relative h-14 w-14 overflow-hidden rounded-full border border-dashed border-border">
              {c.image ? <Image src={c.image} alt="" fill sizes="56px" className="object-cover" /> : <div className="h-full w-full bg-border" />}
            </div>
            <p className="line-clamp-2 text-[11px] leading-tight">{c.name}</p>
            <Badge tone="neutral" className="text-[9px]">Character</Badge>
          </a>
        ))}
      </div>
    </Card>
  );
}
