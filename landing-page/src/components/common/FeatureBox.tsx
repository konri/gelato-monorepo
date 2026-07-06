import React from 'react';
import { getTranslation, type Locale } from '@/utils/getDictionary';
import Image from 'next/image';

type FeatureBoxProps = {
  iconSrc: string;
  titleKey: string;
  descriptionKey: string;
  altKey: string;
  locale: Locale;
};

const FeatureBox = ({ iconSrc, titleKey, descriptionKey, altKey, locale }: FeatureBoxProps) => {
  const { t } = getTranslation('features', locale);

  return (
    <div className="flex flex-col items-start text-left py-4 ">
      <div className="flex justify-center items-center w-16 h-16 mb-[62px] rounded-full bg-[#748FB5]">
        <Image 
          src={iconSrc} 
          alt={t(altKey)} 
          className="w-8 h-auto" 
          width={32}
          height={32}
        />
      </div>
      <div className="pt-2 text-custom-gray text-[20px] font-bold text-left">
        {t(titleKey)}
      </div>
      <div className={`pt-2 text-custom-gray-light text-[16px] text-left max-w-[240px]`}>
        {t(descriptionKey)}
      </div>
    </div>
  );
};

export default FeatureBox;
