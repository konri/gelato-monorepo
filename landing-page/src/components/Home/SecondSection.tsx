import { getTranslation, type Locale } from '@/utils/getDictionary';
import type { WithLocale } from '@/types/locale';
import { localizedPath } from '@/utils/localizedPath';
import Image from 'next/image';
import LinkButton from '@/components/common/LinkButton';
import FadeInOnVisible from '@/hooks/FadeInOnVisible';
import { IMAGES } from '@/constants/images';

const SecondSection = ({ locale }: WithLocale) => {
  const { t } = getTranslation('home', locale);

  return (
    <FadeInOnVisible className="mx-auto mt-8 w-full md:mt-default-section-separator">
      <div className="flex flex-col-reverse gap-8 rounded-[24px] bg-white p-8 shadow-[0px_8px_32px_rgba(0,0,0,0.1)] md:flex-row md:items-center md:gap-10 md:p-10 lg:gap-16">
        <div className="flex flex-1 items-center justify-center md:justify-start">
          <Image
            src={IMAGES.home.secondSection.loyaltyCardsPreview}
            alt={t('secondSection.loyaltyCardsAlt')}
            className="block h-auto w-full max-w-[520px]"
            width={974}
            height={576}
            sizes="(max-width: 768px) 100vw, min(520px, 50vw)"
          />
        </div>

        <div className="flex flex-1 flex-col gap-4 md:gap-5">
          <h2 className="text-4xl font-semibold leading-tight text-[#272E35] md:text-[40px]">
            {t('secondSection.allInOneApp')}
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-gray-500">
            {t('secondSection.loyaltyPointsAndVouchers')}
          </p>
          <LinkButton
            href={localizedPath(locale, '/contact')}
            title={t('secondSection.scheduleOnlineDemo')}
            variant="btn_white_home_page"
            border="border-2 border-gray-500"
            className="!ml-0 w-fit rounded-full bg-white"
            paddingX="px-6"
            height="py-3"
          />
        </div>
      </div>
    </FadeInOnVisible>
  );
};

export default SecondSection;
