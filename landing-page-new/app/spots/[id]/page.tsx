import { Header } from "../../components/Header";
import { Footer } from "../../components/LandingSections";
import { SpotDetail } from "../../components/SpotDetail";

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
