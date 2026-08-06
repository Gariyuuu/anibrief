import type { LucideIcon } from "lucide-react";
import {
  Home,
  Newspaper,
  Radio,
  CalendarRange,
  Clapperboard,
  BookOpen,
  Music2,
  Users,
  CalendarDays,
  Compass,
  ListChecks,
  Bell,
  UserCircle,
  Settings,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Keyboard "g then x" shortcut suffix, if any. */
  shortcut?: string;
}

export const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home, shortcut: "h" },
  { href: "/daily-brief", label: "Daily Brief", icon: Newspaper, shortcut: "b" },
  { href: "/news", label: "News", icon: Radio, shortcut: "n" },
  { href: "/airing", label: "Airing", icon: CalendarRange, shortcut: "a" },
  { href: "/seasonal", label: "Seasonal", icon: Clapperboard, shortcut: "s" },
  { href: "/anime", label: "Anime", icon: Clapperboard },
  { href: "/manga", label: "Manga", icon: BookOpen, shortcut: "m" },
  { href: "/music", label: "Music", icon: Music2 },
  { href: "/people", label: "People", icon: Users, shortcut: "p" },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, shortcut: "c" },
  { href: "/discover", label: "Discover", icon: Compass, shortcut: "d" },
  { href: "/my-list", label: "My List", icon: ListChecks, shortcut: "l" },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/profile", label: "Profile", icon: UserCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** Subset shown in the mobile bottom bar — keep to 5 for thumb reach. */
export const mobileNavItems: NavItem[] = [
  navItems[0], // Home
  navItems[1], // Daily Brief
  navItems[3], // Airing
  navItems[11], // My List
  navItems[9], // Calendar
];
