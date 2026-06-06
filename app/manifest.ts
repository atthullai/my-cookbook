import type { MetadataRoute } from "next";

// Web App Manifest — makes the cookbook installable as a PWA.
// (Icons reuse favicon for now; add 192/512 PNGs later for richer install UI.)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My Cookbook",
    short_name: "Cookbook",
    description: "Save, plan, shop, and cook your favourite recipes.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5efe6",
    theme_color: "#c9952a",
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
