import type { Metadata } from "next";
import pl from "../../public/locales/pl/business.json";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { BusinessI18n } from "../components/business/BusinessI18n";
import { BusinessPage } from "../components/business/BusinessPage";

// Static metadata in Polish (primary market), like the rest of the site.
// The visible copy switches language on the client via the I18nProvider.
export const metadata: Metadata = {
  title: pl.meta.title,
  description: pl.meta.description,
  alternates: { canonical: "/for-business" },
  openGraph: {
    title: pl.meta.title,
    description: pl.meta.description,
    url: "/for-business",
    siteName: "Loodly",
    locale: "pl_PL",
    type: "website",
  },
};

export default function ForBusinessPage() {
  return (
    <>
      <Header />
      <main id="main" className="pt-16">
        <BusinessI18n>
          <BusinessPage />
        </BusinessI18n>
      </main>
      <Footer />
    </>
  );
}
