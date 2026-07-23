import { Header } from "../components/Header";
import { Footer } from "../components/LandingSections";
import { SpotsExplorer } from "../components/SpotsExplorer";

export default function SpotsPage() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <SpotsExplorer />
      </main>
      <Footer />
    </>
  );
}
