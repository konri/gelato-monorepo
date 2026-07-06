import FadeInOnVisible from '@/hooks/FadeInOnVisible';
import LinkButton from '@/components/common/LinkButton';
import { IMAGES } from '@/constants/images';
import { getTranslation, type Locale } from '@/utils/getDictionary';
import type { WithLocale } from '@/types/locale';
import { localizedPath } from '@/utils/localizedPath';
import Image from 'next/image';

const FifthSection = ({ locale }: WithLocale) => {
  const { t } = getTranslation('features', locale);
  const { t: tHome } = getTranslation('home', locale);

  return (
    <FadeInOnVisible className="relative mx-auto mt-default-section-separator flex max-w-[1248px] flex-col py-8 dark-blue-box-background md:flex-row">
      <div className="flex flex-col items-center md:flex-row md:items-stretch">
        <div className="w-full px-8 py-10 text-center md:w-1/2 md:px-12 md:text-start lg:px-16">
          <div className="flex flex-col items-center md:items-start">
            <Image
              src={IMAGES.features.fifthSection.consumerAppMockup}
              alt={tHome('tenthSection.appLoginMockupAlt')}
              className="h-auto w-full max-w-[240px] sm:max-w-[280px]"
              width={896}
              height={1024}
              sizes="(max-width: 768px) 55vw, 280px"
            />
            <div className="fade-in-line pt-6 bold-36 text-white xs:bold-36 md:bold-36 lg:bold-36">
              {t('fifthSectionTitleLeft')}
            </div>
            <div className="mb-8 mt-8 flex text-gray-main-font">{t('fifthSectionSubtitleLeft')}</div>
            <LinkButton
              href={localizedPath(locale, '/download')}
              title={t('fifthSectionButtonLeft')}
              variant="btn_white_feature_page"
              border="border-2 border-white"
              height="py-3"
              paddingX="px-7"
            />
          </div>
        </div>

        <div className="w-[80%] border-t-4 border-[#748FB51A] px-8 py-10 text-center md:w-1/2 md:border-l-4 md:border-t-0 md:px-12 md:text-start lg:px-16">
          <div className="flex flex-col items-center md:items-start">
            <Image
              src={IMAGES.features.fifthSection.merchantAppMockup}
              alt={tHome('thirdSection.merchantLoyaltyPhoneAlt')}
              className="h-auto w-full max-w-[240px] sm:max-w-[280px]"
              width={559}
              height={1024}
              sizes="(max-width: 768px) 55vw, 280px"
            />
            <div className="fade-in-line pt-6 bold-36 text-white xs:bold-36 md:bold-36 lg:bold-36">
              {t('fifthSectionTitleRight')}
            </div>
            <div className="mb-8 mt-8 flex text-gray-main-font">{t('fifthSectionSubtitleRight')}</div>
            <LinkButton
              href={localizedPath(locale, '/contact')}
              title={t('fifthSectionButtonRight')}
              variant="btn_white_feature_page"
              border="border-2 border-white"
              height="py-3"
              paddingX="px-7"
            />
          </div>
        </div>
      </div>
    </FadeInOnVisible>
  );
};

export default FifthSection;
