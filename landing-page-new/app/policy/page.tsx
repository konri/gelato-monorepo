"use client";

import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useI18n } from "../i18n/I18nProvider";
import { PolicyContentPl } from "./PolicyContentPl";
import { PolicyContentEn } from "./PolicyContentEn";

export default function PolicyPage() {
  const { locale } = useI18n();

  return (
    <>
      <Header />
      <main id="main" className="pt-16">
        <div className="mx-auto max-w-3xl px-5 py-14 text-espresso-dark">
          {locale === "en" ? <PolicyContentEn /> : <PolicyContentPl />}
        </div>
      </main>
      <Footer />
    </>
  );
}
