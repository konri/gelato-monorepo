import { getTranslation, type Locale } from '@/utils/getDictionary';
import type { WithLocale } from '@/types/locale';
import { localizedPath } from '@/utils/localizedPath';
import LinkButton from '@/components/common/LinkButton';
import ActivityHistoryVisual from '@/components/Home/ActivityHistoryVisual/ActivityHistoryVisual';
import FadeInOnVisible from '@/hooks/FadeInOnVisible';

const FifthSection = ({ locale }: WithLocale) => {
  const { t } = getTranslation('home', locale);

  return (
    <FadeInOnVisible className="mt-default-section-separator">
      <div className="white-box-shadow flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
        <div className="flex w-full flex-col px-2 xs:px-1 lg:max-w-[400px] lg:shrink-0">
          <h2
            className="fade-in-up-target text-left text-custom-48 leading-[1.1] text-custom-gray md:text-[36px] lg:text-custom-48"
            data-delay="200"
          >
            {t('fifthSection.easyAccessToHistory')}
          </h2>
          <p
            className="fade-in-up-target pt-custom-pt-8 text-custom-13 font-bold text-custom-gray-light"
            data-delay="400"
          >
            {t('fifthSection.historyDescription')}
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
        <ActivityHistoryVisual
          alt={t('fifthSection.activityHistoryMockupAlt')}
          className="fade-in-up-target shrink-0 lg:flex-1"
        />
      </div>
    </FadeInOnVisible>
  );
};

export default FifthSection;
