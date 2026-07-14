import { getTranslation, type Locale } from '@/utils/getDictionary';
import type { WithLocale } from '@/types/locale';
import { localizedPath } from '@/utils/localizedPath';
import { IMAGES } from '@/constants/images';
import Boxes from '@/components/common/Boxes';

const SecondSection = ({ locale }: WithLocale) => {
  const { t } = getTranslation('download', locale);

  return (
    <section className="relative mt-default-subpages-section-separator">
      <div className="flex items-center flex-col text-center">
        <div className="custom-small-header-subpages leading-tight md:w-auto">
          <h2>{t('secondSection.lookingForDevice')}</h2>
        </div>
        <div className="flex flex-col items-center text-center md:flex-row md:justify-center md:text-center md:mx-0 w-full h-full mt-10">
          <Boxes
            image={IMAGES.download.secondSection.ios}
            alt={t('secondSection.iosAlt')}
            title={t('secondSection.lookingDeviceIconText1')}
            content={t('secondSection.lookingDeviceIconText1Description')}
            imgWidth="w-8"
            imgHeight="h-8"
          />
          <Boxes
            image={IMAGES.download.secondSection.apple}
            alt={t('secondSection.appleAlt')}
            title={t('secondSection.lookingDeviceIconText2')}
            content={t('secondSection.lookingDeviceIconText2Description')}
            imgWidth="w-8"
            imgHeight="h-8"
          />
          <Boxes
            image={IMAGES.download.secondSection.android}
            alt={t('secondSection.androidAlt')}
            title={t('secondSection.lookingDeviceIconText3')}
            content={t('secondSection.lookingDeviceIconText3Description')}
            imgWidth="w-8"
            imgHeight="h-8"
          />
          <Boxes
            image={IMAGES.download.secondSection.android}
            alt={t('secondSection.androidAlt')}
            title={t('secondSection.lookingDeviceIconText4')}
            content={t('secondSection.lookingDeviceIconText4Description')}
            imgWidth="w-8"
            imgHeight="h-8"
          />
        </div>
      </div>
    </section>
  );
};

export default SecondSection;
