import LinkButton from '@/components/common/LinkButton';
import AnimatedText from '@/components/common/AnimatedText';
import Image from 'next/image';
import { IMAGES } from '@/constants/images';
import { getTranslation, type Locale } from '@/utils/getDictionary';
import type { WithLocale } from '@/types/locale';
import { localizedPath } from '@/utils/localizedPath';

const LeftSection = ({ locale }: WithLocale) => {
  const { t } = getTranslation('home', locale);
  return (
    <div className="flex flex-col text-center pt-10 px-4 max:xs:mx-12 xs:px-12 sm:px-6 md:px-8 lg:w-full lg:px-0 lg:text-left lg:h-[600px] lg:py-2">
      <div className="mb-6 text-gray-main-font font-semibold">{t('firstSection.freeTrial30Days')}</div>
      <AnimatedText
        text1={t('firstSection.increaseLoyalty')}
        text2={t('firstSection.customersAnd')}
        text3={t('firstSection.revenueWithApp')}
      />
      <div className="flex mx-4 mb-8 mt-8 text-gray-main-font lg:mx-0">
        {t('firstSection.joinPlatform')}
        <br />
        {t('firstSection.buildRelationships')}
      </div>
      <div className="flex flex-col justify-center items-center sm:flex-row space-y-4 sm:space-y-0 sm:space-x-0">
        <LinkButton
          href={localizedPath(locale, '/download')}
          title={t('firstSection.tryNow')}
          variant="btn_orange_home_page_mobile"
          paddingX="px-4"
        />
        <LinkButton
          icon={IMAGES.home.firstSection.arrowButton}
          iconAlt={t('firstSection.arrowButtonAlt')}
          href={localizedPath(locale, '/features')}
          title={t('firstSection.seeDemo')}
          variant="btn_white_home_page"
          border="border-2 border-gray-500"
          height="py-3"
          paddingX="px-7"
          iconClassName="w-6 h-6"
        />
      </div>
    </div>
  );
};

const RightSection = ({ locale }: WithLocale) => {
  const { t } = getTranslation('home', locale);
  return (
    <div className="flex w-full justify-center overflow-visible pt-10 lg:justify-end lg:pt-6 lg:pb-4">
      <div className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[360px] lg:max-w-[480px] xl:max-w-[520px] lg:-translate-x-10 lg:-translate-y-6 xl:-translate-x-14 xl:-translate-y-8">
        <Image
          className="block h-auto w-full"
          alt={t('firstSection.figuresAlt')}
          src={IMAGES.home.firstSection.appHeroMockup}
          width={548}
          height={626}
          sizes="(max-width: 639px) 280px, (max-width: 1023px) 360px, 520px"
          priority
        />
      </div>
    </div>
  );
};

const FirstSection = ({ locale }: WithLocale) => {
  return (
    <section className="relative flex flex-col justify-center items-center max-container overflow-x-clip overflow-y-visible md:py-2 lg:mt-28 lg:flex-row lg:items-center lg:py-4 pb-2">
      <LeftSection locale={locale} />
      <RightSection locale={locale} />
    </section>
  );
};

export default FirstSection;
