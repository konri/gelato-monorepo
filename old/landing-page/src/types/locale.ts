import type { Locale } from '@/utils/getDictionary';

export type LocalePageProps = {
  params: { locale: string };
};

export type WithLocale = {
  locale: Locale;
};
