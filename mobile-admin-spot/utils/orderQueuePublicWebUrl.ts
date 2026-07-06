import { config } from "@/config";

export function orderQueueWebPathLocale(languageTag: string): "pl" | "en" {
  const primary = languageTag.split("-")[0]?.toLowerCase() ?? "en";
  return primary === "pl" ? "pl" : "en";
}

export function buildOrderQueuePublicWebUrl(
  merchantStoreId: string,
  languageTag: string,
): string {
  const locale = orderQueueWebPathLocale(languageTag);
  const origin = config.CONSUMER_WEB_APP_ORIGIN;
  return `${origin}/${locale}/order/${merchantStoreId}`;
}
