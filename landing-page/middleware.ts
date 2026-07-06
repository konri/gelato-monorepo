import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SUPPORTED_LOCALES = ['pl', 'en', 'de', 'es', 'fr', 'it', 'ru'];

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (!request.cookies.has('locale')) {
    const acceptLanguage = request.headers.get('accept-language') || '';
    const preferred = acceptLanguage.split(',')[0]?.split('-')[0]?.toLowerCase();
    const locale = preferred && SUPPORTED_LOCALES.includes(preferred) ? preferred : 'pl';
    response.cookies.set('locale', locale, { maxAge: 31536000, path: '/' });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next|api|favicon|assets|sitemap|robots).*)'],
};
