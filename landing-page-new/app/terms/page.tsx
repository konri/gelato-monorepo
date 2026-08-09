"use client";

import { Header } from "../components/Header";
import { Footer } from "../components/LandingSections";
import { useI18n } from "../i18n/I18nProvider";
import { TermsContentPl } from "./TermsContentPl";
import { TermsContentEn } from "./TermsContentEn";

export default function TermsPage() {
  const { locale } = useI18n();

  return (
    <>
      <Header />
      <main className="pt-16">
        <div className="mx-auto max-w-3xl px-5 py-14 text-espresso-dark">
          {locale === "en" ? <TermsContentEn /> : <TermsContentPl />}
        </div>
      </main>
      <Footer />
    </>
  );
}
