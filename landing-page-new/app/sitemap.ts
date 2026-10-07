import type { MetadataRoute } from "next";
import { PUBLIC_ROUTES, SITE_URL } from "./lib/seo";

// Written as a static `sitemap.xml` at build time (output: "export").
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    changeFrequency: path === "/policy" || path === "/terms" ? "yearly" : "weekly",
    priority: path === "/" ? 1 : path === "/for-business" ? 0.8 : 0.6,
  }));
}
