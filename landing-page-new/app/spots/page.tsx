import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { SpotsExplorer } from "../components/SpotsExplorer";

export default function SpotsPage() {
  return (
    <>
      <Header />
      <main id="main" className="pt-16">
        <SpotsExplorer />
      </main>
      <Footer />
    </>
  );
}
