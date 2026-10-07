"use client";

import { useI18n } from "../../../i18n/I18nProvider";
import { LoodlyMark } from "../../brand/LoodlyMark";
import { BusinessLeadForm } from "../BusinessLeadForm";
import { CONTACT, CONTACT_ANCHOR } from "../contact";
import { FOCUS_RING, SECTION_ANCHOR } from "../ui";

/**
 * Closing section: the request form (saved by the backend and listed in the
 * super admin panel), with the sales email as a fallback line underneath.
 */
export function ContactCta() {
  const { t } = useI18n();
  const { email } = CONTACT;
  // Only the subject goes into the URL — never any personal data.
  const mailto = email
    ? `mailto:${email}?subject=${encodeURIComponent(t("business.contact.mail_subject"))}`
    : "";

  return (
    <section
      id={CONTACT_ANCHOR}
      aria-labelledby="contact-title"
      className={`bg-cream py-20 sm:py-24 ${SECTION_ANCHOR}`}
    >
      <div className="mx-auto max-w-3xl px-5">
        <div className="relative overflow-hidden rounded-[2rem] border border-berry/10 bg-white px-5 py-8 shadow-xl shadow-berry/10 sm:p-12">
          <div aria-hidden className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-strawberry/15 blur-2xl" />
          <div aria-hidden className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-mango/15 blur-2xl" />
          <div className="relative">
            <div className="text-center">
              <LoodlyMark className="mx-auto h-14 w-auto" />
              <h2 id="contact-title" className="mt-5 text-balance text-3xl font-black tracking-tight text-espresso sm:text-4xl">
                {t("business.contact.title")}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-lg leading-relaxed text-espresso/70">{t("business.contact.body")}</p>
            </div>

            <div className="mt-10">
              <BusinessLeadForm fallbackEmail={email} fallbackHref={mailto} />
            </div>

            {email ? (
              <p className="mt-8 text-center text-sm leading-6 text-espresso/70">
                {t("business.contact.or_email")}{" "}
                <a href={mailto} className={`break-all font-semibold text-berry underline underline-offset-2 ${FOCUS_RING}`}>
                  {email}
                </a>
                .
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
