'use client';

import { IMAGES } from '@/constants/images';
import Image from 'next/image';
import { getTranslation, type Locale } from '@/utils/getDictionary';

type ArrowDropdownToggleProps = {
  isExpanded: boolean;
  locale: Locale;
};

const ArrowDropdownToggle = ({ isExpanded, locale }: ArrowDropdownToggleProps) => {
  const { t } = getTranslation('common', locale);

  return (
    <Image
      src={IMAGES.common.arrowDown}
      alt={t('dropdownArrowAlt')}
      className={`h-6 w-6 transition-transform duration-300 ease-in-out lg:h-4 lg:w-4 ${isExpanded ? 'rotate-180' : ''}`}
      width={24}
      height={24}
    />
  );
};

export default ArrowDropdownToggle;
