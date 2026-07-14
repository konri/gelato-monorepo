import { getTranslation, type Locale } from '@/utils/getDictionary';
import type { WithLocale } from '@/types/locale';
import { localizedPath } from '@/utils/localizedPath';
import Boxes from '@/components/common/Boxes';
import { IMAGES } from '@/constants/images';
import MerchantPromoBanner from '@/components/Home/MerchantPromoBanner/MerchantPromoBanner';

const ThirdSection = ({ locale }: WithLocale) => {
  const { t } = getTranslation('home', locale);

  return (
    <section className="mt-default-section-separator">
      {/* Header */}
      <div className="flex items-center flex-col text-center">
        <div className="text-secondary text-lg">{t('thirdSection.startEarningIn4Steps')}</div>
        <div className="text-[#272E35] text-[48px]">
          <h2>{t('thirdSection.simpleStartFastResults')}</h2>
        </div>
      </div>

      {/* Boxes */}
      <div className="flex flex-col items-center text-center md:flex-row md:justify-center md:text-center md:mx-0 w-full h-full mt-10">
        <Boxes
          image={IMAGES.home.thirdSection.laptopIcon}
          alt={t('thirdSection.laptopIconAlt')}
          stepNumber={1}
          title={t('thirdSection.step1Title')}
          content={t('thirdSection.step1Content')}
          stepLabel={t('thirdSection.step')}
          boxHeight="md:h-[300px]"
        />
        <Boxes
          image={IMAGES.home.thirdSection.cloudIcon}
          alt={t('thirdSection.cloudIconAlt')}
          stepNumber={2}
          title={t('thirdSection.step2Title')}
          content={t('thirdSection.step2Content')}
          stepLabel={t('thirdSection.step')}
          boxHeight="md:h-[300px]"
        />
        <Boxes
          image={IMAGES.home.thirdSection.globeIcon}
          alt={t('thirdSection.globeIconAlt')}
          stepNumber={3}
          title={t('thirdSection.step3Title')}
          content={t('thirdSection.step3Content')}
          stepLabel={t('thirdSection.step')}
          boxHeight="md:h-[300px]"
        />
        <Boxes
          image={IMAGES.home.thirdSection.chartIcon}
          alt={t('thirdSection.chartIconAlt')}
          stepNumber={4}
          title={t('thirdSection.step4Title')}
          content={t('thirdSection.step4Content')}
          stepLabel={t('thirdSection.step')}
          boxHeight="md:h-[300px]"
        />
      </div>
      <MerchantPromoBanner
        title={t('thirdSection.merchantPromoTitle')}
        cta={t('thirdSection.merchantPromoCta')}
        ariaLabel={t('thirdSection.merchantPromoAriaLabel')}
        logoAlt={t('thirdSection.merchantLogoAlt')}
        registerPhoneAlt={t('thirdSection.merchantRegisterPhoneAlt')}
        loyaltyPhoneAlt={t('thirdSection.merchantLoyaltyPhoneAlt')}
      />
    </section>
  );
};

export default ThirdSection;
