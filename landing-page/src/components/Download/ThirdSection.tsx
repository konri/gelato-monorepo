import { getTranslation, type Locale } from '@/utils/getDictionary';
import type { WithLocale } from '@/types/locale';
import { localizedPath } from '@/utils/localizedPath';
import CommentBox from '@/components/common/CommentBox';
import ArrowsBar from '@/components/common/ArrowsBar';

const ThirdSection = ({ locale }: WithLocale) => {
  const { t } = getTranslation('download', locale);

  return (
    <section className="flexCenter flex-col items-center mt-16 md:mt-default-section-separator">
      <div className="custom-small-header-subpages leading-tight md:w-auto mb-14">
        <h2>{t('thirdSection.whatPeopleAreSaying')}</h2>
      </div>
      <div className="flex items-start overflow-x-auto flex-nowrap gap-6 w-full overflow-visible scrollbar-hide">
        <CommentBox locale={locale} content={t('thirdSection.comment1')} starsNumber={5} name={t('thirdSection.name1')} role={t('thirdSection.role1')} />
        <CommentBox locale={locale} content={t('thirdSection.comment2')} starsNumber={5} name={t('thirdSection.name2')} role={t('thirdSection.role2')} />
        <CommentBox locale={locale} content={t('thirdSection.comment3')} starsNumber={5} name={t('thirdSection.name3')} role={t('thirdSection.role3')} />
        <CommentBox locale={locale} content={t('thirdSection.comment1')} starsNumber={5} name={t('thirdSection.name1')} role={t('thirdSection.role1')} />
        <CommentBox locale={locale} content={t('thirdSection.comment2')} starsNumber={5} name={t('thirdSection.name2')} role={t('thirdSection.role2')} />
        <CommentBox locale={locale} content={t('thirdSection.comment3')} starsNumber={5} name={t('thirdSection.name3')} role={t('thirdSection.role3')} />
      </div>
      <ArrowsBar locale={locale} />
    </section>
  );
};

export default ThirdSection;
