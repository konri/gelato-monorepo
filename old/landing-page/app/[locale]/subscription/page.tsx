import type { Metadata } from 'next';
import Subscription from '@/components/Subscription/Subscription';
import type { LocalePageProps } from '@/types/locale';
import { resolveLocale } from '@/utils/getDictionary';

export const metadata: Metadata = {
  title: 'Cennik i plany — Start, Pro, Enterprise | Bonapka',
  description: 'Wybierz plan Bonapka dla swojego biznesu. Zacznij za darmo z planem Start lub odblokuj pełne możliwości z Pro.',
};

export default function SubscriptionPage({ params }: LocalePageProps) {
  return <Subscription locale={resolveLocale(params.locale)} />;
}
