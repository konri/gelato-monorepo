import { getTranslation, type Locale } from '@/utils/getDictionary';
import type { WithLocale } from '@/types/locale';
import { localizedPath } from '@/utils/localizedPath';
import LinkButton from '@/components/common/LinkButton';
import CtaAppMockupVisual from '@/components/Home/CtaAppMockupVisual/CtaAppMockupVisual';
import FadeInOnVisible from '@/hooks/FadeInOnVisible';

const TenthSection = ({ locale }: WithLocale) => {
  const { t } = getTranslation('home', locale);

  return (
    <FadeInOnVisible className="relative mt-default-section-separator w-[calc(100%+3rem)] max-w-none overflow-visible -mx-6 py-6 md:py-10 lg:-mx-12 lg:w-[calc(100%+6rem)] xl:-mx-6 xl:w-[calc(100%+3rem)] 2xl:mx-0 2xl:w-full">
      <div className="flex flex-col overflow-visible rounded-3xl bg-[#2C353D] shadow-[0px_8px_32px_rgba(0,0,0,0.1)] md:min-h-[400px] md:flex-row md:items-stretch lg:min-h-[420px]">
        <div className="flex w-full flex-col items-center px-8 py-10 text-center xs:px-10 md:w-[52%] md:items-start md:px-12 md:py-12 md:text-left lg:w-1/2 lg:px-16 xl:px-20">
          <h2 className="fade-in-up-target bold-36 text-white xs:bold-52 md:bold-52 lg:bold-68" data-delay="200">
            {t('tenthSection.startWithBonapka')}
          </h2>
          <p className="fade-in-up-target mt-6 text-gray-main-font md:mt-5 lg:mt-8" data-delay="400">
            {t('tenthSection.applyAndUse')}
          </p>
          <div className="fade-in-up-target mt-8" data-delay="600">
            <LinkButton href={localizedPath(locale, '/download')} title={t('tenthSection.startNow')} variant="btn_orange_home_page" />
          </div>
        </div>

        <div className="relative z-10 flex w-full justify-center px-4 pb-2 md:w-[44%] md:justify-end md:px-0 md:pb-0 lg:w-[46%]">
          <CtaAppMockupVisual
            alt={t('tenthSection.appLoginMockupAlt')}
            className="fade-in-up-target relative z-10 w-full max-w-[min(100%,300px)] -mt-6 -mb-2 rotate-[-7deg] drop-shadow-[0_20px_50px_rgba(0,0,0,0.35)] xs:max-w-[320px] md:absolute md:right-6 md:top-[42%] md:max-w-[420px] md:-translate-y-1/2 md:-my-0 md:scale-[1.06] md:origin-center lg:right-10 lg:max-w-[460px] lg:top-[-3%] lg:scale-[1.08] xl:right-14 xl:max-w-[480px]"
          />
        </div>
      </div>
    </FadeInOnVisible>
  );
};

export default TenthSection;
