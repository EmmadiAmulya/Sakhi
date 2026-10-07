import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sakhi — Women's Health Companion",
    short_name: "Sakhi",
    description:
      "A serene, privacy-first companion for menstrual cycle tracking, mood and habit logging, journaling, and AI guidance.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3dae6",
    theme_color: "#d56f96",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
