import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AniBrief — Your daily briefing for anime, manga, music, and more",
    short_name: "AniBrief",
    description:
      "A daily briefing terminal for anime, manga, Japanese music, and voice-actor news, episode tracking, and discovery.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0c10",
    theme_color: "#18140f",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png" },
    ],
  };
}
