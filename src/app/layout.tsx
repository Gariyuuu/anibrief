import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { AppShell } from "@/components/layout/AppShell";
import { AnnouncementBanner } from "@/components/layout/AnnouncementBanner";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { defaultAccent } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "AniBrief — Your daily briefing for anime, manga, music, and more",
    template: "%s · AniBrief",
  },
  description:
    "A daily briefing terminal for anime, manga, Japanese music, and voice-actor news, episode tracking, and discovery.",
  applicationName: "AniBrief",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "AniBrief" },
};

// Runs before paint to avoid a light-mode/wrong-accent flash on load.
// "system" (no stored value, or the literal string "system") follows the
// OS preference via matchMedia — falls back to dark if matchMedia isn't
// available, matching the previous unconditional default.
const themeInitScript = `
(function () {
  try {
    var stored = window.localStorage.getItem("anibrief-theme");
    var isDark = stored === "dark" ? true : stored === "light" ? false : (window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)").matches : true);
    document.documentElement.classList.toggle("dark", isDark);
    var accent = window.localStorage.getItem("anibrief-accent") || "${defaultAccent}";
    document.documentElement.setAttribute("data-accent", accent);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <OfflineBanner />
          <AppShell banner={<AnnouncementBanner />}>{children}</AppShell>
          <ServiceWorkerRegister />
        </ClerkProvider>
      </body>
    </html>
  );
}
