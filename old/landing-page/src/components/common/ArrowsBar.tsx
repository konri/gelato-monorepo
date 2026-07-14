import Image from 'next/image';
import { IMAGES } from '@/constants/images';
import { getTranslation, type Locale } from '@/utils/getDictionary';
import type { WithLocale } from '@/types/locale';
import { localizedPath } from '@/utils/localizedPath';

const ArrowsBar = ({ locale }: WithLocale) => {
  const { t } = getTranslation('home', locale);
  
  return (
    <div className="flex justify-center items-center gap-10 mt-20">
      <Image
        className="w-[40px] h-[16px]"
        src={IMAGES.home.ninthSection.leftArrow}
        alt={t('ninthSection.leftArrowAlt')}
        width={40}
        height={16}
      />
      <Image
        className="w-[40px] h-[16px]"
        src={IMAGES.home.ninthSection.rightArrow}
        alt={t('ninthSection.rightArrowAlt')}
        width={40}
        height={16}
      />
    </div>
  );
};

export default ArrowsBar;
