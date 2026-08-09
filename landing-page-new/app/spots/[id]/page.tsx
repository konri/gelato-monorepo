import { Header } from "../../components/Header";
import { Footer } from "../../components/LandingSections";
import { SpotDetail } from "../../components/SpotDetail";
import { fetchAllSpots } from "../../lib/api";

// Static export needs to know every spot id at build time. New spots won't
// get a page until the next build/deploy — rebuild the site when spots change.
// A placeholder id keeps the build valid even if production has zero spots
// (a dynamic route with no pre-rendered paths fails `output: "export"`).
export async function generateStaticParams() {
  try {
    const spots = await fetchAllSpots();
    if (spots.length === 0) return [{ id: '_placeholder' }];
    return spots.map((spot) => ({ id: spot.id }));
  } catch {
    return [{ id: '_placeholder' }];
  }
}

export default function SpotDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <>
      <Header />
      <main className="pt-16">
        <SpotDetail spotId={params.id} />
      </main>
      <Footer />
    </>
  );
}
