import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vocafast",
    short_name: "Vocafast",
    description: "Learn vocabulary fast with spaced repetition",
    start_url: "/decks",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#007AFF",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
