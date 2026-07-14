import FadeInOnVisible from '@/hooks/FadeInOnVisible';
import { IMAGES } from '@/constants/images';
import ContactForm from '@/components/common/contactForm';
import Image from 'next/image';
import { getTranslation, type Locale } from '@/utils/getDictionary';
import type { WithLocale } from '@/types/locale';
import { localizedPath } from '@/utils/localizedPath';

const FirstSection = ({ locale }: WithLocale) => {
  const { t: tHome } = getTranslation('home', locale);

  return (
    <FadeInOnVisible className="relative mt-default-subpages-section-separator">
      <div className="flex w-full min-w-0 flex-col gap-10 overflow-x-hidden md:flex-row md:items-center md:gap-12 lg:gap-16">
        <div className="flex w-full min-w-0 items-center justify-center md:w-[45%] lg:w-[48%]">
          <Image
            src={IMAGES.home.secondSection.loyaltyCardsPreview}
            alt={tHome('secondSection.loyaltyCardsAlt')}
            className="h-auto w-full max-w-full object-contain md:max-w-[520px]"
            width={974}
            height={576}
            sizes="(max-width: 768px) 100vw, min(520px, 45vw)"
          />
        </div>
        <div className="flex w-full min-w-0 flex-1 flex-col">
          <ContactForm locale={locale} />
        </div>
      </div>
    </FadeInOnVisible>
  );
};

export default FirstSection;
