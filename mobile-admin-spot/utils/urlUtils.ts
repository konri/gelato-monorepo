import { config } from "@/config";
import * as Linking from "expo-linking";
import { logger } from "./logger";
import { isValidUUID } from "./validators";

export const getFullApiUrl = (
  relativeUrl: string | null | undefined,
): string | null => {
  if (!relativeUrl) return null;

  if (relativeUrl.startsWith("http://") || relativeUrl.startsWith("https://")) {
    return relativeUrl;
  }

  const normalizedUrl = relativeUrl.startsWith("/")
    ? relativeUrl
    : `/${relativeUrl}`;

  return `${config.API_URL}${normalizedUrl}`;
};

export const isSvgUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return url.toLowerCase().endsWith(".svg") || url.includes("image/svg+xml");
};

export const extractUserIdFromUrl = (data: string): string | null => {
  const trimmed = data?.trim();
  if (!trimmed) return null;

  try {
    const parsed = Linking.parse(trimmed);
    const userId = parsed.queryParams?.userId;

    if (userId && isValidUUID(String(userId))) {
      return String(userId).trim();
    }
  } catch (error) {
    logger.error("Error parsing QR data:", error);
  }

  return null;
};
