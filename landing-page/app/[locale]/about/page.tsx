import type { Metadata } from 'next';
import About from '@/components/About/About';
import type { LocalePageProps } from '@/types/locale';
import { resolveLocale } from '@/utils/getDictionary';

export const metadata: Metadata = {
  title: 'O nas — zespół i misja | Bonapka',
  description:
    'Poznaj zespół Bonapka. Tworzymy narzędzia, które pomagają lokalnym firmom budować trwałe relacje z klientami — prosto, cyfrowo i skutecznie.',
};

export default function AboutPage({ params }: LocalePageProps) {
  return <About locale={resolveLocale(params.locale)} />;
}
