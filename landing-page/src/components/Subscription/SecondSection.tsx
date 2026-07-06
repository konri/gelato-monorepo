import { getTranslation, type Locale } from '@/utils/getDictionary';
import type { WithLocale } from '@/types/locale';
import { localizedPath } from '@/utils/localizedPath';
import FadeInOnVisible from '@/hooks/FadeInOnVisible';
import FrequentlyQuestionItem from '@/components/common/FrequentlyQuestionItem';
import ActivityHistoryVisual from '@/components/Home/ActivityHistoryVisual/ActivityHistoryVisual';

const SecondSection = ({ locale }: WithLocale) => {
  const { t } = getTranslation('subscription', locale);
  const { t: tHome } = getTranslation('home', locale);

  return (
    <FadeInOnVisible className="relative mx-auto mt-default-section-separator flex max-w-[1248px] flex-col items-center justify-center pb-[20%] dark-blue-box-background md:mb-[20%]">
      <div className="mt-default-section-separator flex max-w-[410px] flex-col items-center justify-center text-center text-white fade-in-line custom-small-header-subpages-white">
        {t('frequentlyAskedQuestions')}
      </div>
      <div className="mt-6 flex w-full flex-col flex-nowrap items-center justify-center md:flex-row md:flex-wrap md:justify-normal md:content-normal">
        <FrequentlyQuestionItem
          locale={locale}
          sectionTitle={t('theBasicQuestions')}
          questions={[t('question1Basics'), t('question2Basics'), t('question3Basics'), t('question4Basics')]}
          answers={[
            t('question1BasicsText'),
            t('question2BasicsText'),
            t('question3BasicsText'),
            t('question4BasicsText'),
          ]}
        />
        <FrequentlyQuestionItem
          locale={locale}
          sectionTitle={t('advancedQuestions')}
          questions={[
            t('question1Advanced'),
            t('question2Advanced'),
            t('question3Advanced'),
            t('question4Advanced'),
          ]}
          answers={[
            t('question1AdvancedText'),
            t('question2AdvancedText'),
            t('question3AdvancedText'),
            t('question4AdvancedText'),
          ]}
        />
        <FrequentlyQuestionItem
          locale={locale}
          sectionTitle={t('managedQuestions')}
          questions={[
            t('question1Managed'),
            t('question2Managed'),
            t('question3Managed'),
            t('question4Managed'),
          ]}
          answers={[
            t('question1ManagedText'),
            t('question2ManagedText'),
            t('question3ManagedText'),
            t('question4ManagedText'),
          ]}
        />
        <FrequentlyQuestionItem
          locale={locale}
          sectionTitle={t('frequentlyAskedQuestions')}
          questions={[
            t('question1Security'),
            t('question2Security'),
            t('question3Security'),
            t('question4Security'),
          ]}
          answers={[
            t('question1SecurityText'),
            t('question2SecurityText'),
            t('question3SecurityText'),
            t('question4SecurityText'),
          ]}
        />
      </div>
      <ActivityHistoryVisual
        alt={tHome('fifthSection.activityHistoryMockupAlt')}
        className="relative z-20 -mb-[20%] mt-10 w-full max-w-[800px] md:-mb-[46%]"
      />
    </FadeInOnVisible>
  );
};

export default SecondSection;
