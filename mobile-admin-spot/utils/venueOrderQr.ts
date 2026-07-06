import * as Linking from "expo-linking";
import { logger } from "./logger";

const SESSION_TOKEN_HEX_RE = /^[a-f0-9]{64}$/i;

export type VenueSessionScanPayload = {
  sessionToken: string;
  merchantStoreId: string;
};

function queryParam(
  params: Linking.QueryParams | null | undefined,
  key: string,
): string | undefined {
  if (params == null) return undefined;
  const raw = params[key];
  if (raw == null) return undefined;
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === "string" ? first : undefined;
  }
  return typeof raw === "string" ? raw : undefined;
}

export function extractVenueSessionFromUrl(data: string): VenueSessionScanPayload | null {
  const trimmed = data?.trim();
  if (!trimmed) return null;

  let pathSegments: string[];
  let sessionRaw: string | null = null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      pathSegments = u.pathname.split("/").filter((s) => s.length > 0);
      sessionRaw = u.searchParams.get("session");
    } catch {
      return null;
    }
  } else {
    try {
      const parsed = Linking.parse(trimmed);
      const q = queryParam(parsed.queryParams, "session");
      sessionRaw = q ?? null;
      const path = parsed.path?.replace(/^\//, "") ?? "";
      pathSegments = path.split("/").filter((s) => s.length > 0);
    } catch (error) {
      logger.error("Error parsing venue session QR:", error);
      return null;
    }
  }

  if (sessionRaw == null || !SESSION_TOKEN_HEX_RE.test(sessionRaw.trim())) {
    return null;
  }

  const orderIdx = pathSegments.indexOf("order");
  if (orderIdx < 0 || orderIdx >= pathSegments.length - 1) {
    return null;
  }
  const merchantStoreId = pathSegments[orderIdx + 1]?.trim();
  if (!merchantStoreId) {
    return null;
  }

  return {
    sessionToken: sessionRaw.trim(),
    merchantStoreId,
  };
}
