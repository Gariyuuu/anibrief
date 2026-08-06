import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import type { NormalizedCharacter } from "@/lib/types/character";

/** Grid card for an AniList character — mirrors PersonCard's layout so People/Characters browse the same visually. */
export function CharacterCard({ character }: { character: NormalizedCharacter }) {
  return (
    <Link href={`/characters/${encodeURIComponent(character.id)}`}>
      <Card className="flex h-full items-center gap-3 p-3 hover:border-accent/50">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full">
          {character.image ? (
            <Image src={character.image} alt="" fill sizes="56px" className="object-cover" />
          ) : (
            <div className="h-full w-full bg-border" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{character.name}</p>
          {character.nativeName && <p className="truncate text-xs text-muted">{character.nativeName}</p>}
          {typeof character.favourites === "number" && (
            <p className="mt-0.5 truncate text-xs text-accent">{character.favourites.toLocaleString()} favorites</p>
          )}
        </div>
      </Card>
    </Link>
  );
}
