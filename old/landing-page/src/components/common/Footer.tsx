'use client';

import Image from 'next/image';
import Link from 'next/link';
import { IMAGES } from '@/constants/images';
import { NAV_LINKS_FOOTER } from '@/constants';
import { getTranslation, type Locale } from '@/utils/getDictionary';
import { localizedPath } from '@/utils/localizedPath';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';

type FooterProps = {
  locale: Locale;
};

const Footer = ({ locale }: FooterProps) => {
  const { t: tFooter } = getTranslation('footer', locale);
  const { t: tNav } = getTranslation('navbar', locale);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-16 flex flex-col py-8">
      <div className="flex flex-col md:flex-row md:justify-between">
        <div className="flex w-full flex-col items-center space-y-6 md:w-1/3 md:items-start">
          <Image
            src={IMAGES.common.logoOrange}
            alt={tFooter('footer.logoAlt')}
            width={99}
            height={26}
            className="mx-auto h-auto w-52 sm:mx-0 sm:w-60 md:w-72"
          />
          <p className="px-4 text-center text-gray-600 sm:px-0 sm:text-left md:pr-10">{tFooter('footer.joinMillions')}</p>
          <div className="flex gap-4">
            <a href="https://play.google.com/store/apps/details?id=com.bonapka.bonapka" target="_blank" rel="noopener noreferrer">
              <Image
                src={IMAGES.home.footer.googlePlay}
                alt={tFooter('footer.googlePlayAlt')}
                width={120}
                height={40}
                className="w-28 md:w-36"
              />
            </a>
            <a href="https://apps.apple.com/app/bonapka/id6443428882" target="_blank" rel="noopener noreferrer">
              <Image
                src={IMAGES.home.footer.appStore}
                alt={tFooter('footer.appStoreAlt')}
                width={120}
                height={40}
                className="w-28 md:w-36"
              />
            </a>
          </div>
        </div>

        <div className="hidden md:flex md:w-2/3 md:justify-end">
          <nav className="flex items-end">
            <ul className="flex items-center gap-8">
              {NAV_LINKS_FOOTER.map((link) => (
                <li key={link.key}>
                  <Link
                    href={localizedPath(locale, link.path)}
                    className="text-gray-600 transition hover:font-semibold hover:text-main-orange-color"
                  >
                    {tNav(link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <hr className="my-8 border-gray-200" />

      <div className="max-container flex flex-col items-center gap-4 md:flex-row md:justify-between">
        <p className="text-center text-sm text-gray-500 md:text-left">
          {tFooter('footer.copyright', { year: currentYear })}
        </p>

        <div className="flex items-center gap-6">
          <div className="flex gap-4">
            <a href="https://www.facebook.com/bonapka" target="_blank" rel="noopener noreferrer">
              <Image src={IMAGES.home.footer.facebook} alt={tFooter('footer.facebookAlt')} width={16} height={16} className="hover:opacity-75" />
            </a>
            <a href="https://x.com/bonapka" target="_blank" rel="noopener noreferrer">
              <Image src={IMAGES.home.footer.twitter} alt={tFooter('footer.twitterAlt')} width={16} height={16} className="hover:opacity-75" />
            </a>
            <a href="https://www.instagram.com/bonapka" target="_blank" rel="noopener noreferrer">
              <Image src={IMAGES.home.footer.instagram} alt={tFooter('footer.instagramAlt')} width={16} height={16} className="hover:opacity-75" />
            </a>
          </div>
          <LanguageSwitcher locale={locale} menuPlacement="up" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
