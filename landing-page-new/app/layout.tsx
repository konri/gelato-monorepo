import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { I18nProvider } from "./i18n/I18nProvider";
import { AuthProvider } from "./auth/AuthProvider";
import { AuthModalProvider } from "./auth/AuthModalProvider";
import { CartProvider } from "./lib/cart";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Gelato — Rzemieślnicze lody i kawa z dostawą",
  description:
    "Zamów premium lody rzemieślnicze i kawę z lokalnych punktów. Szybka dostawa, śledzenie kuriera na żywo i program lojalnościowy w jednej aplikacji.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <I18nProvider>
          <AuthProvider>
            <AuthModalProvider>
              <CartProvider>{children}</CartProvider>
            </AuthModalProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
