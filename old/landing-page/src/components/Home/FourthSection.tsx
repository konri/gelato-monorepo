import { getTranslation, type Locale } from '@/utils/getDictionary';
import type { WithLocale } from '@/types/locale';
import { localizedPath } from '@/utils/localizedPath';
import FourthSectionBoxes from '@/components/Home/FourthSectionBoxes';

const FourthSection = ({ locale }: WithLocale) => {
  const { t } = getTranslation('home', locale);

  return (
    <section className="flexCenter relative flex-col mt-default-section-separator">
      <div className="text-secondary px-6 sm:px-0">{t('fourthSection.amazingFeatures')}</div>
      <div className="custom-header-xs xs:custom-header-sm md:custom-header">{t('fourthSection.seeWhatYouCanDo')}</div>
      <FourthSectionBoxes locale={locale} />
    </section>
  );
};

export default FourthSection;