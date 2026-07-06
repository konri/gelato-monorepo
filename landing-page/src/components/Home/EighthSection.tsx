import { getTranslation, type Locale } from '@/utils/getDictionary';
import type { WithLocale } from '@/types/locale';
import { localizedPath } from '@/utils/localizedPath';
import LinkButton from '@/components/common/LinkButton';
import EighthSectionFeatureItem from '@/components/Home/EighthSectionFeatureItem/EighthSectionFeatureItem';
import Image from 'next/image';
import { IMAGES } from '@/constants/images';
import FadeInOnVisible from '@/hooks/FadeInOnVisible';

const EighthSection = ({ locale }: WithLocale) => {
  const { t } = getTranslation('home', locale);

  return (
    <FadeInOnVisible className="relative mt-10 w-[calc(100%+3rem)] max-w-none -mx-6 md:mt-default-section-separator lg:-mx-12 lg:w-[calc(100%+6rem)] xl:-mx-6 xl:w-[calc(100%+3rem)] 2xl:mx-0 2xl:w-full">
      <div className="flex w-full flex-col overflow-hidden rounded-3xl bg-white shadow-[0px_8px_32px_rgba(0,0,0,0.1)] md:min-h-[560px] md:flex-row">
          <div className="relative h-[min(360px,58vw)] w-full shrink-0 md:h-auto md:min-h-[560px] md:w-[42%] lg:w-[40%]">
            <Image
              src={IMAGES.home.eighthSection.baristaPhoto}
              alt={t('eighthSection.baristaPhotoAlt')}
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 512px, 40vw"
              priority={false}
            />
          </div>

          <div className="flex flex-1 flex-col justify-center px-8 py-10 xs:px-10 md:px-12 md:py-12 lg:px-16 xl:px-20">
            <h2 className="fade-in-up-target text-custom-36 leading-[1.1] text-custom-gray lg:text-custom-48" data-delay="200">
              {t('eighthSection.focusOnBusiness')}
            </h2>
            <p
              className="fade-in-up-target pt-custom-pt-8 text-custom-13 font-bold text-custom-gray-light md:max-w-[520px]"
              data-delay="400"
            >
              {t('eighthSection.automateEverything')}
            </p>
            <div className="fade-in-up-target mt-8" data-delay="600">
              <LinkButton
                href={localizedPath(locale, '/download')}
                title={t('eighthSection.registerNow')}
                variant="btn_white_no_padding"
                border="border-2 border-gray-500"
              />
            </div>

            <div className="mt-10 md:mt-12">
              <EighthSectionFeatureItem
                iconSrc={IMAGES.home.eighthSection.hand}
                iconAlt={t('eighthSection.handAlt')}
                title={t('eighthSection.simpleSolutionBigBenefits')}
                content={t('eighthSection.simpleSolutionContent')}
                showDivider
                delay="800"
              />
              <EighthSectionFeatureItem
                iconSrc={IMAGES.home.eighthSection.play}
                iconAlt={t('eighthSection.playAlt')}
                title={t('eighthSection.loyaltyPlatform')}
                content={t('eighthSection.loyaltyPlatformContent')}
                showDivider
                delay="1000"
              />
              <EighthSectionFeatureItem
                iconSrc={IMAGES.home.eighthSection.clock}
                iconAlt={t('eighthSection.clockAlt')}
                title={t('eighthSection.saveTimeIncreaseProfits')}
                content={t('eighthSection.saveTimeContent')}
                delay="1200"
              />
            </div>
          </div>
      </div>
    </FadeInOnVisible>
  );
};

export default EighthSection;
