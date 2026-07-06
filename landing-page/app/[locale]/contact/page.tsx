import type { Metadata } from 'next';
import Contact from '@/components/Contact/Contact';
import type { LocalePageProps } from '@/types/locale';
import { resolveLocale } from '@/utils/getDictionary';

export const metadata: Metadata = {
  title: 'Kontakt — pytania i wsparcie | Bonapka',
  description: 'Skontaktuj się z zespołem Bonapka. Pytania, zgłoszenia błędów, opinie — chętnie pomożemy.',
};

export default function ContactPage({ params }: LocalePageProps) {
  return <Contact locale={resolveLocale(params.locale)} />;
}
