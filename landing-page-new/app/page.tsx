import type { Metadata } from "next";
import { Header } from "./components/Header";
import {
  Hero,
  Categories,
  HowItWorks,
  Loyalty,
  Features,
  AppSection,
  Teaser,
  BottomCta,
} from "./components/LandingSections";
import { Footer } from "./components/Footer";
import { RewardsGallery } from "./components/rewards/RewardsGallery";
import { BASE_OPEN_GRAPH } from "./lib/seo";

// Title and description come from the root layout (PL). A page-level
// openGraph replaces the layout's, so the defaults are spread in with the URL.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { ...BASE_OPEN_GRAPH, url: "/" },
};

export default function Home() {
  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <Categories />
        <HowItWorks />
        <Loyalty />
        <RewardsGallery />
        <Features />
        <AppSection />
        <Teaser />
        <BottomCta />
      </main>
      <Footer />
    </>
  );
}
