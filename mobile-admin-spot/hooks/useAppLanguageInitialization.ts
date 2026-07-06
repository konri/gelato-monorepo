import { isLanguageSupported } from "@/constants/supportedLanguages";
import { safeGetItem } from "@/utils/safeAsyncStorage";
import { getLocales } from "expo-localization";
import i18n from "i18next";
import { useEffect, useState } from "react";

const DEFAULT_LANGUAGE = "EN";

const resolveLanguage = (language: string | null | undefined): string => {
  if (!language) {
    return DEFAULT_LANGUAGE;
  }

  const normalizedLanguage = language.toUpperCase();
  return isLanguageSupported(normalizedLanguage)
    ? normalizedLanguage
    : DEFAULT_LANGUAGE;
};

const loadLanguage = async () => {
  try {
    const stored = await safeGetItem("language");
    if (stored) {
      await i18n.changeLanguage(resolveLanguage(stored).toLowerCase());
      return;
    }
  } catch {
  }

  const deviceLanguage = getLocales()[0].languageCode;
  await i18n.changeLanguage(resolveLanguage(deviceLanguage).toLowerCase());
};

export const useAppLanguageInitialization = () => {
  const [isLanguageReady, setIsLanguageReady] = useState(false);

  useEffect(() => {
    loadLanguage().finally(() => {
      setIsLanguageReady(true);
    });
  }, []);

  return isLanguageReady;
};
