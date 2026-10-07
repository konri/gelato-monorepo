"use client";

import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { SpotDetail } from "../../components/SpotDetail";
import { useSpotRouteId } from "../../lib/useSpotRouteId";

export function SpotDetailPageClient({ id }: { id: string }) {
  const spotId = useSpotRouteId(id);

  return (
    <>
      <Header />
      <main id="main" className="pt-16">
        {spotId ? (
          <SpotDetail spotId={spotId} />
        ) : (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-berry/30 border-t-berry" />
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
