import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/explore",
        "/movies",
        "/tv",
        "/games",
        "/books",
        "/achievements",
        "/profile/",
        "/friends",
        "/guilds",
        "/items",
        "/search",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
