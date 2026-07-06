import { getTranslation, type Locale } from '@/utils/getDictionary';
import type { WithLocale } from '@/types/locale';
import { localizedPath } from '@/utils/localizedPath';
import FourthSectionBoxes from '@/components/Home/FourthSectionBoxes';

const FourthSection = ({ locale }: WithLocale) => {
  const { t } = getTranslation('home', locale);

  return (
    <section className="flexCenter relative mt-default-section-separator flex-col">
      <div className="px-6 text-secondary sm:px-0">{t('fourthSection.amazingFeatures')}</div>
      <div className="custom-header-xs xs:custom-header-sm md:custom-header">{t('fourthSection.seeWhatYouCanDo')}</div>
      <FourthSectionBoxes locale={locale} />
    </section>
  );
};

export default FourthSection;
