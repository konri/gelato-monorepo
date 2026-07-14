import { getTranslation, type Locale } from '@/utils/getDictionary';
import type { WithLocale } from '@/types/locale';
import { localizedPath } from '@/utils/localizedPath';
import FadeInOnVisible from '@/hooks/FadeInOnVisible';
import AnimatedText from '@/components/common/AnimatedText';
import LinkButton from '@/components/common/LinkButton';
import { IMAGES } from '@/constants/images';
import Image from 'next/image';

const FirstSection = ({ locale }: WithLocale) => {
  const { t } = getTranslation('features', locale);
  const { t: tHome } = getTranslation('home', locale);

  return (
    <FadeInOnVisible className="relative mt-default-subpages-section-separator">
      <div className="flex flex-col items-center text-center">
        <div className="custom-small-header-subpages fade-in-up-target md:w-auto" data-delay="200">
          <AnimatedText text1={t('title1')} text2={t('title2')} text3={t('')} />
        </div>
        <div className="mx-4 mb-8 mt-8 flex text-gray-main-font lg:mx-0">{t('subtitle')}</div>
        <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-0 sm:space-y-0">
          <LinkButton href={localizedPath(locale, '/download')} title={t('button1')} variant="btn_orange_home_page_mobile" paddingX="px-4" />
          <LinkButton
            href={localizedPath(locale, '/contact')}
            icon={IMAGES.home.firstSection.arrowButton}
            title={t('button2')}
            variant="btn_white_home_page"
            border="border-2 border-gray-500"
            height="py-3"
            paddingX="px-7"
          />
        </div>
      </div>
      <div className="relative mt-10 flex w-full justify-center md:mt-14">
        <Image
          src={IMAGES.features.firstSection.heroMockup}
          alt={tHome('fourthSection.couponsAndRewardsAlt')}
          className="h-auto w-full max-w-[min(100%,480px)]"
          width={680}
          height={682}
          sizes="(max-width: 768px) 88vw, 480px"
          priority
        />
      </div>
    </FadeInOnVisible>
  );
};

export default FirstSection;
