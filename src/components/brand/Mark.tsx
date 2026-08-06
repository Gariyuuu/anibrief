import type { SVGProps } from "react";

/**
 * AniBrief mark: a folded briefing page (top-right dog-ear) with a play
 * triangle at its center that doubles as a stylized eye/iris — "a briefing
 * you watch." Deliberately simple so it stays legible at 16px favicon size.
 * Original geometric design — not derived from any existing anime-site logo.
 */
export function Mark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M6 4C6 2.89543 6.89543 2 8 2H20L26 8V28C26 29.1046 25.1046 30 24 30H8C6.89543 30 6 29.1046 6 28V4Z"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M20 2V6C20 7.10457 20.8954 8 22 8H26"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M14 12.5L20.5 16.5L14 20.5V12.5Z" fill="var(--color-accent, currentColor)" />
    </svg>
  );
}
