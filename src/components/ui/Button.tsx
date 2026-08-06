import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-foreground hover:opacity-90",
  secondary: "bg-surface-raised text-foreground border border-border hover:bg-border/40",
  ghost: "text-foreground hover:bg-border/40",
  outline: "border border-border text-foreground hover:bg-border/30",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
};

const baseClasses =
  "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

type CommonProps = { variant?: ButtonVariant; size?: ButtonSize };

/** Renders a real `<a>`/Next `<Link>` when `href` is given, so link-shaped actions stay semantic instead of a `<button>` nested inside an `<a>`. */
export function Button({
  variant = "primary",
  size = "md",
  className,
  href,
  ...props
}: CommonProps & (({ href: string } & AnchorHTMLAttributes<HTMLAnchorElement>) | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>))) {
  const classes = cn(baseClasses, variantClasses[variant], sizeClasses[size], className);

  if (href) {
    return <Link href={href} className={classes} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)} />;
  }
  return <button className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)} />;
}
