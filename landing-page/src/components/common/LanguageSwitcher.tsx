'use client';

import { useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { IMAGES } from '@/constants/images';
import { getTranslation, LOCALES, type Locale } from '@/utils/getDictionary';
import { localizedPath, stripLocalePrefix } from '@/utils/localizedPath';

type LanguageSwitcherProps = {
  locale: Locale;
  menuPlacement?: 'up' | 'down';
  onLanguageSelect?: () => void;
};

const flagMap: Record<Locale, string> = {
  pl: IMAGES.home.flags.pl,
  en: IMAGES.home.flags.en,
  es: IMAGES.home.flags.es,
  fr: IMAGES.home.flags.fr,
  de: IMAGES.home.flags.de,
  it: IMAGES.home.flags.it,
  ru: IMAGES.home.flags.ru,
};

const LanguageSwitcher = ({ locale, menuPlacement = 'down', onLanguageSelect }: LanguageSwitcherProps) => {
  const { t } = getTranslation('navbar', locale);
  const router = useRouter();
  const pathname = stripLocalePrefix(usePathname());
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (lang: Locale) => {
    document.cookie = `locale=${lang};path=/;max-age=31536000`;
    localStorage.setItem('i18nextLng', lang);
    router.push(localizedPath(lang, pathname));
    setIsOpen(false);
    onLanguageSelect?.();
  };

  const menuPositionClass =
    menuPlacement === 'up' ? 'absolute right-0 bottom-full mb-2' : 'absolute right-0 mt-2 lg:left-0 lg:right-auto';

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center gap-2 rounded-md bg-white px-1 py-2 text-gray-600 hover:bg-gray-100"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={t('navbar.selectLanguage')}
      >
        <Image
          src={IMAGES.common.arrowDown}
          alt={t('navbar.dropdownArrow')}
          width={16}
          height={16}
          className={`transform ${isOpen ? 'rotate-180' : ''}`}
        />
        <span className="text-sm">{t(`navbar.language.${locale}.short`)}</span>
        <Image
          src={flagMap[locale]}
          alt={t(`navbar.language.${locale}.flagAlt`)}
          width={24}
          height={24}
          style={{ width: 'auto', height: 'auto' }}
        />
      </button>

      {isOpen && (
        <div className={`${menuPositionClass} z-50 w-48 overflow-hidden rounded-md bg-white shadow-lg`}>
          {LOCALES.map((lang) => (
            <button
              key={lang}
              type="button"
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-gray-900 hover:bg-gray-100"
              onClick={() => handleSelect(lang)}
            >
              <Image
                src={flagMap[lang]}
                alt={t(`navbar.language.${lang}.flagAlt`)}
                width={24}
                height={24}
                style={{ width: 'auto', height: 'auto' }}
              />
              <span>{t(`navbar.language.${lang}.label`)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
