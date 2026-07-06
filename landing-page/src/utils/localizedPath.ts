import type { Locale } from '@/utils/getDictionary';

export function localizedPath(locale: Locale, path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized === '/') {
    return `/${locale}`;
  }
  return `/${locale}${normalized}`;
}

export function stripLocalePrefix(pathname: string): string {
  const match = pathname.match(/^\/(pl|en|de|es|fr|it|ru)(\/.*)?$/);
  if (!match) {
    return pathname || '/';
  }
  return match[2] || '/';
}
