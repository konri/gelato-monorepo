import { getTranslation, type Locale } from '@/utils/getDictionary';
import type { WithLocale } from '@/types/locale';
import { localizedPath } from '@/utils/localizedPath';
import FadeInOnVisible from '@/hooks/FadeInOnVisible';
import LinkButton from '@/components/common/LinkButton';
import Image from 'next/image';
import { IMAGES } from '@/constants/images';

const ThirdSection = ({ locale }: WithLocale) => {
  const { t } = getTranslation('subscription', locale);

  return (
    <FadeInOnVisible className="relative mt-default-section-separator">
      <div className="flex flex-col md:flex-row items-center justify-center">
        <div className="md:w-1/2 p-6 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t('thirdSection.stillHaveQuestions')}</h2>
          <h3 className="text-xl md:text-2xl font-semibold mb-4">{t('thirdSection.contactUs')}</h3>
          <p className="text-gray-600 mb-6">{t('thirdSection.contactUsDescription')}</p>
          <LinkButton 
            href={localizedPath(locale, '/contact')} 
            title={t('thirdSection.contactUsButton')} 
            variant="btn_orange" 
          />
        </div>
        <div className="md:w-1/2 p-6 md:p-12">
          <Image
            src={IMAGES.contact.firstSection.figures2}
            alt={t('thirdSection.figures81Alt')} 
            width={500} 
            height={400} 
            className="w-full h-auto" 
          />
        </div>
      </div>
    </FadeInOnVisible>
  );
};

export default ThirdSection;