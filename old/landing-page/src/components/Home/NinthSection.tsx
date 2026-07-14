import ArrowsBar from '@/components/common/ArrowsBar';
import CommentBox from '@/components/common/CommentBox';
import { getTranslation, type Locale } from '@/utils/getDictionary';
import type { WithLocale } from '@/types/locale';
import { localizedPath } from '@/utils/localizedPath';

const NinthSection = ({ locale }: WithLocale) => {
  const { t } = getTranslation('home', locale);

  return (
    <section className="flexCenter flex-col items-center mt-16 md:mt-default-section-separator">
      <div className="custom-header-sm mb-14">{t('eighthSection.seeWhatYouCanDoEight')}</div>
      <div className="flex items-start overflow-x-auto flex-nowrap gap-6 w-full overflow-visible scrollbar-hide">
        <CommentBox locale={locale} content={t('ninthSection.comment1')} starsNumber={5} name={t('ninthSection.name1')} role={t('ninthSection.role1')} />
        <CommentBox locale={locale} content={t('ninthSection.comment2')} starsNumber={5} name={t('ninthSection.name2')} role={t('ninthSection.role2')} />
        <CommentBox locale={locale} content={t('ninthSection.comment3')} starsNumber={5} name={t('ninthSection.name3')} role={t('ninthSection.role3')} />
        <CommentBox locale={locale} content={t('ninthSection.comment1')} starsNumber={5} name={t('ninthSection.name1')} role={t('ninthSection.role1')} />
        <CommentBox locale={locale} content={t('ninthSection.comment2')} starsNumber={5} name={t('ninthSection.name2')} role={t('ninthSection.role2')} />
        <CommentBox locale={locale} content={t('ninthSection.comment3')} starsNumber={5} name={t('ninthSection.name3')} role={t('ninthSection.role3')} />
      </div>
      <ArrowsBar locale={locale} />
    </section>
  );
};

export default NinthSection;
