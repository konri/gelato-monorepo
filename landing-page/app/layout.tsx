import type { Metadata } from 'next';
import { Urbanist } from 'next/font/google';
import '../src/globals.css';

const urbanist = Urbanist({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-urbanist',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Bonapka — platforma lojalnościowa dla Twojego biznesu',
  description:
    'Bonapka to kompletna platforma lojalnościowa: kupony rabatowe, karty pieczątek, serie wizyt, punkty i nagrody. Dwie aplikacje — Bonapka dla klientów i BonApka Merchant dla biznesu.',
  metadataBase: new URL('https://bonapka.com'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/favicon_bonapka.svg" />
        <meta name="theme-color" content="#EC2828" />
        <meta name="author" content="Bonapka" />
      </head>
      <body className={`${urbanist.variable} bg-main-background-color overflow-x-hidden font-sans`}>{children}</body>
    </html>
  );
}
