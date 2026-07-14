'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { IMAGES } from '@/constants/images';
import { NAV_LINKS } from '@/constants';
import { getTranslation, type Locale } from '@/utils/getDictionary';
import { localizedPath, stripLocalePrefix } from '@/utils/localizedPath';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';

type NavbarProps = {
  locale: Locale;
};

const Navbar = ({ locale }: NavbarProps) => {
  const { t } = getTranslation('navbar', locale);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = stripLocalePrefix(usePathname());

  const isLinkActive = (path: string) => pathname === path;

  return (
    <nav className="relative z-30 flex items-center justify-between py-5 max-container">
      <Link href={localizedPath(locale, '/')}>
        <Image
          src={IMAGES.common.logoOrange}
          alt={t('navbar.logoAlt')}
          width={99}
          height={26}
          className="h-auto w-24 sm:w-32 md:w-40 lg:w-48"
          priority
        />
      </Link>

      <ul className="hidden items-center text-base text-gray-600 lg:flex lg:gap-6 xl:gap-8">
        {NAV_LINKS.map((link) => {
          const href = localizedPath(locale, link.path);
          const isActive = isLinkActive(link.path);
          return (
            <li key={link.key}>
              <Link
                href={href}
                className={`transition-colors duration-300 hover:font-semibold hover:text-main-orange-color ${
                  isActive ? 'font-bold text-main-orange-color' : ''
                }`}
              >
                {t(link.label)}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="hidden items-center gap-2 pl-2 lg:flex">
        <LanguageSwitcher locale={locale} />
        <Link
          href={localizedPath(locale, '/download')}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-main-orange-color px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-95"
        >
          {t('navbar.register')}
        </Link>
      </div>

      <button
        type="button"
        className="lg:hidden"
        onClick={() => setIsMenuOpen((prev) => !prev)}
        aria-label={isMenuOpen ? t('navbar.closeMenu') : t('navbar.openMenu')}
      >
        <Image
          src={isMenuOpen ? IMAGES.common.close : IMAGES.common.menu}
          alt={isMenuOpen ? t('navbar.closeMenu') : t('navbar.openMenu')}
          width={32}
          height={32}
          className="cursor-pointer"
        />
      </button>

      {isMenuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-between bg-white p-6 shadow-lg">
          <div className="flex w-full items-center justify-between">
            <Link href={localizedPath(locale, '/')} onClick={() => setIsMenuOpen(false)}>
              <Image
                src={IMAGES.common.logoOrange}
                alt={t('navbar.logoAlt')}
                width={99}
                height={26}
                className="h-auto w-24 sm:w-32"
                priority
              />
            </Link>
            <button type="button" onClick={() => setIsMenuOpen(false)} aria-label={t('navbar.closeMenu')}>
              <Image src={IMAGES.common.close} alt={t('navbar.closeMenu')} width={32} height={32} className="cursor-pointer" />
            </button>
          </div>

          <ul className="flex flex-col items-center gap-6 py-16 text-2xl text-gray-600">
            {NAV_LINKS.map((link) => (
              <li key={link.key}>
                <Link
                  href={localizedPath(locale, link.path)}
                  className={`transition-colors hover:font-semibold hover:text-main-orange-color ${
                    isLinkActive(link.path) ? 'font-bold text-main-orange-color' : ''
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t(link.label)}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex flex-col items-center gap-6">
            <LanguageSwitcher locale={locale} onLanguageSelect={() => setIsMenuOpen(false)} />
            <Link
              href={localizedPath(locale, '/download')}
              onClick={() => setIsMenuOpen(false)}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-main-orange-color px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-95"
            >
              {t('navbar.register')}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
