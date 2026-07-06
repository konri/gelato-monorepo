import Link from 'next/link';
import Image from 'next/image';
import { IMAGES } from '@/constants/images';
import { getTranslation, type Locale } from '@/utils/getDictionary';
import type { WithLocale } from '@/types/locale';
import { localizedPath } from '@/utils/localizedPath';

const NotFound = ({ locale }: WithLocale) => {
  const { t } = getTranslation('navbar', locale);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 text-center">
      <Link href={localizedPath(locale, '/')} className="mb-8">
        <Image
          src={IMAGES.common.logoOrange}
          alt={t('navbar.logoAlt')}
          width={99}
          height={26}
          style={{ width: 'auto', height: 'auto' }}
        />
      </Link>
      <h1 className="text-8xl font-bold text-main-orange-color">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-custom-gray">
        Strona nie znaleziona
      </h2>
      <p className="mt-2 text-custom-gray-light max-w-md">
        Strona, której szukasz, nie istnieje lub została przeniesiona.
      </p>
      <Link
        href={localizedPath(locale, '/')}
        className="mt-8 px-8 py-3 bg-main-orange-color text-white font-semibold rounded-[1vw] hover:opacity-90 transition-opacity"
      >
        Wróć na stronę główną
      </Link>
    </div>
  );
};

export default NotFound;
