import AnimatedText from '@/components/common/AnimatedText';
import FadeInOnVisible from '@/hooks/FadeInOnVisible';
import { getTranslation, type Locale } from '@/utils/getDictionary';
import type { WithLocale } from '@/types/locale';
import { localizedPath } from '@/utils/localizedPath';
import { IMAGES } from '@/constants/images';
import Image from 'next/image';

const ThirdSection = ({ locale }: WithLocale) => {
  const { t } = getTranslation('features', locale);
  const { t: tHome } = getTranslation('home', locale);

  return (
    <FadeInOnVisible className="relative mt-default-section-separator">
      <div className="flex flex-col items-center text-center">
        <div className="flex flex-row justify-center">
          <div className="pt-2 text-custom-13 font-bold uppercase text-custom-gray-light md:w-auto">
            {t('subtitleThirdSection')}
          </div>
        </div>
        <div className="custom-small-header-subpages fade-in-up-target md:w-auto" data-delay="200">
          <AnimatedText text1={t('titleThirdSection')} text2="" text3="" />
        </div>
        <div className="relative mt-8 flex w-full justify-center md:mt-12">
          <Image
            src={IMAGES.features.thirdSection.setupMockup}
            alt={tHome('thirdSection.merchantRegisterPhoneAlt')}
            className="h-auto w-full max-w-[min(100%,360px)]"
            width={704}
            height={966}
            sizes="(max-width: 768px) 75vw, 360px"
          />
        </div>
      </div>
    </FadeInOnVisible>
  );
};

export default ThirdSection;
