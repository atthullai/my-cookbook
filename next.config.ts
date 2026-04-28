import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Recipe pages render source photos from the recipe blogs we import from.
  images: {
    // External recipe blogs sometimes reject optimizer fetches even when the direct image URL works.
    // Using unoptimized remote images favors reliability for this private cookbook over aggressive CDN transforms.
    unoptimized: true,
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
        hostname: "www.traditionallymodernfood.com",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "http",
        hostname: "traditionallymodernfood.com",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "http",
        hostname: "www.traditionallymodernfood.com",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "www.jeyashriskitchen.com",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "jeyashriskitchen.com",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "hebbarskitchen.com",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "www.hebbarskitchen.com",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;
