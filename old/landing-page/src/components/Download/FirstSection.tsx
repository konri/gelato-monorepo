import { getTranslation, type Locale } from '@/utils/getDictionary';
import type { WithLocale } from '@/types/locale';
import { localizedPath } from '@/utils/localizedPath';
import LinkButton from '@/components/common/LinkButton';
import CtaAppMockupVisual from '@/components/Home/CtaAppMockupVisual/CtaAppMockupVisual';
import Link from 'next/link';
import FadeInOnVisible from '@/hooks/FadeInOnVisible';
import AnimatedText from '@/components/common/AnimatedText';

const FirstSection = ({ locale }: WithLocale) => {
  const { t } = getTranslation('download', locale);
  const { t: tHome } = getTranslation('home', locale);

  return (
    <FadeInOnVisible className="relative mt-default-subpages-section-separator">
      <div className="flex flex-col items-center text-center">
        <div className="text-lg text-secondary">{t('firstSection.readyToUseEasy')}</div>
        <div className="custom-small-header-subpages fade-in-up-target whitespace-nowrap md:w-auto" data-delay="200">
          <AnimatedText text1={t('firstSection.downloadEasy')} text2="" text3="" />
        </div>
        <div className="flex flex-row justify-center">
          <div className="pt-2 text-custom-13 font-bold text-custom-gray-light md:w-auto">
            {t('firstSection.downloadingEasyTerms1')}{' '}
            <span className="text-main-orange-color">
              <Link href="/terms">{t('firstSection.downloadingEasyTerms2')}</Link>
            </span>{' '}
            {t('firstSection.downloadingEasyTerms3')}{' '}
            <span className="text-main-orange-color">
              <Link href="/privacy">{t('firstSection.downloadingEasyTerms4')}</Link>
            </span>
          </div>
        </div>
        <div className="mt-6 flex flex-row justify-center">
          <LinkButton
            href="https://apps.apple.com/app/bonapka/id6443428882"
            title={t('firstSection.downloadEasyButton')}
            variant="btn_orange"
          />
        </div>
      </div>
      <div className="flex justify-center pt-16 md:pt-24">
        <CtaAppMockupVisual
          alt={tHome('tenthSection.appLoginMockupAlt')}
          className="fade-in-up-target max-w-[min(100%,360px)] md:max-w-[400px]"
        />
      </div>
    </FadeInOnVisible>
  );
};

export default FirstSection;
