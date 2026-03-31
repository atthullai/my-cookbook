import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow remote demo photos from the reference recipe while keeping the host list tight.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.thebakingspoon.com",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;
