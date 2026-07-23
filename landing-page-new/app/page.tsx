import { Header } from "./components/Header";
import {
  Hero,
  Stats,
  Features,
  FlavorOfDay,
  HowItWorks,
  AppSection,
  BottomCta,
  Footer,
} from "./components/LandingSections";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Stats />
        <Features />
        <FlavorOfDay />
        <HowItWorks />
        <AppSection />
        <BottomCta />
      </main>
      <Footer />
    </>
  );
}
