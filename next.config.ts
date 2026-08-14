import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org" },
      // Legacy covers on game rows added before the IGDB migration.
      { protocol: "https", hostname: "media.rawg.io" },
      { protocol: "https", hostname: "images.igdb.com" },
      { protocol: "https", hostname: "covers.openlibrary.org" },
    ],
  },
  async redirects() {
    return [
      // Canonical host: 308 the www duplicate to the apex so Google indexes one host.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.hoqu.dev" }],
        destination: "https://hoqu.dev/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
