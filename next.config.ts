import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "images.igdb.com" },
      { protocol: "https", hostname: "covers.openlibrary.org" },
    ],
  },
  async redirects() {
    return [
      // Canonical host: 308 the www duplicate to the apex so Google indexes one
      // host. In production this never fires — Vercel's domain-level redirect
      // answers www at the edge (its 308 carries a `refresh` header and no
      // `x-matched-path`), so the request never reaches Next. Kept as the
      // fallback that preserves the canonical host if that domain config is
      // ever removed.
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
