"use client";

import type { ReactNode } from "react";
import { I18nNamespace } from "../../i18n/I18nProvider";
import pl from "../../../public/locales/pl/business.json";
import en from "../../../public/locales/en/business.json";
import ua from "../../../public/locales/ua/business.json";

const BUSINESS_DICTS = { pl, en, ua };

/**
 * Mounts `business.json` as the `business.*` namespace. Only `/for-business`
 * imports this, so the B2B copy stays out of the shared bundle.
 */
export function BusinessI18n({ children }: { children: ReactNode }) {
  return (
    <I18nNamespace name="business" dicts={BUSINESS_DICTS}>
      {children}
    </I18nNamespace>
  );
}
