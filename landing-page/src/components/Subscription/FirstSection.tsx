import { getTranslation, type Locale } from '@/utils/getDictionary';
import type { WithLocale } from '@/types/locale';
import { localizedPath } from '@/utils/localizedPath';
import PricingItem from '@/components/common/PricingItem';
import { IMAGES } from '@/constants/images';
import Button from '@/components/common/Button';
import LinkButton from '@/components/common/LinkButton';
import FadeInOnVisible from '@/hooks/FadeInOnVisible';
import AnimatedText from '@/components/common/AnimatedText';

const FirstSection = ({ locale }: WithLocale) => {
  const { t } = getTranslation('subscription', locale);

  return (
    <FadeInOnVisible className="relative mt-default-subpages-section-separator">
      <div className="flex items-center flex-col text-center">
        <div className="custom-small-header-subpages w-full max-w-full px-2 text-center fade-in-up-target" data-delay="200">
          <AnimatedText text1={t('chooseThePlan')} text2="" text3=""/>
        </div>
        <div className="flex flex-row justify-center">
          <div className="pt-2 md:w-auto text-custom-gray-light text-custom-13 font-bold">{t('payByMonth')}</div>
        </div>
        <div className="flex w-full min-w-0 flex-col items-stretch justify-center gap-4 mt-14 md:flex-row md:items-start md:justify-center md:gap-6 md:rounded-xl md:bg-[#f7f7f8]">
          <PricingItem
            locale={locale}
            plan={t('planBasic')}
            unit={t('priceUnit')}
            price={t('priceBasic')}
            time={t('priceTime')}
            description={t('priceBasicDescription')}
            buttonLabel={t('buttonBasic')}
            featuresText={t('seeFeatures')}
            featuresItems={[
              t('coreFeaturesBasicDescription'),
              t('coreFeaturesBasicDescription2'),
              t('coreFeaturesBasicDescription3'),
              t('coreFeaturesBasicDescription4'),
            ]}
          />
          <PricingItem
            locale={locale}
            mostPopularButton={
              <div className="w-[80px] pb-6 md:absolute top-0 md:right-12 mt-2 mr-2 z-10">
                <Button
                  title={t('mostPopularText')}
                  type="button"
                  variant="btn_step_subscription"
                  className="uppercase tracking-wider z-1"
                />
              </div>
            }
            plan={t('planPremium')}
            unit={t('priceUnit')}
            price={t('pricePremium')}
            time={t('priceTime')}
            description={t('pricePremiumDescription')}
            buttonLabel={t('buttonPremium')}
            featuresText={t('seeFeatures')}
            featuresItems={[
              t('coreFeaturesPremiumDescription'),
              t('coreFeaturesPremiumDescription2'),
              t('coreFeaturesPremiumDescription3'),
              t('coreFeaturesPremiumDescription4'),
              t('coreFeaturesPremiumDescription5'),
              t('coreFeaturesPremiumDescription6'),
            ]}
            customStyle="md:bg-white md:rounded-none md:z-10"
          />
          <PricingItem
            locale={locale}
            plan={t('planBusiness')}
            description={t('priceBusinessDescription')}
            buttonLabel={t('buttonBusiness')}
            icon={IMAGES.subscription.firstSection.suitcase}
            customButton={
              <LinkButton
                icon={IMAGES.home.firstSection.arrowButton}
                href={localizedPath(locale, '/contact')}
                title={t('buttonBusiness')}
                variant="btn_white_subscription_page"
                border="border-2 border-gray-500"
                height="py-3"
                paddingX="px-7"
                maxWidth="max-w-[80%] mx-auto"
                className="text-sm"
                iconClassName="w-auto h-auto"
              />
            }
            featuresText={t('seeFeatures')}
            featuresItems={[
              t('coreFeaturesBusinessDescription'),
              t('coreFeaturesBusinessDescription2'),
              t('coreFeaturesBusinessDescription3'),
              t('coreFeaturesBusinessDescription4'),
              t('coreFeaturesBusinessDescription5'),
              t('coreFeaturesBusinessDescription6'),
              t('coreFeaturesBusinessDescription7'),
            ]}
          />
        </div>
      </div>
    </FadeInOnVisible>
  );
};

export default FirstSection;