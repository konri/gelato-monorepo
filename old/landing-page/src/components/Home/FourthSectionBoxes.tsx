import { getTranslation, type Locale } from '@/utils/getDictionary';
import type { WithLocale } from '@/types/locale';
import { localizedPath } from '@/utils/localizedPath';
import FeatureShowcaseRow from '@/components/Home/FeatureShowcaseRow/FeatureShowcaseRow';
import { IMAGES } from '@/constants/images';

const FourthSectionBoxes = ({ locale }: WithLocale) => {
  const { t } = getTranslation('home', locale);

  return (
    <>
      <FeatureShowcaseRow
        imageSrc={IMAGES.home.fourthSection.qrScanning}
        imageAlt={t('fourthSection.qrScanningAlt')}
        imageWidth={680}
        imageHeight={682}
        title={t('fourthSection.scanQRAddPointsBuildLoyalty')}
        description={t('fourthSection.scanQRDescription')}
        buttonText={t('fourthSection.seeHowItWorks')}
      />
      <FeatureShowcaseRow
        imageSrc={IMAGES.home.fourthSection.couponsAndRewards}
        imageAlt={t('fourthSection.couponsAndRewardsAlt')}
        imageWidth={680}
        imageHeight={682}
        title={t('fourthSection.sellVouchersAsGifts')}
        description={t('fourthSection.vouchersDescription')}
        buttonText={t('fourthSection.scheduleDemoWithUs')}
        reverse
      />
      <FeatureShowcaseRow
        imageSrc={IMAGES.home.fourthSection.stampCard}
        imageAlt={t('fourthSection.stampCardAlt')}
        imageWidth={680}
        imageHeight={682}
        title={t('fourthSection.gamificationDriveBusiness')}
        description={t('fourthSection.gamificationDescription')}
        buttonText={t('fourthSection.downloadApp')}
      />
    </>
  );
};

export default FourthSectionBoxes;
