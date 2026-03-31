import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Recipe pages render source photos from the recipe blogs we import from.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.thebakingspoon.com",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "traditionallymodernfood.com",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "www.jeyashriskitchen.com",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;
