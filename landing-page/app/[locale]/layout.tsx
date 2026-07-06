import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { LOCALES, resolveLocale } from '@/utils/getDictionary';
import type { LocalePageProps } from '@/types/locale';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default function LocaleLayout({
  children,
  params,
}: LocalePageProps & { children: React.ReactNode }) {
  const locale = resolveLocale(params.locale);

  if (!LOCALES.includes(locale)) {
    notFound();
  }

  return (
    <div className="max-container padding-container relative bg-main-background-color">
      <Navbar locale={locale} />
      {children}
      <Footer locale={locale} />
    </div>
  );
}
