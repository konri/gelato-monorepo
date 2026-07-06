import { isLanguageSupported } from "@/constants/supportedLanguages";
import { logger } from "@/utils/logger";
import { safeSetItem } from "@/utils/safeAsyncStorage";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "language";

export const useLanguagePreference = () => {
  const { i18n } = useTranslation();

  const currentUpper = (i18n.language || "en").split("-")[0].toUpperCase();

  const setAppLanguage = async (code: string) => {
    const normalized = code.split("-")[0].toUpperCase();
    if (!isLanguageSupported(normalized)) {
      logger.warn("Unsupported language requested", { normalized });
      return;
    }
    try {
      await safeSetItem(STORAGE_KEY, normalized);
      await i18n.changeLanguage(normalized.toLowerCase());
    } catch (e) {
      logger.error("Failed to persist language", e);
    }
  };

  return { currentUpper, setAppLanguage };
};
