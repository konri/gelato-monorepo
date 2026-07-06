import type { Metadata } from 'next';
import Download from '@/components/Download/Download';
import type { LocalePageProps } from '@/types/locale';
import { resolveLocale } from '@/utils/getDictionary';

export const metadata: Metadata = {
  title: 'Pobierz aplikację — Bonapka i BonApka Merchant | Bonapka',
  description:
    'Pobierz aplikację Bonapka (dla klientów) i BonApka Merchant (dla właścicieli firm) na iOS i Android.',
};

export default function DownloadPage({ params }: LocalePageProps) {
  return <Download locale={resolveLocale(params.locale)} />;
}
