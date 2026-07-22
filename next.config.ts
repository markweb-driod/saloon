import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "loremflickr.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Allows the dev server's HMR/asset requests when the app is accessed
  // through a tunnel/proxy host instead of localhost.
  allowedDevOrigins: ["rational-number.outray.app", "*.outray.app"],
};

export default nextConfig;
