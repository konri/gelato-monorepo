"use client";

import { BizHero } from "./sections/BizHero";
import { Story } from "./sections/Story";
import { Benefits } from "./sections/Benefits";
import { Team } from "./sections/Team";
import { BizRewards } from "./sections/BizRewards";
import { Integration } from "./sections/Integration";
import { Faq } from "./sections/Faq";
import { Pricing } from "./sections/Pricing";
import { ContactCta } from "./sections/ContactCta";

/**
 * `/for-business` — the B2B pitch.
 *
 * Order: what it is → benefits (value first) → how it works (Lottie story) → team & roles →
 * rewards → integration with the receipts/invoicing system → FAQ → pricing
 * (at the bottom, as the owner asked) → contact. Copy lives in
 * `public/locales/<locale>/business.json` (`t("business.*")`).
 */
export function BusinessPage() {
  return (
    <>
      <BizHero />
      <Benefits />
      <Story />
      <Team />
      <BizRewards />
      <Integration />
      <Faq />
      <Pricing />
      <ContactCta />
    </>
  );
}
