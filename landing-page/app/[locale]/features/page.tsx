import type { Metadata } from 'next';
import Features from '@/components/Features/Features';
import type { LocalePageProps } from '@/types/locale';
import { resolveLocale } from '@/utils/getDictionary';

export const metadata: Metadata = {
  title: 'Funkcje — kupony, pieczątki, streaki, punkty | Bonapka',
  description:
    'Poznaj wszystkie funkcje Bonapka: kupony rabatowe, cyfrowe karty pieczątek, serie wizyt, programy punktowe, nagrody, polecenia i statystyki dla Twojego biznesu.',
};

export default function FeaturesPage({ params }: LocalePageProps) {
  return <Features locale={resolveLocale(params.locale)} />;
}
