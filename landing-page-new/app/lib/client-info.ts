import pkg from "../../package.json";

/**
 * Identifies the landing to the backend (BRANDS_SPEC §2.9, §6 L1a item 6):
 * `x-loodly-client: landing@<package.json version>`, deliberately **without**
 * `x-loodly-api` until the landing moves to the v2 contract (L2).
 *
 * Only the `/for-business` lead form sends it so far; the shared account/
 * checkout helpers adopt it in their own task.
 */
export const CLIENT_APP = "landing";
export const APP_VERSION: string = pkg.version;

export const CLIENT_HEADERS: Readonly<Record<string, string>> = {
  "x-loodly-client": `${CLIENT_APP}@${APP_VERSION}`,
};
