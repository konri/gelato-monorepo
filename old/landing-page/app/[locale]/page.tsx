import type { Metadata } from 'next';
import Home from '@/components/Home/Home';
import type { LocalePageProps } from '@/types/locale';
import { resolveLocale } from '@/utils/getDictionary';

export const metadata: Metadata = {
  title: 'Bonapka — platforma lojalnościowa dla Twojego biznesu',
  description:
    'Bonapka to kompletna platforma lojalnościowa: kupony rabatowe, karty pieczątek, serie wizyt, punkty i nagrody. Dwie aplikacje — Bonapka dla klientów i BonApka Merchant dla biznesu.',
};

export default function HomePage({ params }: LocalePageProps) {
  const locale = resolveLocale(params.locale);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Bonapka',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'iOS, Android',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'PLN',
    },
    description:
      'Kompletna platforma lojalnościowa: kupony rabatowe, karty pieczątek, serie wizyt, punkty i nagrody. Bonapka dla klientów, BonApka Merchant dla biznesu.',
    url: 'https://bonapka.com',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Home locale={locale} />
    </>
  );
}
