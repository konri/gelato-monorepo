import { getTranslation, type Locale } from '@/utils/getDictionary';
import type { WithLocale } from '@/types/locale';
import { localizedPath } from '@/utils/localizedPath';
import LinkButton from '@/components/common/LinkButton';
import SeventhSectionRewardsVisual from '@/components/Home/SeventhSectionRewardsVisual/SeventhSectionRewardsVisual';
import FadeInOnVisible from '@/hooks/FadeInOnVisible';

const SeventhSection = ({ locale }: WithLocale) => {
  const { t } = getTranslation('home', locale);

  return (
    <FadeInOnVisible className="relative mt-10 overflow-hidden md:mt-default-section-separator">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[28%] top-[18%] h-[min(420px,70vw)] w-[min(520px,85vw)] rounded-full bg-[#F4D4D4] opacity-70 blur-[90px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[22%] top-[8%] h-[min(480px,75vw)] w-[min(560px,90vw)] rounded-full bg-[#F4D4D4] opacity-80 blur-[100px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[8%] bottom-[5%] h-[min(320px,50vw)] w-[min(400px,60vw)] rounded-full bg-[#E8B4B4] opacity-50 blur-[80px]"
      />

      <div className="relative z-10 flex w-full flex-col items-start lg:min-h-[520px] md:flex-row lg:items-center">
        <div className="mx-4 my-10 flex max-w-[500px] flex-col items-start md:my-20 md:max-w-[400px] md:justify-center">
          <div className="text-[12px] font-medium uppercase text-secondary">{t('sixthSection.amazingFunctions')}</div>
          <h2
            className="fade-in-up-target pt-2 text-left text-custom-36 leading-[1.1] text-custom-gray md:text-custom-36 lg:w-[380px] lg:text-custom-48"
            data-delay="200"
          >
            {t('seventhSection.neverShopWithoutRewards')}
          </h2>
          <p
            className="fade-in-up-target pt-custom-pt-8 text-custom-13 font-bold text-custom-gray-light md:w-[320px]"
            data-delay="400"
          >
            {t('seventhSection.qrCodeText')}
          </p>
          <div className="fade-in-up-target mt-8" data-delay="600">
            <LinkButton
              href={localizedPath(locale, '/features')}
              className="self-start"
              title={t('fifthSection.seeMore')}
              variant="btn_white_no_padding"
              border="border-2 border-gray-500"
            />
          </div>
        </div>

        <SeventhSectionRewardsVisual
          stampCardAlt={t('seventhSection.stampCardRewardAlt')}
          pointsCardAlt={t('seventhSection.merchantPointsAlt')}
          className="fade-in-up-target z-10 md:ml-auto md:flex-1"
        />
      </div>
    </FadeInOnVisible>
  );
};

export default SeventhSection;
