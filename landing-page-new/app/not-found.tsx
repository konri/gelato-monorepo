"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Header } from "./components/Header";
import { Footer } from "./components/LandingSections";
import { SpotDetail } from "./components/SpotDetail";
import { useI18n } from "./i18n/I18nProvider";
import { bootSpotId, parseSpotIdFromPath } from "./lib/spot-route";

export default function NotFound() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [spotId, setSpotId] = useState<string | null>(
    () => parseSpotIdFromPath(pathname) ?? bootSpotId,
  );

  useEffect(() => {
    setSpotId(
      parseSpotIdFromPath(window.location.pathname) ??
        parseSpotIdFromPath(pathname) ??
        bootSpotId,
    );
  }, [pathname]);

  if (spotId) {
    return (
      <>
        <Header />
        <main className="pt-16">
          <SpotDetail spotId={spotId} />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-5 pt-16 text-center">
        <div className="text-6xl" aria-hidden>
          🍦
        </div>
        <p className="text-lg text-espresso/70">{t("spot.not_found")}</p>
        <Link
          href="/"
          className="rounded-full bg-berry px-6 py-3 font-semibold text-white"
        >
          {t("nav.home")}
        </Link>
      </main>
      <Footer />
    </>
  );
}
