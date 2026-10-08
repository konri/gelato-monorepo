import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { I18nProvider } from "./i18n/I18nProvider";
import { AuthProvider } from "./auth/AuthProvider";
import { AuthModalProvider } from "./auth/AuthModalProvider";
import { CartProvider } from "./lib/cart";
import { StaticExportSpotGate } from "./components/StaticExportSpotGate";
import pl from "../public/locales/pl/common.json";
import { BASE_OPEN_GRAPH, SITE_URL } from "./lib/seo";

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

// Static metadata in Polish (primary market); the visible copy switches
// language on the client via the I18nProvider.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: pl.site.title,
  description: pl.site.description,
  icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" },
  // og:url is set per page (`/` and `/for-business`), so other routes never
  // claim the home page as their URL.
  openGraph: BASE_OPEN_GRAPH,
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
              <CartProvider>
                <StaticExportSpotGate>{children}</StaticExportSpotGate>
              </CartProvider>
            </AuthModalProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
