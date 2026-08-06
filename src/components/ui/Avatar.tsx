import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export function Avatar({ src, alt, size = 32, className }: { src: string | null; alt: string; size?: number; className?: string }) {
  if (!src) {
    return (
      <div
        className={cn("flex shrink-0 items-center justify-center rounded-full bg-border text-xs font-medium text-muted", className)}
        style={{ width: size, height: size }}
        aria-label={alt}
      >
        {alt.slice(0, 1).toUpperCase()}
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn("shrink-0 rounded-full object-cover", className)}
      style={{ width: size, height: size }}
    />
  );
}
