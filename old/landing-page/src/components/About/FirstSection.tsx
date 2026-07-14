import { getTranslation, type Locale } from '@/utils/getDictionary';
import type { WithLocale } from '@/types/locale';
import { localizedPath } from '@/utils/localizedPath';
import FadeInOnVisible from '@/hooks/FadeInOnVisible';
import AnimatedText from '@/components/common/AnimatedText';
import { IMAGES } from '@/constants/images';
import Image from 'next/image';

const FirstSection = ({ locale }: WithLocale) => {
  const { t } = getTranslation('about', locale);
  const { t: tHome } = getTranslation('home', locale);

  return (
    <FadeInOnVisible className="relative mt-default-subpages-section-separator">
      <div className="flex flex-col items-center text-center">
        <div className="custom-small-header-subpages fade-in-up-target w-full max-w-full px-2 text-center" data-delay="200">
          <AnimatedText text1={t('title1')} text2={t('title2')} text3={t('')} />
        </div>
      </div>
      <div className="relative mt-8 flex w-full min-w-0 justify-center overflow-hidden px-2 md:mt-10 md:px-0">
        <Image
          src={IMAGES.about.firstSection.figures8}
          alt={tHome('firstSection.figuresAlt')}
          className="h-auto w-full max-w-full object-contain sm:max-w-[min(100%,480px)]"
          width={548}
          height={626}
          sizes="(max-width: 768px) 85vw, 480px"
        />
      </div>
    </FadeInOnVisible>
  );
};

export default FirstSection;
