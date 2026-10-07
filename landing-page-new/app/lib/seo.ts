import type { Metadata } from "next";
import pl from "../../public/locales/pl/common.json";

/**
 * Server-side SEO constants (metadata, sitemap, robots). Metadata is static
 * and in Polish, the primary market; the visible copy switches language on
 * the client.
 */
export const SITE_URL = "https://loodly.pl";

/** Indexable static routes, for the sitemap. */
export const PUBLIC_ROUTES = ["/", "/for-business", "/spots", "/policy", "/terms"] as const;

/**
 * Site-wide Open Graph defaults (root layout). No `url` here: a page that
 * does not set its own would otherwise claim the home page as its og:url.
 */
export const BASE_OPEN_GRAPH = {
  title: pl.site.title,
  description: pl.site.description,
  siteName: "Loodly",
  locale: "pl_PL",
  type: "website",
} satisfies Metadata["openGraph"];
